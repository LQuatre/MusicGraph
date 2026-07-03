import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Download, Check, AlertCircle, RefreshCw } from '../components/AnimatedIcon';

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  country?: string;
  score?: number;
  disambiguation?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
  };
  date?: string;
  status?: string;
  length?: number;
  artistCredit?: { name: string; artistMbid?: string }[];
}

interface SearchProps {
  apiUrl: string;
  onInspectArtist: (mbid: string) => void;
  onInspectRelease: (mbid: string) => void;
  onInspectRecording: (mbid: string) => void;
}

const Search: React.FC<SearchProps> = ({
  apiUrl,
  onInspectArtist,
  onInspectRelease,
  onInspectRecording
}) => {
  const [searchType, setSearchType] = useState<'artist' | 'release' | 'recording'>('artist');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [importedMbids, setImportedMbids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importingMbid, setImportingMbid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchImportedMbids = async () => {
    try {
      const endpoint = searchType === 'artist' ? 'artists' : searchType === 'release' ? 'releases' : 'recordings';
      const res = await fetch(`${apiUrl}/${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        const mbids = new Set<string>(data.map((item: any) => item.properties.mbid));
        setImportedMbids(mbids);
      }
    } catch (err) {
      console.error('Error fetching imported list:', err);
    }
  };

  useEffect(() => {
    fetchImportedMbids();
    setResults([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [searchType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResults([]);

    try {
      const endpoint = searchType === 'artist' ? 'artists' : searchType === 'release' ? 'releases' : 'recordings';
      const res = await fetch(`${apiUrl}/${endpoint}/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(`Erreur lors de la recherche sur MusicBrainz`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (mbid: string) => {
    setImportingMbid(mbid);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const endpoint = searchType === 'artist' ? 'artists' : searchType === 'release' ? 'releases' : 'recordings';
      const res = await fetch(`${apiUrl}/${endpoint}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mbid })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || "Erreur lors de l'importation");
      }

      const data = await res.json();
      
      let nameStr = '';
      if (searchType === 'artist') {
        nameStr = `L'artiste "${data.artistName}"`;
      } else if (searchType === 'release') {
        nameStr = `L'album "${data.releaseTitle}"`;
      } else {
        nameStr = `Le morceau "${data.recordingTitle}"`;
      }

      setSuccessMessage(`${nameStr} a bien été importé dans la base Neo4j avec ses relations.`);
      
      setImportedMbids((prev) => {
        const updated = new Set(prev);
        updated.add(mbid);
        return updated;
      });
    } catch (err: any) {
      setErrorMessage(`Échec de l'import : ${err.message}`);
    } finally {
      setImportingMbid(null);
    }
  };

  const formatLength = (ms?: number): string => {
    if (!ms) return 'N/A';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInspect = (mbid: string) => {
    if (searchType === 'artist') {
      onInspectArtist(mbid);
    } else if (searchType === 'release') {
      onInspectRelease(mbid);
    } else {
      onInspectRecording(mbid);
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'artist':
        return "Rechercher par nom d'artiste (ex: Booba, Stromae, Daft Punk, SCH...)";
      case 'release':
        return "Rechercher par titre d'album (ex: Trône, Random Access Memories...)";
      case 'recording':
        return "Rechercher par titre de morceau (ex: DKR, Get Lucky...)";
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Rechercher et Importer</h1>
      <p className="subtitle">
        Recherchez des entités dans la base de données internationale MusicBrainz et importez-les dans Neo4j.
      </p>

      {/* Capsule Tab Switcher */}
      <div style={{
        display: 'inline-flex',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        marginBottom: '2.5rem'
      }}>
        {(['artist', 'release', 'recording'] as const).map((type) => {
          const active = searchType === type;
          const label = type === 'artist' ? 'Artistes' : type === 'release' ? 'Albums' : 'Morceaux';
          return (
            <button
              key={type}
              type="button"
              className={`nav-link ${active ? 'active' : ''}`}
              onClick={() => setSearchType(type)}
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
                color: active ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                transition: 'color 150ms var(--ease-out)',
                borderRadius: '9999px'
              }}
            >
              {label}
              {active && (
                <motion.span
                  layoutId="active-search-tab"
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
          );
        })}
      </div>

      {/* Cockpit Search Box */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            <SearchIcon size={20} />
          </span>
          <input
            type="text"
            className="input-field"
            style={{ padding: '1rem 1.25rem' }}
            placeholder={getPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || importingMbid !== null}
          />
        </div>
        <button className="btn" type="submit" style={{ padding: '0 2rem' }} disabled={loading || importingMbid !== null || !query.trim()}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {/* Global Alerts */}
      {errorMessage && (
        <div
          className="fade-in"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          className="fade-in"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <Check size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Results Box */}
      {results.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: '#fff', letterSpacing: '-0.01em' }}>
            Résultats de recherche ({results.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {results.map((item, idx) => {
                const isImported = importedMbids.has(item.id);
                const isImportingThis = importingMbid === item.id;
                
                const title = item.name || item.title || 'Inconnu';
                const artistCreditsText = item.artistCredit 
                  ? `par ${item.artistCredit.map(c => c.name).join(', ')}`
                  : '';
                const subtitle = searchType === 'artist' 
                  ? item.disambiguation 
                  : artistCreditsText;

                let typeBadge = item.type;
                let countryBadge = item.country;
                
                let detailsText = `MBID: ${item.id}`;
                if (searchType === 'artist') {
                  if (item['life-span']?.begin) {
                    detailsText += ` | Activité : depuis ${item['life-span'].begin.split('-')[0]}`;
                  }
                } else if (searchType === 'release') {
                  if (item.date) {
                    detailsText += ` | Date : ${item.date.split('-')[0]}`;
                  }
                  if (item.status) {
                    detailsText += ` | Statut : ${item.status}`;
                  }
                } else if (searchType === 'recording') {
                  if (item.date) {
                    detailsText += ` | Date : ${item.date.split('-')[0]}`;
                  }
                  if (item.length) {
                    detailsText += ` | Durée : ${formatLength(item.length)}`;
                  }
                }

                return (
                  <motion.div
                    key={item.id}
                    className="list-item"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.25rem'
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2), ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span className="list-item-title" style={{ fontSize: '1.05rem', color: '#fff' }}>
                          {title}
                        </span>
                        {typeBadge && <span className="badge">{typeBadge}</span>}
                        {countryBadge && <span className="badge badge-primary">{countryBadge}</span>}
                      </div>
                      {subtitle && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {subtitle}
                        </p>
                      )}
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {detailsText}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isImported && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleInspect(item.id)}
                          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        >
                          Inspecter
                        </button>
                      )}

                      <button
                        className={`btn ${isImported ? 'btn-secondary' : ''}`}
                        disabled={isImportingThis || importingMbid !== null}
                        onClick={() => handleImport(item.id)}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.5rem 1.25rem',
                          minWidth: '150px',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isImportingThis ? (
                          <>
                            <RefreshCw size={14} className="spinner" />
                            Importation...
                          </>
                        ) : isImported ? (
                          <>
                            <RefreshCw size={14} />
                            Mettre à jour
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            Importer Neo4j
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem auto' }} />
          <span>Interrogation de la base de données MusicBrainz...</span>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Aucun résultat pour cette recherche. Essayez un autre mot-clé.
        </div>
      )}
    </div>
  );
};

export default Search;
