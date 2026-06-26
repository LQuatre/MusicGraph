import { Router, Request, Response } from 'express';
import { runRead } from '../config/database.js';

const router = Router();

// Help format nodes and edges for vis-network
interface VisNode {
  id: string;
  label: string;
  group: string;
  title?: string;
  value?: number; // Size/importance
}

interface VisEdge {
  from: string;
  to: string;
  label: string;
  arrows?: string;
  value?: number; // Thickness
  dashes?: boolean;
}

// Helper to convert Neo4j records into vis-network format
const formatGraphData = (records: any[]) => {
  const nodesMap = new Map<string, VisNode>();
  const edgesMap = new Map<string, VisEdge>();

  records.forEach((row) => {
    // Process source node
    if (row.sourceNode) {
      const s = row.sourceNode.properties;
      const sLabel = row.sourceNode.labels[0];
      const id = s.mbid || s.name;
      if (id && !nodesMap.has(id)) {
        nodesMap.set(id, {
          id,
          label: s.name || s.title,
          group: sLabel,
          title: `${sLabel}: ${s.name || s.title} ${s.type ? `(${s.type})` : ''}`
        });
      }
    }

    // Process target node
    if (row.targetNode) {
      const t = row.targetNode.properties;
      const tLabel = row.targetNode.labels[0];
      const id = t.mbid || t.name;
      if (id && !nodesMap.has(id)) {
        nodesMap.set(id, {
          id,
          label: t.name || t.title,
          group: tLabel,
          title: `${tLabel}: ${t.name || t.title} ${t.type ? `(${t.type})` : ''}`
        });
      }
    }

    // Process relationship
    if (row.rel) {
      const relType = row.rel.type;
      const from = row.rel.startNodeElementId || row.rel.start;
      const to = row.rel.endNodeElementId || row.rel.end;
      
      // We resolve database internal node elements to MBID/name
      const fromId = row.sourceMbid || row.sourceName;
      const toId = row.targetMbid || row.targetName;

      if (fromId && toId) {
        const edgeId = `${fromId}-${toId}-${relType}`;
        const reverseEdgeId = `${toId}-${fromId}-${relType}`;

        if (!edgesMap.has(edgeId) && !edgesMap.has(reverseEdgeId)) {
          const isUndirected = relType === 'COLLABORATED_WITH';
          const songCount = row.rel.properties?.count;

          edgesMap.set(edgeId, {
            from: fromId,
            to: toId,
            label: songCount ? `${relType} (${songCount})` : relType,
            arrows: isUndirected ? undefined : 'to',
            value: songCount ? Math.min(songCount, 5) : 1,
            dashes: relType === 'FEATURED_ON'
          });
        }
      }
    }
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values())
  };
};

// GET /api/graph/collaborations
// Returns only Artists and COLLABORATED_WITH relations (the clean collaboration network)
router.get('/collaborations', async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await runRead(`
      MATCH (a1:Artist)-[rel:COLLABORATED_WITH]->(a2:Artist)
      RETURN a1 as sourceNode, a2 as targetNode, rel,
             a1.mbid as sourceMbid, a2.mbid as targetMbid
      LIMIT 1000
    `);
    res.json(formatGraphData(records));
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la génération du graphe de collaborations', details: error.message });
  }
});

// GET /api/graph/artists/:mbid
// Returns the sub-graph centered around a specific artist (recordings, releases, areas, collaborations)
router.get('/artists/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const records = await runRead(`
      // Subgraph Query: Main artist & direct relationships
      MATCH (a:Artist {mbid: $mbid})
      OPTIONAL MATCH (a)-[rel:FROM_AREA|ASSOCIATED_WITH_GENRE]->(target)
      RETURN a as sourceNode, target as targetNode, rel,
             a.mbid as sourceMbid, coalesce(target.mbid, target.name) as targetMbid
      
      UNION
      
      MATCH (a:Artist {mbid: $mbid})
      OPTIONAL MATCH (a)-[rel:COLLABORATED_WITH]-(target:Artist)
      RETURN a as sourceNode, target as targetNode, rel,
             a.mbid as sourceMbid, target.mbid as targetMbid

      UNION

      MATCH (a:Artist {mbid: $mbid})-[relArtistRec:PERFORMED|FEATURED_ON]->(rec:Recording)
      OPTIONAL MATCH (rec)-[rel2:APPEARS_ON]->(release:Release)
      RETURN rec as sourceNode, release as targetNode, rel2 as rel,
             rec.mbid as sourceMbid, release.mbid as targetMbid
      LIMIT 150
    `, { mbid });

    // We also want to query the relations between the artist and recordings
    const recordRels = await runRead(`
      MATCH (a:Artist {mbid: $mbid})-[rel:PERFORMED|FEATURED_ON]->(rec:Recording)
      RETURN a as sourceNode, rec as targetNode, rel,
             a.mbid as sourceMbid, rec.mbid as targetMbid
    `, { mbid });

    const allRecords = [...records, ...recordRels];
    res.json(formatGraphData(allRecords));
  } catch (error: any) {
    res.status(500).json({ error: "Erreur lors de la génération du sous-graphe de l'artiste", details: error.message });
  }
});

// GET /api/graph
// Returns all node types and relations (limited to prevent rendering overload)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await runRead(`
      // 1. Get all Artists and their collaborations, areas, and genres
      MATCH (source:Artist)
      OPTIONAL MATCH (source)-[rel:COLLABORATED_WITH|FROM_AREA|ASSOCIATED_WITH_GENRE]->(target)
      RETURN source as sourceNode, target as targetNode, rel,
             source.mbid as sourceMbid, coalesce(target.mbid, target.name) as targetMbid

      UNION

      // 2. Get a limited number of Artist to Recording links
      MATCH (source:Artist)-[rel:PERFORMED|FEATURED_ON]->(target:Recording)
      RETURN source as sourceNode, target as targetNode, rel,
             source.mbid as sourceMbid, target.mbid as targetMbid
      LIMIT 1500

      UNION

      // 3. Get a limited number of Recording to Release links
      MATCH (source:Recording)-[rel:APPEARS_ON]->(target:Release)
      RETURN source as sourceNode, target as targetNode, rel,
             source.mbid as sourceMbid, target.mbid as targetMbid
      LIMIT 1500

      UNION

      // 4. Get a limited number of Release to Label or Area links
      MATCH (source:Release)-[rel:RELEASED_BY|RELEASED_IN]->(target)
      RETURN source as sourceNode, target as targetNode, rel,
             source.mbid as sourceMbid, coalesce(target.mbid, target.name) as targetMbid
      LIMIT 800
    `);
    res.json(formatGraphData(records));
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la génération du graphe global', details: error.message });
  }
});

// GET /api/graph/releases/:mbid
// Returns the local subgraph centered around a specific release (album)
router.get('/releases/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const records = await runRead(`
      MATCH (r:Release {mbid: $mbid})
      OPTIONAL MATCH (r)-[relArea:RELEASED_IN]->(ar:Area)
      RETURN r as sourceNode, ar as targetNode, relArea as rel,
             r.mbid as sourceMbid, coalesce(ar.mbid, ar.name) as targetMbid
      
      UNION
      
      MATCH (r:Release {mbid: $mbid})
      OPTIONAL MATCH (r)-[relLabel:RELEASED_BY]->(l:Label)
      RETURN r as sourceNode, l as targetNode, relLabel as rel,
             r.mbid as sourceMbid, l.mbid as targetMbid

      UNION

      MATCH (r:Release {mbid: $mbid})
      OPTIONAL MATCH (rec:Recording)-[relApp:APPEARS_ON]->(r)
      RETURN rec as sourceNode, r as targetNode, relApp as rel,
             rec.mbid as sourceMbid, r.mbid as targetMbid

      UNION

      MATCH (r:Release {mbid: $mbid})
      OPTIONAL MATCH (rec:Recording)-[:APPEARS_ON]->(r)
      OPTIONAL MATCH (a:Artist)-[relArtRec:PERFORMED|FEATURED_ON]->(rec)
      RETURN a as sourceNode, rec as targetNode, relArtRec as rel,
             a.mbid as sourceMbid, rec.mbid as targetMbid
    `, { mbid });

    res.json(formatGraphData(records));
  } catch (error: any) {
    res.status(500).json({ error: "Erreur lors de la génération du sous-graphe de l'album", details: error.message });
  }
});

// GET /api/graph/recordings/:mbid
// Returns the local subgraph centered around a specific recording (song)
router.get('/recordings/:mbid', async (req: Request, res: Response): Promise<void> => {
  const { mbid } = req.params;
  try {
    const records = await runRead(`
      MATCH (rec:Recording {mbid: $mbid})
      OPTIONAL MATCH (a:Artist)-[relArtRec:PERFORMED|FEATURED_ON]->(rec)
      RETURN a as sourceNode, rec as targetNode, relArtRec as rel,
             a.mbid as sourceMbid, rec.mbid as targetMbid

      UNION

      MATCH (rec:Recording {mbid: $mbid})
      OPTIONAL MATCH (rec)-[relApp:APPEARS_ON]->(r:Release)
      RETURN rec as sourceNode, r as targetNode, relApp as rel,
             rec.mbid as sourceMbid, r.mbid as targetMbid
    `, { mbid });

    res.json(formatGraphData(records));
  } catch (error: any) {
    res.status(500).json({ error: "Erreur lors de la génération du sous-graphe du morceau", details: error.message });
  }
});

export default router;
