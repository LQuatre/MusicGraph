import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from '../components/AnimatedIcon';

interface LibraryProps {
  apiUrl: string;
  onInspectRelease: (mbid: string) => void;
  onInspectRecording: (mbid: string) => void;
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

interface RecordingInfo {
  properties: {
    mbid: string;
    title: string;
    length?: number;
    firstReleaseDate?: string;
  };
  artists: string[];
}

const Library: React.FC<LibraryProps> = ({ apiUrl, onInspectRelease, onInspectRecording }) => {
  const [activeTab, setActiveTab] = useState<'releases' | 'recordings'>('releases');
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReleases = async () => {
    try {
      const res = await fetch(`${apiUrl}/releases`);
      if (res.ok) {
        const data = await res.json();
        setReleases(data);
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
    }
  };

  const fetchRecordings = async () => {
    try {
      const res = await fetch(`${apiUrl}/recordings`);
      if (res.ok) {
        const data = await res.json();
        setRecordings(data);
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchReleases(), fetchRecordings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatLength = (ms?: number): string => {
    if (!ms) return 'N/A';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredReleases = releases.filter((r) =>
    r.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.labels && r.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredRecordings = recordings.filter((r) =>
    r.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.artists && r.artists.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="fade-in">
      <h1>Médiathèque</h1>
      <p className="subtitle">
        Explorez tous les albums (releases) et morceaux (recordings) actuellement stockés dans la base de données Neo4j.
      </p>

      {/* Sliding Pill Tab Switcher */}
      <div style={{
        display: 'inline-flex',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        marginBottom: '2.5rem'
      }}>
        <button
          className={`nav-link ${activeTab === 'releases' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('releases');
            setSearchQuery('');
          }}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.6rem 1.25rem',
            color: activeTab === 'releases' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '600',
            transition: 'color 150ms var(--ease-out)',
            borderRadius: '9999px'
          }}
        >
          Albums / Releases ({releases.length})
          {activeTab === 'releases' && (
            <motion.span
              layoutId="active-library-tab"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '9999px',
                zIndex: -1
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          className={`nav-link ${activeTab === 'recordings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recordings');
            setSearchQuery('');
          }}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.6rem 1.25rem',
            color: activeTab === 'recordings' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '600',
            transition: 'color 150ms var(--ease-out)',
            borderRadius: '9999px'
          }}
        >
          Morceaux / Recordings ({recordings.length})
          {activeTab === 'recordings' && (
            <motion.span
              layoutId="active-library-tab"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '9999px',
                zIndex: -1
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Search Field */}
      <div className="input-group" style={{ marginBottom: '2.5rem', maxWidth: '500px' }}>
        <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: 'var(--text-muted)' }}>
          <Search size={18} />
        </span>
        <input
          type="text"
          className="input-field"
          placeholder={activeTab === 'releases' ? "Rechercher par titre d'album ou label..." : "Rechercher par titre de morceau ou artiste..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <span>Chargement des données...</span>
        </div>
      ) : activeTab === 'releases' ? (
        /* RELEASES LIST TAB */
        filteredReleases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Aucun album trouvé. Importez-en depuis l'onglet "Rechercher / Importer" !
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <AnimatePresence>
              {filteredReleases.map((release, idx) => {
                const { mbid, title, date, country, releaseType } = release.properties;
                return (
                  <motion.div
                    key={mbid}
                    className="card"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.25), ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', lineHeight: '1.3' }}>{title}</h3>
                        <span className="badge" style={{ flexShrink: 0 }}>{releaseType || 'Album'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Date</span>
                          <span style={{ color: '#fff', fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{date ? date.split('-')[0] : 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Région</span>
                          <span style={{ color: '#fff', fontWeight: '500' }}>{country || 'Inconnu'}</span>
                        </div>
                        {release.labels && release.labels.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Label</span>
                            <span style={{ color: '#fff', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>{release.labels.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => onInspectRelease(mbid)}
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Inspecter Album
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : (
        /* RECORDINGS LIST TAB */
        filteredRecordings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Aucun morceau trouvé. Importez-en depuis l'onglet "Rechercher / Importer" !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {filteredRecordings.map((recording, idx) => {
                const { mbid, title, length, firstReleaseDate } = recording.properties;
                return (
                  <motion.div
                    key={mbid}
                    className="list-item"
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '1rem 1.5rem' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2), ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>{title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Artistes : <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{recording.artists.join(', ')}</span>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Durée : {formatLength(length)} {firstReleaseDate ? ` | Date : ${firstReleaseDate.split('-')[0]}` : ''}
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => onInspectRecording(mbid)}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Détails
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
};

export default Library;
