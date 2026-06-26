import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';

interface GraphNode {
  id: string;
  label: string;
  group: string;
  title?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  arrows?: string;
  value?: number;
  dashes?: boolean;
}

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onArtistClick?: (mbid: string) => void;
  defaultVisibleGroups?: Record<string, boolean>;
}

const GraphView: React.FC<GraphViewProps> = ({
  nodes = [],
  edges = [],
  onArtistClick,
  defaultVisibleGroups
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [physicsEnabled, setPhysicsEnabled] = React.useState(true);
  const [visibleGroups, setVisibleGroups] = React.useState<Record<string, boolean>>({
    Artist: true,
    Genre: true,
    Area: true,
    Label: true,
    Recording: true,
    Release: true
  });

  React.useEffect(() => {
    if (defaultVisibleGroups) {
      setVisibleGroups(defaultVisibleGroups);
    } else {
      setVisibleGroups({
        Artist: true,
        Genre: true,
        Area: true,
        Label: true,
        Recording: true,
        Release: true
      });
    }
  }, [defaultVisibleGroups, nodes]);

  const toggleGroup = (group: string) => {
    setVisibleGroups((prev) => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];

    // Filter nodes based on visible groups
    const filteredNodes = safeNodes.filter((node) => visibleGroups[node.group] !== false);

    // Filter edges: only keep edges where both endpoints are visible
    const visibleNodeIds = new Set(filteredNodes.map((node) => node.id));
    const filteredEdges = safeEdges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to));

    // Map graph data to vis-network format
    const visNodes = new DataSet<any>(
      filteredNodes.map((node) => {
        let color = '#9ca3af'; // default gray
        let size = 15;

        // Custom colors for each group type
        switch (node.group) {
          case 'Artist':
            color = '#6366f1'; // Indigo
            size = 28;
            break;
          case 'Recording':
            color = '#a855f7'; // Purple
            size = 18;
            break;
          case 'Release':
            color = '#10b981'; // Emerald
            size = 22;
            break;
          case 'Genre':
            color = '#ec4899'; // Pink
            size = 15;
            break;
          case 'Area':
            color = '#f59e0b'; // Amber
            size = 18;
            break;
          case 'Label':
            color = '#06b6d4'; // Cyan
            size = 18;
            break;
        }

        return {
          id: node.id,
          label: node.label,
          title: node.title || `${node.group}: ${node.label}`,
          color: {
            background: color,
            border: '#111827',
            highlight: {
              background: '#ffffff',
              border: color
            },
            hover: {
              background: '#f3f4f6',
              border: color
            }
          },
          size,
          font: {
            color: '#f9fafb',
            face: 'Plus Jakarta Sans',
            size: 13,
            strokeWidth: 2,
            strokeColor: '#0b0f19'
          },
          borderWidth: 2,
          shape: node.group === 'Artist' ? 'dot' : 'dot'
        };
      })
    );

    const visEdges = new DataSet<any>(
      filteredEdges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        arrows: edge.arrows ? { to: { enabled: true, scaleFactor: 0.5 } } : undefined,
        color: {
          color: 'rgba(255, 255, 255, 0.15)',
          highlight: '#6366f1',
          hover: 'rgba(255, 255, 255, 0.4)'
        },
        font: {
          color: '#9ca3af',
          face: 'Plus Jakarta Sans',
          size: 9,
          align: 'middle',
          strokeWidth: 0
        },
        width: edge.value || 1.5,
        dashes: edge.dashes || false
      }))
    );

    const data = {
      nodes: visNodes,
      edges: visEdges
    };

    const options = {
      physics: {
        enabled: physicsEnabled,
        solver: 'barnesHut',
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1
        },
        stabilization: {
          enabled: true,
          iterations: 100,
          updateInterval: 25
        }
      },
      layout: {
        improvedLayout: false
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        selectable: true,
        dragNodes: true,
        zoomView: true,
        dragView: true
      }
    };

    // Initialize vis Network
    const network = new Network(containerRef.current, data as any, options);
    networkRef.current = network;

    // Handle click events
    network.on('doubleClick', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        
        // Find if this node is an artist
        const clickedNode = nodes.find((n) => n.id === nodeId);
        if (clickedNode && clickedNode.group === 'Artist' && onArtistClick) {
          onArtistClick(nodeId);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [nodes, edges, onArtistClick, visibleGroups, physicsEnabled]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="graph-legend" style={{ flexWrap: 'wrap', maxWidth: '85%' }}>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Artist}
            onChange={() => toggleGroup('Artist')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot legend-artist" />
          <span>Artiste</span>
        </label>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Recording}
            onChange={() => toggleGroup('Recording')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot legend-recording" />
          <span>Morceau</span>
        </label>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Release}
            onChange={() => toggleGroup('Release')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot legend-release" />
          <span>Album</span>
        </label>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Genre}
            onChange={() => toggleGroup('Genre')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot legend-genre" />
          <span>Genre</span>
        </label>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Area}
            onChange={() => toggleGroup('Area')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot legend-area" />
          <span>Région</span>
        </label>
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={!!visibleGroups.Label}
            onChange={() => toggleGroup('Label')}
            style={{ cursor: 'pointer' }}
          />
          <div className="legend-dot" style={{ background: '#06b6d4' }} />
          <span>Label</span>
        </label>
        <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.15)', margin: '0 0.5rem', height: '1.2rem' }} />
        <label className="legend-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontWeight: '600' }}>
          <input
            type="checkbox"
            checked={physicsEnabled}
            onChange={() => setPhysicsEnabled(!physicsEnabled)}
            style={{ cursor: 'pointer' }}
          />
          <span>Physique Active</span>
        </label>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(11, 15, 25, 0.7)',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#9ca3af',
          pointerEvents: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        Double-cliquez sur un artiste pour voir ses détails
      </div>
    </div>
  );
};

export default GraphView;
