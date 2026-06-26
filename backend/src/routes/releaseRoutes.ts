import { Router, Request, Response } from 'express';
import { runRead } from '../config/database.js';
import { searchReleases } from '../services/musicbrainz.js';
import { importRelease } from '../services/importer.js';

const router = Router();

// Search releases on MusicBrainz
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Le paramètre "query" est requis' });
    return;
  }
  try {
    const results = await searchReleases(query);
    res.json(results);
  } catch (error: any) {
    res.status(502).json({ error: 'Erreur lors de la recherche d\'albums', details: error.message });
  }
});

// Import release (album)
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.body;
  if (!mbid || typeof mbid !== 'string') {
    res.status(400).json({ error: 'Le paramètre "mbid" est requis' });
    return;
  }
  try {
    const result = await importRelease(mbid);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de l\'importation de l\'album', details: error.message });
  }
});

// Get all imported releases in base
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const releases = await runRead(`
      MATCH (r:Release)
      OPTIONAL MATCH (r)-[:RELEASED_BY]->(l:Label)
      RETURN r {.*} as properties, collect(DISTINCT l.name) as labels
      ORDER BY properties.title ASC
    `);
    res.json(releases);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des albums', details: error.message });
  }
});

// Get details of a single release
router.get('/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const result = await runRead(`
      MATCH (r:Release {mbid: $mbid})
      OPTIONAL MATCH (r)-[:RELEASED_BY]->(l:Label)
      WITH r, collect(DISTINCT l.name) as labels
      OPTIONAL MATCH (rec:Recording)-[:APPEARS_ON]->(r)
      OPTIONAL MATCH (a:Artist)-[rel:PERFORMED|FEATURED_ON]->(rec)
      WITH r, labels, rec, collect(DISTINCT a.name) as artistNames
      WITH r, labels, collect(DISTINCT rec {.*, artists: artistNames}) as tracks
      RETURN r {.*} as properties, labels, tracks
    `, { mbid });

    if (result.length === 0) {
      res.status(404).json({ error: 'Album non trouvé en base' });
      return;
    }
    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des détails de l\'album', details: error.message });
  }
});

export default router;
