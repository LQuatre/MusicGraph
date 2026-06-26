import React, { useState, useEffect } from 'react';
import GraphView from '../components/GraphView';
import ArtistCard from '../components/ArtistCard';
import type { ArtistInfo } from '../components/ArtistCard';
import { Network, Users, Disc, Layers, Search } from 'lucide-react';

interface HomeProps {
  onInspectArtist: (mbid: string) => void;
  apiUrl: string;
}

interface StatsOverview {
  artists: number;
  recordings: number;
  releases: number;
  labels: number;
  genres: number;
  collaborations: number;
}

const Home: React.FC<HomeProps> = ({ onInspectArtist, apiUrl }) => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [artists, setArtists] = useState<ArtistInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [graphType, setGraphType] = useState<'collab' | 'full'>('collab');
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Fetch Stats Overview
  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/stats/overview`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats overview:', err);
    }
  };

  // Fetch Imported Artists
  const fetchArtists = async () => {
    setLoadingArtists(true);
    try {
      const res = await fetch(`${apiUrl}/artists`);
      const data = await res.json();
      setArtists(data);
    } catch (err) {
      console.error('Error fetching artists list:', err);
    } finally {
      setLoadingArtists(false);
    }
  };

  // Fetch Graph Data
  const fetchGraph = async (type: 'collab' | 'full') => {
    setLoadingGraph(true);
    try {
      const endpoint = type === 'collab' ? 'collaborations' : '';
      const res = await fetch(`${apiUrl}/graph/${endpoint}`);
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<string | null>(null);

  const handleCrawl = async () => {
    setCrawling(true);
    setCrawlResult(null);
    try {
      const res = await fetch(`${apiUrl}/artists/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.imported && data.imported.length > 0) {
          setCrawlResult(`Succès : ${data.imported.join(', ')}`);
          fetchStats();
          fetchArtists();
          fetchGraph(graphType);
        } else {
          setCrawlResult("Aucun nouveau collaborateur français en attente.");
        }
      } else {
        setCrawlResult(`Erreur : ${data.details || data.error}`);
      }
    } catch (err: any) {
      setCrawlResult(`Erreur : ${err.message}`);
    } finally {
      setCrawling(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchArtists();
  }, []);

  useEffect(() => {
    fetchGraph(graphType);
  }, [graphType]);

  const filteredArtists = artists.filter((a) =>
    a.properties.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      {/* 1. Summary Stats Bar */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '8px' }}>
              <Users size={24} color="#6366f1" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Artistes Importés</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.artists}</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '0.75rem', borderRadius: '8px' }}>
              <Disc size={24} color="#a855f7" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enregistrements</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.recordings}</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '8px' }}>
              <Layers size={24} color="#10b981" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Albums / Releases</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.releases}</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '8px' }}>
              <Network size={24} color="#f59e0b" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Collaborations</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.collaborations}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Work Area (Graph + Artists sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '2rem' }}>
        
        {/* Left Column: Graph View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Explorateur de Relations</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {graphType === 'collab'
                  ? 'Visualisation exclusive du réseau de collaborations directes'
                  : 'Modèle de graphe complet incluant morceaux, albums et régions'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${graphType === 'collab' ? '' : 'btn-secondary'}`}
                onClick={() => setGraphType('collab')}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Collaborations
              </button>
              <button
                className={`btn ${graphType === 'full' ? '' : 'btn-secondary'}`}
                onClick={() => setGraphType('full')}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Graphe Complet
              </button>
            </div>
          </div>

          <div className="graph-container">
            {loadingGraph && (
              <div className="graph-loader">
                <div className="spinner" />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calcul de la simulation physique du graphe...</p>
              </div>
            )}
            <GraphView
              nodes={graphData.nodes}
              edges={graphData.edges}
              onArtistClick={onInspectArtist}
              defaultVisibleGroups={{
                Artist: true,
                Genre: true,
                Area: true,
                Label: true,
                Recording: false,
                Release: false
              }}
            />
          </div>
        </div>

        {/* Right Column: Sidebar Artist List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '680px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Artistes en Base</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>Étendre la scène</span>
              <button 
                className="btn" 
                onClick={handleCrawl} 
                disabled={crawling} 
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: 'var(--accent-color)', cursor: 'pointer' }}
              >
                {crawling ? 'Import...' : 'Crawl +5 FR'}
              </button>
            </div>
            {crawlResult && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: '1.3' }}>
                {crawlResult}
              </p>
            )}
          </div>

          <div className="input-group">
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="input-field"
              placeholder="Filtrer par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingRight: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              background: 'rgba(17, 24, 39, 0.4)'
            }}
          >
            {loadingArtists ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                Chargement de la liste...
              </div>
            ) : filteredArtists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Aucun artiste trouvé. Allez sur l'onglet de recherche pour en importer !
              </div>
            ) : (
              filteredArtists.map((artist) => (
                <ArtistCard
                  key={artist.properties.mbid}
                  artist={artist}
                  onInspect={onInspectArtist}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
