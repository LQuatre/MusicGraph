import { Router, Request, Response } from 'express';
import { runRead } from '../config/database.js';

const router = Router();

// GET /api/stats/overview
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const artistsCount = await runRead('MATCH (a:Artist) RETURN count(a) as count');
    const recordingsCount = await runRead('MATCH (r:Recording) RETURN count(r) as count');
    const releasesCount = await runRead('MATCH (rel:Release) RETURN count(rel) as count');
    const labelsCount = await runRead('MATCH (l:Label) RETURN count(l) as count');
    const genresCount = await runRead('MATCH (g:Genre) RETURN count(g) as count');
    const collabsCount = await runRead('MATCH ()-[r:COLLABORATED_WITH]->() RETURN count(r) as count');

    res.json({
      artists: artistsCount[0]?.count || 0,
      recordings: recordingsCount[0]?.count || 0,
      releases: releasesCount[0]?.count || 0,
      labels: labelsCount[0]?.count || 0,
      genres: genresCount[0]?.count || 0,
      collaborations: collabsCount[0]?.count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors du calcul de la vue d\'ensemble', details: error.message });
  }
});

// GET /api/stats/top-collaborations
router.get('/top-collaborations', async (req: Request, res: Response): Promise<void> => {
  try {
    const topCollabs = await runRead(`
      MATCH (a1:Artist)-[r:COLLABORATED_WITH]->(a2:Artist)
      WHERE id(a1) < id(a2) // Eviter les doublons a-b et b-a
      RETURN a1.name as artist1, a1.mbid as mbid1, a2.name as artist2, a2.mbid as mbid2, r.count as songCount
      ORDER BY songCount DESC
      LIMIT 10
    `);
    res.json(topCollabs);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des meilleures collaborations', details: error.message });
  }
});

// GET /api/stats/top-artists
// Centrality degree (who has the most connections in the collaboration network)
router.get('/top-artists', async (req: Request, res: Response): Promise<void> => {
  try {
    const topArtists = await runRead(`
      MATCH (a:Artist)-[r:COLLABORATED_WITH]-()
      RETURN a.name as name, a.mbid as mbid, count(r) as connections, sum(r.count) as totalSongs
      ORDER BY connections DESC, totalSongs DESC
      LIMIT 10
    `);
    res.json(topArtists);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors du calcul des artistes les plus connectés', details: error.message });
  }
});

// GET /api/stats/top-genres
router.get('/top-genres', async (req: Request, res: Response): Promise<void> => {
  try {
    const topGenres = await runRead(`
      MATCH (a:Artist)-[:ASSOCIATED_WITH_GENRE]->(g:Genre)
      RETURN g.name as genre, count(a) as artistCount
      ORDER BY artistCount DESC
      LIMIT 10
    `);
    res.json(topGenres);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des genres populaires', details: error.message });
  }
});

export default router;
