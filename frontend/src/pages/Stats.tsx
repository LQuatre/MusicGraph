import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsProps {
  apiUrl: string;
  onInspectArtist: (mbid: string) => void;
}

interface TopArtist {
  name: string;
  mbid: string;
  connections: number;
  totalSongs: number;
}

interface TopCollaboration {
  artist1: string;
  mbid1: string;
  artist2: string;
  mbid2: string;
  songCount: number;
}

interface TopGenre {
  genre: string;
  artistCount: number;
}

const Stats: React.FC<StatsProps> = ({ apiUrl, onInspectArtist }) => {
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topCollabs, setTopCollabs] = useState<TopCollaboration[]>([]);
  const [topGenres, setTopGenres] = useState<TopGenre[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatsData = async () => {
    setLoading(true);
    try {
      const artistRes = await fetch(`${apiUrl}/stats/top-artists`);
      const artistData = await artistRes.json();
      setTopArtists(artistData);

      const collabRes = await fetch(`${apiUrl}/stats/top-collaborations`);
      const collabData = await collabRes.json();
      setTopCollabs(collabData);

      const genreRes = await fetch(`${apiUrl}/stats/top-genres`);
      const genreData = await genreRes.json();
      setTopGenres(genreData);
    } catch (err) {
      console.error('Error fetching stats page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }} />
        <span>Calcul des analyses graphiques et de centralité...</span>
      </div>
    );
  }

  const maxConnections = topArtists.length > 0 ? Math.max(...topArtists.map((a) => a.connections)) : 1;
  const maxSongs = topCollabs.length > 0 ? Math.max(...topCollabs.map((c) => c.songCount)) : 1;
  const maxGenreArtists = topGenres.length > 0 ? Math.max(...topGenres.map((g) => g.artistCount)) : 1;

  return (
    <div className="fade-in">
      <h1>Statistiques & Analyses Data</h1>
      <p className="subtitle">
        Analyse de la centralité des artistes et modélisation statistique du graphe de collaborations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Row 1: Centrality Degree (Top Connected Artists) */}
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#fff' }}>
            Centralité de Degré (Artistes les plus connectés)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '80ch' }}>
            Cette mesure quantifie le nombre de collaborations uniques qu'un artiste possède dans la base de données. Plus le degré est élevé, plus l'artiste est central dans le réseau.
          </p>

          {topArtists.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              Aucun artiste collaborateur enregistré en base.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <AnimatePresence>
                {topArtists.map((artist, idx) => {
                  const widthPercent = (artist.connections / maxConnections) * 100;
                  return (
                    <motion.div
                      key={artist.mbid}
                      style={{ display: 'grid', gridTemplateColumns: '220px 1fr 140px', alignItems: 'center', gap: '2rem' }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.23, 1, 0.32, 1] }}
                    >
                      
                      {/* Rank & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', width: '28px', fontFamily: 'var(--font-mono)' }}>
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onInspectArtist(artist.mbid);
                          }}
                          style={{ color: '#fff', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem', transition: 'color 150ms var(--ease-out)' }}
                          className="hover-link"
                        >
                          {artist.name}
                        </a>
                      </div>

                      {/* Thin Progress Bar connection density */}
                      <div style={{ background: 'transparent', height: '2px', overflow: 'hidden' }}>
                        <motion.div
                          style={{
                            height: '100%',
                            background: 'var(--accent-primary)',
                            borderRadius: '9999px'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        />
                      </div>

                      {/* Meta stats */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '600', color: '#fff' }}>{artist.connections}</span> liens | {artist.totalSongs} titres
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Row 2: Two cards side by side: Top Collaborations & Genres */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          
          {/* Top Collaborations */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#fff' }}>
              Top Collaborations (Duos Fréquents)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Paires d'artistes ayant collaboré sur le plus grand nombre d'enregistrements.
            </p>

            {topCollabs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucune collaboration multiple trouvée.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <AnimatePresence>
                  {topCollabs.map((collab, idx) => {
                    const widthPercent = (collab.songCount / maxSongs) * 100;
                    return (
                      <motion.div
                        key={`${collab.mbid1}-${collab.mbid2}`}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <div>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); onInspectArtist(collab.mbid1); }}
                              style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}
                            >
                              {collab.artist1}
                            </a>
                            <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>&amp;</span>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); onInspectArtist(collab.mbid2); }}
                              style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}
                            >
                              {collab.artist2}
                            </a>
                          </div>
                          <span style={{ fontWeight: '500', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{collab.songCount} titres</span>
                        </div>
                        <div style={{ background: 'transparent', height: '2px', overflow: 'hidden' }}>
                          <motion.div
                            style={{
                              height: '100%',
                              background: 'var(--accent-primary)',
                              borderRadius: '9999px'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Top Genres */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#fff' }}>
              Répartition des Genres Principaux
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Genres musicaux les plus représentés parmi les artistes importés dans le graphe.
            </p>

            {topGenres.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucune étiquette de genre associée aux artistes en base.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <AnimatePresence>
                  {topGenres.map((genre, idx) => {
                    const widthPercent = (genre.artistCount / maxGenreArtists) * 100;
                    return (
                      <motion.div
                        key={genre.genre}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ textTransform: 'capitalize', color: '#fff', fontWeight: '500' }}>
                            {genre.genre}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {genre.artistCount} artiste{genre.artistCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ background: 'transparent', height: '2px', overflow: 'hidden' }}>
                          <motion.div
                            style={{
                              height: '100%',
                              background: 'var(--accent-primary)',
                              borderRadius: '9999px'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Stats;
