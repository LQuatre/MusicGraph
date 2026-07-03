import React, { useState, useEffect } from 'react';
import GraphView from '../components/GraphView';
import ArtistCard from '../components/ArtistCard';
import type { ArtistInfo } from '../components/ArtistCard';
import { Search } from '../components/AnimatedIcon';

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
      {/* 1. Bento Stats Overview */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Card 1: Artistes */}
          <div className="card" style={{
            gridColumn: 'span 3',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>{stats.artists}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artistes Importés</p>
          </div>

          {/* Card 2: Morceaux */}
          <div className="card" style={{
            gridColumn: 'span 3',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>{stats.recordings}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enregistrements</p>
          </div>

          {/* Card 3: Albums */}
          <div className="card" style={{
            gridColumn: 'span 3',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>{stats.releases}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Albums / Releases</p>
          </div>

          {/* Card 4: Collabs */}
          <div className="card" style={{
            gridColumn: 'span 3',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '2rem', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>{stats.collaborations}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collaborations</p>
          </div>
        </div>
      )}

      {/* 2. Main Work Area (Graph + Artists sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Graph View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Explorateur de Relations</h2>
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

          <div className="graph-container" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '720px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Artistes en Base</h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem', 
            background: 'rgba(99, 102, 241, 0.04)', 
            padding: '1.25rem', 
            borderRadius: '12px', 
            border: '1px solid rgba(99, 102, 241, 0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>Étendre la scène</span>
              <button 
                className="btn" 
                onClick={handleCrawl} 
                disabled={crawling} 
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
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
              paddingRight: '0.25rem',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              background: 'rgba(17, 24, 39, 0.2)',
              maxHeight: '420px'
            }}
          >
            {loadingArtists ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                Chargement de la liste...
              </div>
            ) : filteredArtists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Aucun artiste trouvé.
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
