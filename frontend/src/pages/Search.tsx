import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Download, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface SearchResult {
  id: string;
  name?: string; // Artists have name
  title?: string; // Releases/Recordings have title
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

  // Fetch already imported MBIDs based on active search type
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
      
      // Update imported list
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

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Rechercher et Importer</h1>
      <p className="subtitle">
        Recherchez des entités dans la base de données internationale MusicBrainz et importez-les dans Neo4j.
      </p>

      {/* Tabs selectors for Search Type */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`btn ${searchType === 'artist' ? '' : 'btn-secondary'}`}
          onClick={() => setSearchType('artist')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          Artistes
        </button>
        <button
          type="button"
          className={`btn ${searchType === 'release' ? '' : 'btn-secondary'}`}
          onClick={() => setSearchType('release')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          Albums / Releases
        </button>
        <button
          type="button"
          className={`btn ${searchType === 'recording' ? '' : 'btn-secondary'}`}
          onClick={() => setSearchType('recording')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          Morceaux / Recordings
        </button>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: 'var(--text-muted)' }}>
            <SearchIcon size={20} />
          </span>
          <input
            type="text"
            className="input-field"
            placeholder={
              searchType === 'artist'
                ? "Rechercher par nom d'artiste (ex: Booba, Stromae, Daft Punk, SCH...)"
                : searchType === 'release'
                ? "Rechercher par titre d'album (ex: Trône, L'école des points vitaux, Random Access Memories...)"
                : "Rechercher par titre de morceau (ex: DKR, Wati by Night, Get Lucky...)"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading || importingMbid !== null}
          />
        </div>
        <button className="btn" type="submit" disabled={loading || importingMbid !== null || !query.trim()}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {/* Global Alerts */}
      {errorMessage && (
        <div
          className="fade-in"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
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
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Check size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Results Box */}
      {results.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>
            Résultats de recherche ({results.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((item) => {
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
                <div
                  key={item.id}
                  className="list-item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem'
                  }}
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
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
