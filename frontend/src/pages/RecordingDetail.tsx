import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GraphView from '../components/GraphView';
import { ArrowLeft, ShieldAlert, RefreshCw } from '../components/AnimatedIcon';

interface ArtistCredit {
  mbid: string;
  name: string;
  type: 'PERFORMED' | 'FEATURED_ON';
}

interface ReleaseInfo {
  mbid: string;
  title: string;
  date?: string;
  country?: string;
  releaseType?: string;
}

interface RecordingDetailProps {
  mbid: string;
  apiUrl: string;
  onBack: () => void;
  onInspectArtist: (mbid: string) => void;
  onInspectRelease: (mbid: string) => void;
}

const RecordingDetail: React.FC<RecordingDetailProps> = ({
  mbid,
  apiUrl,
  onBack,
  onInspectArtist,
  onInspectRelease
}) => {
  const [recording, setRecording] = useState<any | null>(null);
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
      const res = await fetch(`${apiUrl}/recordings/import`, {
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
      await Promise.all([fetchRecordingData(), fetchSubgraph()]);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      setSyncError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setSyncing(false);
    }
  };

  const fetchRecordingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/recordings/${mbid}`);
      if (!res.ok) throw new Error("Morceau non trouvé dans la base Neo4j");
      const data = await res.json();
      setRecording(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubgraph = async () => {
    setLoadingGraph(true);
    try {
      const res = await fetch(`${apiUrl}/graph/recordings/${mbid}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération du graphe");
      const data = await res.json();
      setGraphData(data && Array.isArray(data.nodes) ? data : { nodes: [], edges: [] });
    } catch (err) {
      console.error('Error fetching recording subgraph:', err);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchRecordingData();
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
        <span>Chargement des détails du morceau...</span>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="fade-in">
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Erreur de chargement</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || "Le morceau n'a pas pu être chargé."}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour à la médiathèque
        </button>
      </div>
    );
  }

  const { title, length, firstReleaseDate } = recording.properties;
  const artists: ArtistCredit[] = recording.artists || [];
  const releases: ReleaseInfo[] = recording.releases || [];

  const mainPerformers = artists.filter((a) => a.type === 'PERFORMED');
  const featuredPerformers = artists.filter((a) => a.type === 'FEATURED_ON');

  return (
    <div className="fade-in">
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          Exploration de graphe &gt; Morceau &gt; {title}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Metadata & Linked Albums */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Metadata Card */}
          <div className="card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date de publication</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{firstReleaseDate || 'Inconnue'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Durée</span>
                <span style={{ color: '#fff', fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{formatLength(length)}</span>
              </div>
              
              {/* Artists Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                  Crédits Artistes :
                </span>
                
                {/* Main Performers */}
                {mainPerformers.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interprète(s) principal : </span>
                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                      {mainPerformers.map((a) => (
                        <span
                          key={a.mbid}
                          className="badge badge-primary hover-link"
                          onClick={() => onInspectArtist(a.mbid)}
                          style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Featuring Performers */}
                {featuredPerformers.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Featuring / Invité(s) : </span>
                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                      {featuredPerformers.map((a) => (
                        <span
                          key={a.mbid}
                          className="badge badge-secondary hover-link"
                          onClick={() => onInspectArtist(a.mbid)}
                          style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleSync}
              disabled={syncing}
              style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.6rem 0' }}
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Mettre à jour le morceau
                </>
              )}
            </button>
            
            {syncError && (
              <div className="fade-in" style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '0.8rem' }}>
                {syncError}
              </div>
            )}
            {syncSuccess && (
              <div className="fade-in" style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', fontSize: '0.8rem' }}>
                Morceau mis à jour avec succès !
              </div>
            )}
          </div>

          {/* Linked Releases Card */}
          <div className="card" style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>
              Apparaît sur les albums ({releases.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {releases.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  Ce morceau n'est relié à aucun album.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <AnimatePresence>
                    {releases.map((release, i) => (
                      <motion.div
                        key={release.mbid}
                        className="list-item"
                        style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25), ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div>
                          <span
                            className="hover-link"
                            onClick={() => onInspectRelease(release.mbid)}
                            style={{ fontWeight: '600', color: '#fff', cursor: 'pointer' }}
                          >
                            {release.title}
                          </span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                            Type : {release.releaseType || 'Album'} {release.country ? ` | Région : ${release.country}` : ''}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Local Graph View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>Réseau Graphique du Morceau</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Visualisation des collaborations, des albums liés et de l'ensemble des relations directes.
              </p>
            </div>
            
            <div className="graph-container" style={{ height: '550px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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

export default RecordingDetail;
