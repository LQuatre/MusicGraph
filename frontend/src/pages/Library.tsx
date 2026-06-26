import React, { useState, useEffect } from 'react';
import { Disc, Music, Search, Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';

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

  // Format track length from ms to min:sec
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

      {/* Main Tabs Selection */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
        <button
          className={`nav-link ${activeTab === 'releases' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('releases');
            setSearchQuery('');
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.5rem 1rem' }}
        >
          <Disc size={20} />
          Albums / Releases ({releases.length})
        </button>
        <button
          className={`nav-link ${activeTab === 'recordings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recordings');
            setSearchQuery('');
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.5rem 1rem' }}
        >
          <Music size={20} />
          Morceaux / Recordings ({recordings.length})
        </button>
      </div>

      {/* Search Field */}
      <div className="input-group" style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredReleases.map((release) => {
              const { mbid, title, date, country, releaseType } = release.properties;
              return (
                <div key={mbid} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', lineHeight: '1.3' }}>{title}</h3>
                      <span className="badge" style={{ flexShrink: 0 }}>{releaseType || 'Album'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} />
                        <span>Date : {date ? date.split('-')[0] : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} />
                        <span>Région : {country || 'Inconnu'}</span>
                      </div>
                      {release.labels && release.labels.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Tag size={14} />
                          <span>Label : {release.labels.join(', ')}</span>
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
                </div>
              );
            })}
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
            {filteredRecordings.map((recording) => {
              const { mbid, title, length, firstReleaseDate } = recording.properties;
              return (
                <div key={mbid} className="list-item" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '1rem 1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>{title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Artistes : <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{recording.artists.join(', ')}</span>
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
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default Library;
