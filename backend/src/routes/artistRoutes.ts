import { Router, Request, Response } from 'express';
import { runRead } from '../config/database.js';
import { searchArtists } from '../services/musicbrainz.js';
import { importArtist } from '../services/importer.js';
import { searchDemoArtists } from '../services/demoCatalog.js';

const router = Router();

// Search artists on MusicBrainz API
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Le paramètre de recherche "query" est requis' });
    return;
  }
  try {
    const results = await searchArtists(query);
    res.json(results);
  } catch (error: any) {
    console.error(`[Search] MusicBrainz API failed:`, error.message);
    res.status(502).json({ error: 'Erreur lors de la recherche sur MusicBrainz', details: error.message });
  }
});

// Import an artist and its relationships from MusicBrainz into Neo4j
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.body;
  if (!mbid || typeof mbid !== 'string') {
    res.status(400).json({ error: 'Le paramètre "mbid" est requis dans le corps de la requête' });
    return;
  }
  try {
    const result = await importArtist(mbid);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Erreur lors de l'importation de l'artiste", details: error.message });
  }
});

// Crawl and import a batch of French collaborator skeleton artists
router.post('/crawl', async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.body.limit as string) || 5;
  if (limit <= 0 || limit > 20) {
    res.status(400).json({ error: 'La limite doit être comprise entre 1 et 20' });
    return;
  }

  try {
    const skeletons = await runRead(`
      MATCH (a:Artist)
      WHERE a.lastImported IS NULL AND a.country = 'FR'
      RETURN a.mbid as mbid, a.name as name
      LIMIT toInteger($limit)
    `, { limit });

    if (skeletons.length === 0) {
      res.json({ message: "Aucun nouvel artiste français en attente d'importation dans la base.", imported: [] });
      return;
    }

    const imported: string[] = [];
    const errors: string[] = [];

    for (const artist of skeletons) {
      try {
        console.log(`[Crawler] Import automatique de l'artiste : ${artist.name} (${artist.mbid})`);
        await importArtist(artist.mbid);
        imported.push(artist.name);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err: any) {
        console.error(`[Crawler] Échec de l'import pour ${artist.name} :`, err.message);
        errors.push(`${artist.name}: ${err.message}`);
      }
    }

    res.json({
      message: `${imported.length} artistes importés avec succès.`,
      imported,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors du crawl des collaborations', details: error.message });
  }
});

// Get all imported artists in Neo4j
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const artists = await runRead(`
      MATCH (a:Artist)
      OPTIONAL MATCH (a)-[:FROM_AREA]->(ar:Area)
      OPTIONAL MATCH (a)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
      RETURN a {.*} as properties, ar {.*} as area, collect(g.name) as genres
      ORDER BY properties.name ASC
    `);
    res.json(artists);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des artistes', details: error.message });
  }
});

// Get a single imported artist details
router.get('/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const result = await runRead(`
      MATCH (a:Artist {mbid: $mbid})
      OPTIONAL MATCH (a)-[:FROM_AREA]->(ar:Area)
      OPTIONAL MATCH (a)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
      RETURN a {.*} as properties, ar {.*} as area, collect(g.name) as genres
    `, { mbid });

    if (result.length === 0) {
      res.status(404).json({ error: 'Artiste non trouvé en base' });
      return;
    }
    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'artiste", details: error.message });
  }
});

// Get recordings performed/featured by an artist
router.get('/:mbid/recordings', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const recordings = await runRead(`
      MATCH (a:Artist {mbid: $mbid})
      OPTIONAL MATCH (a)-[r:PERFORMED]->(rec:Recording)
      OPTIONAL MATCH (rec)-[:APPEARS_ON]->(rel:Release)
      WITH rec, rel, 'PERFORMED' as type WHERE rec IS NOT NULL
      RETURN rec {.*} as properties, type, collect(rel.title) as releases
      UNION
      MATCH (a:Artist {mbid: $mbid})
      OPTIONAL MATCH (a)-[r:FEATURED_ON]->(rec:Recording)
      OPTIONAL MATCH (rec)-[:APPEARS_ON]->(rel:Release)
      WITH rec, rel, 'FEATURED_ON' as type WHERE rec IS NOT NULL
      RETURN rec {.*} as properties, type, collect(rel.title) as releases
    `, { mbid });
    res.json(recordings);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des morceaux', details: error.message });
  }
});

// Get releases associated with an artist
router.get('/:mbid/releases', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const releases = await runRead(`
      MATCH (a:Artist {mbid: $mbid})
      MATCH (a)-[:PERFORMED|FEATURED_ON]->(:Recording)-[:APPEARS_ON]->(rel:Release)
      OPTIONAL MATCH (rel)-[:RELEASED_BY]->(l:Label)
      RETURN DISTINCT rel {.*} as properties, collect(DISTINCT l.name) as labels
      ORDER BY properties.date DESC
    `, { mbid });
    res.json(releases);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des albums', details: error.message });
  }
});

// Get direct collaborations of an artist
router.get('/:mbid/collaborations', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const collaborations = await runRead(`
      MATCH (a:Artist {mbid: $mbid})-[r:COLLABORATED_WITH]-(c:Artist)
      RETURN c {.*} as properties, r.count as songCount
      ORDER BY songCount DESC
    `, { mbid });
    res.json(collaborations);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des collaborations', details: error.message });
  }
});

export default router;
