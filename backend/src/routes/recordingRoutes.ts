import { Router, Request, Response } from 'express';
import { runRead } from '../config/database.js';
import { searchRecordings } from '../services/musicbrainz.js';
import { importRecording } from '../services/importer.js';

const router = Router();

// Search recordings on MusicBrainz
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Le paramètre "query" est requis' });
    return;
  }
  try {
    const results = await searchRecordings(query);
    res.json(results);
  } catch (error: any) {
    res.status(502).json({ error: 'Erreur lors de la recherche de morceaux', details: error.message });
  }
});

// Import recording (song)
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.body;
  if (!mbid || typeof mbid !== 'string') {
    res.status(400).json({ error: 'Le paramètre "mbid" est requis' });
    return;
  }
  try {
    const result = await importRecording(mbid);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de l\'importation du morceau', details: error.message });
  }
});

// Get all imported recordings in base (limited to 500 for performance)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const recordings = await runRead(`
      MATCH (rec:Recording)
      OPTIONAL MATCH (a:Artist)-[:PERFORMED|FEATURED_ON]->(rec)
      RETURN rec {.*} as properties, collect(DISTINCT a.name) as artists
      ORDER BY properties.title ASC
      LIMIT 500
    `);
    res.json(recordings);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des morceaux', details: error.message });
  }
});

// Get details of a single recording
router.get('/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const result = await runRead(`
      MATCH (rec:Recording {mbid: $mbid})
      OPTIONAL MATCH (a:Artist)-[rel:PERFORMED|FEATURED_ON]->(rec)
      WITH rec, collect(DISTINCT {mbid: a.mbid, name: a.name, type: type(rel)}) as artists
      OPTIONAL MATCH (rec)-[:APPEARS_ON]->(r:Release)
      WITH rec, artists, collect(DISTINCT r {.*}) as releases
      RETURN rec {.*} as properties, artists, releases
    `, { mbid });

    if (result.length === 0) {
      res.status(404).json({ error: 'Morceau non trouvé en base' });
      return;
    }
    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des détails du morceau', details: error.message });
  }
});

export default router;
