import React, { useState, useEffect } from 'react';
import GraphView from '../components/GraphView';
import { ArrowLeft, Calendar, MapPin, Tag, Disc, Music, ShieldAlert, RefreshCw } from 'lucide-react';

interface TrackInfo {
  mbid: string;
  title: string;
  length?: number;
  firstReleaseDate?: string;
  artists: string[];
}

interface ReleaseDetailProps {
  mbid: string;
  apiUrl: string;
  onBack: () => void;
  onInspectArtist: (mbid: string) => void;
  onInspectRecording: (mbid: string) => void;
}

const ReleaseDetail: React.FC<ReleaseDetailProps> = ({
  mbid,
  apiUrl,
  onBack,
  onInspectArtist,
  onInspectRecording
}) => {
  const [release, setRelease] = useState<any | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      const res = await fetch(`${apiUrl}/releases/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mbid })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || "Erreur lors de la mise à jour");
      }
      setSyncSuccess(true);
      await Promise.all([fetchReleaseData(), fetchSubgraph()]);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      setSyncError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setSyncing(false);
    }
  };

  const fetchReleaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/releases/${mbid}`);
      if (!res.ok) throw new Error("Album non trouvé dans la base Neo4j");
      const data = await res.json();
      setRelease(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubgraph = async () => {
    setLoadingGraph(true);
    try {
      const res = await fetch(`${apiUrl}/graph/releases/${mbid}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération du graphe");
      const data = await res.json();
      setGraphData(data && Array.isArray(data.nodes) ? data : { nodes: [], edges: [] });
    } catch (err) {
      console.error('Error fetching release subgraph:', err);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchReleaseData();
    fetchSubgraph();
  }, [mbid]);

  const formatLength = (ms?: number): string => {
    if (!ms) return 'N/A';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
        <span>Chargement des détails de l'album...</span>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="fade-in">
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Erreur de chargement</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || "L'album n'a pas pu être chargé."}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour à la médiathèque
        </button>
      </div>
    );
  }

  const { title, date, country, releaseType } = release.properties;
  const labels = release.labels || [];
  const tracks: TrackInfo[] = release.tracks || [];

  return (
    <div className="fade-in">
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Exploration de graphe &gt; Album &gt; {title}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '2rem' }}>
        
        {/* Left Column: Album Info & Tracks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Metadata Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Disc size={28} color="var(--accent-color)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 }}>{title}</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} color="#10b981" />
                <span>Date de sortie : {date || 'Inconnue'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={18} color="#f59e0b" />
                <span>Zone géographique : {country || 'Inconnue'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Tag size={18} color="#06b6d4" />
                <span>Type : {releaseType || 'Album'}</span>
              </div>
              {labels.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Tag size={18} color="#ec4899" />
                  <span>Labels : {labels.join(', ')}</span>
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleSync}
              disabled={syncing}
              style={{ width: '100%', marginTop: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.6rem 0' }}
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Mettre à jour l'album
                </>
              )}
            </button>
            
            {syncError && (
              <div className="fade-in" style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem' }}>
                {syncError}
              </div>
            )}
            {syncSuccess && (
              <div className="fade-in" style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.8rem' }}>
                Album mis à jour avec succès !
              </div>
            )}
          </div>

          {/* Tracks Card */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Music size={18} />
              Liste des pistes ({tracks.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {tracks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  Aucune piste enregistrée pour cet album.
                </p>
              ) : (
                tracks.map((track, i) => (
                  <div
                    key={track.mbid}
                    className="list-item"
                    style={{ padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center', fontSize: '0.9rem' }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{i + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <span
                        className="hover-link"
                        onClick={() => onInspectRecording(track.mbid)}
                        style={{ fontWeight: '600', color: '#fff', cursor: 'pointer', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                      >
                        {track.title}
                      </span>
                      {track.artists && track.artists.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          par {track.artists.join(', ')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatLength(track.length)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Local Graph View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Réseau Graphique de l'Album</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualisation des morceaux de l'album, leurs artistes crédités, sa maison de disques et sa région de publication.
              </p>
            </div>
            
            <div className="graph-container" style={{ height: '550px' }}>
              {loadingGraph && (
                <div className="graph-loader">
                  <div className="spinner" />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Chargement du graphe local...</p>
                </div>
              )}
              <GraphView
                nodes={graphData.nodes}
                edges={graphData.edges}
                onArtistClick={onInspectArtist}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReleaseDetail;
