import React, { useState, useEffect } from 'react';
import GraphView from '../components/GraphView';
import { ArrowLeft, Users, Calendar, MapPin, Tag, Disc, Music, ShieldAlert, RefreshCw } from 'lucide-react';
import type { ArtistInfo } from '../components/ArtistCard';

interface ArtistDetailProps {
  mbid: string;
  onBack: () => void;
  onInspectArtist: (mbid: string) => void;
  apiUrl: string;
}

interface RecordingInfo {
  properties: {
    mbid: string;
    title: string;
    length?: number;
    firstReleaseDate?: string;
  };
  type: 'PERFORMED' | 'FEATURED_ON';
  releases: string[];
}

interface ReleaseInfo {
  properties: {
    mbid: string;
    title: string;
    date?: string;
    country?: string;
    releaseType?: string;
  };
  labels: string[];
}

interface CollaborationInfo {
  properties: {
    mbid: string;
    name: string;
    type?: string;
    country?: string;
  };
  songCount: number;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ mbid, onBack, onInspectArtist, apiUrl }) => {
  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationInfo[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'releases'>('tracks');
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
      const res = await fetch(`${apiUrl}/artists/import`, {
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
      await Promise.all([fetchArtistData(), fetchSubgraph()]);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      setSyncError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setSyncing(false);
    }
  };

  const fetchArtistData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch details
      const detailRes = await fetch(`${apiUrl}/artists/${mbid}`);
      if (!detailRes.ok) throw new Error("Artiste non trouvé dans la base Neo4j");
      const detailData = await detailRes.json();
      setArtist(detailData);

      // 2. Fetch tracks
      const recRes = await fetch(`${apiUrl}/artists/${mbid}/recordings`);
      if (!recRes.ok) throw new Error("Erreur lors de la récupération des morceaux");
      const recData = await recRes.json();
      setRecordings(Array.isArray(recData) ? recData : []);

      // 3. Fetch releases
      const relRes = await fetch(`${apiUrl}/artists/${mbid}/releases`);
      if (!relRes.ok) throw new Error("Erreur lors de la récupération des albums");
      const relData = await relRes.json();
      setReleases(Array.isArray(relData) ? relData : []);

      // 4. Fetch collaborations
      const collabRes = await fetch(`${apiUrl}/artists/${mbid}/collaborations`);
      if (!collabRes.ok) throw new Error("Erreur lors de la récupération des collaborations");
      const collabData = await collabRes.json();
      setCollaborations(Array.isArray(collabData) ? collabData : []);

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubgraph = async () => {
    setLoadingGraph(true);
    try {
      const graphRes = await fetch(`${apiUrl}/graph/artists/${mbid}`);
      if (!graphRes.ok) throw new Error("Erreur lors de la récupération du graphe");
      const graphData = await graphRes.json();
      setGraphData(graphData && Array.isArray(graphData.nodes) ? graphData : { nodes: [], edges: [] });
    } catch (err) {
      console.error('Error fetching artist subgraph:', err);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchArtistData();
    fetchSubgraph();
  }, [mbid]);

  // Format track length from ms to min:sec
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
        <span>Chargement du profil de l'artiste...</span>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="fade-in">
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Erreur de chargement</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error || "L'artiste n'a pas pu être chargé."}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const { name, type, country, beginDate, endDate, disambiguation, source } = artist.properties;
  const genres = artist.genres || [];
  const areaName = artist.area?.name || country;

  return (
    <div className="fade-in">
      {/* Top action header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Exploration de graphe &gt; {name}
        </span>
      </div>

      {/* Main artist detail section */}
      <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '2rem' }}>
        
        {/* Left Column: Metadata, Genres, Collaborators list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>{name}</h2>
            {disambiguation && (
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                "{disambiguation}"
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={18} color="#6366f1" />
                <span>Type : {type || 'Inconnu'}</span>
              </div>
              {areaName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MapPin size={18} color="#f59e0b" />
                  <span>Origine : {areaName}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} color="#10b981" />
                <span>
                  Activité : {beginDate ? beginDate : '?'}
                  {endDate ? ` à ${endDate}` : ' à aujourd\'hui'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Source : {source}</span>
                <span>|</span>
                <span>MBID : {mbid}</span>
              </div>
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
                  Mettre à jour l'artiste
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
                Artiste mis à jour avec succès !
              </div>
            )}
          </div>

          {/* Genres Section */}
          {genres.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={16} color="#ec4899" />
                Genres Associés
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {genres.map((genre) => (
                  <span key={genre} className="badge badge-secondary">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collaborations Section */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#6366f1" />
              Collaborateurs directs ({collaborations.length})
            </h3>
            {collaborations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Aucune collaboration directe détectée pour cet artiste dans notre base.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}
              >
                {collaborations.map((collab) => (
                  <div
                    key={collab.properties.mbid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.8rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onInspectArtist(collab.properties.mbid);
                      }}
                      style={{ color: '#fff', textDecoration: 'none', fontWeight: '600' }}
                    >
                      {collab.properties.name}
                    </a>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      {collab.songCount} collab{collab.songCount > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Sub-graph and Detailed lists (Tracks / Releases) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Visual sub-graph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Sous-graphe Relationnel</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Réseau de premier niveau autour de {name}. Double-cliquez sur un autre artiste pour explorer son réseau.
            </p>
            <div className="graph-container" style={{ height: '420px' }}>
              {loadingGraph && (
                <div className="graph-loader">
                  <div className="spinner" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Génération du réseau local...</p>
                </div>
              )}
              <GraphView
                nodes={graphData.nodes}
                edges={graphData.edges}
                onArtistClick={onInspectArtist}
              />
            </div>
          </div>

          {/* Bottom Tabs: Tracks & Releases lists */}
          <div className="card">
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                className={`nav-link ${activeSubTab === 'tracks' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('tracks')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Music size={16} />
                Morceaux ({recordings.length})
              </button>
              <button
                className={`nav-link ${activeSubTab === 'releases' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('releases')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Disc size={16} />
                Albums / Releases ({releases.length})
              </button>
            </div>

            {/* Tab content: Recordings list */}
            {activeSubTab === 'tracks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {recordings.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
                    Aucun morceau enregistré en base pour cet artiste.
                  </p>
                ) : (
                  recordings.map((rec) => (
                    <div
                      key={rec.properties.mbid}
                      className="list-item"
                      style={{ padding: '0.8rem 1rem', fontSize: '0.9rem' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: '#fff' }}>{rec.properties.title}</span>
                          <span className={`badge ${rec.type === 'FEATURED_ON' ? 'badge-secondary' : 'badge-primary'}`} style={{ fontSize: '0.6rem' }}>
                            {rec.type === 'FEATURED_ON' ? 'Featuring' : 'Interprète'}
                          </span>
                        </div>
                        {rec.releases && rec.releases.length > 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Présent sur : {rec.releases.join(', ')}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatLength(rec.properties.length)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab content: Releases list */}
            {activeSubTab === 'releases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {releases.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
                    Aucun album ou release enregistré en base pour cet artiste.
                  </p>
                ) : (
                  releases.map((rel) => (
                    <div
                      key={rel.properties.mbid}
                      className="list-item"
                      style={{ padding: '0.8rem 1rem', fontSize: '0.9rem' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: '#fff' }}>{rel.properties.title}</span>
                          {rel.properties.releaseType && (
                            <span className="badge" style={{ fontSize: '0.6rem' }}>
                              {rel.properties.releaseType}
                            </span>
                          )}
                        </div>
                        {rel.labels && rel.labels.length > 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Label : {rel.labels.join(', ')}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>{rel.properties.date ? rel.properties.date.split('-')[0] : 'N/A'}</div>
                        {rel.properties.country && <div>{rel.properties.country}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ArtistDetail;
