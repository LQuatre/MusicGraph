import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Network } from 'lucide-react';

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

  // Calculate max values to scale the CSS progress bars
  const maxConnections = topArtists.length > 0 ? Math.max(...topArtists.map((a) => a.connections)) : 1;
  const maxSongs = topCollabs.length > 0 ? Math.max(...topCollabs.map((c) => c.songCount)) : 1;
  const maxGenreArtists = topGenres.length > 0 ? Math.max(...topGenres.map((g) => g.artistCount)) : 1;

  return (
    <div className="fade-in">
      <h1>Statistiques & Analyses Data</h1>
      <p className="subtitle">
        Analyse de la centralité des artistes et modélisation statistique du graphe de collaborations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Row 1: Centrality Degree (Top Connected Artists) */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#6366f1" />
            Centralité de Degré (Artistes les plus connectés)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Cette mesure quantifie le nombre de connexions de collaborations uniques qu'un artiste possède en base. Plus le degré est élevé, plus l'artiste est central dans le réseau.
          </p>

          {topArtists.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              Aucun artiste collaborateur enregistré en base.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {topArtists.map((artist, idx) => {
                const widthPercent = (artist.connections / maxConnections) * 100;
                return (
                  <div key={artist.mbid} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', alignItems: 'center', gap: '1.5rem' }}>
                    
                    {/* Rank & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-muted)', width: '20px' }}>
                        #{idx + 1}
                      </span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onInspectArtist(artist.mbid);
                        }}
                        style={{ color: '#fff', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}
                      >
                        {artist.name}
                      </a>
                    </div>

                    {/* Progress Bar connection density */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(to right, #6366f1, #a855f7)',
                          borderRadius: '5px'
                        }}
                      />
                    </div>

                    {/* Meta stats */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{artist.connections}</span> liens | {artist.totalSongs} morceaux
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Row 2: Two cards side by side: Top Collaborations & Genres */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Top Collaborations */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Network size={20} color="#10b981" />
              Top Collaborations (Duos Fréquents)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Paires d'artistes ayant collaboré sur le plus grand nombre d'enregistrements (poids de la relation).
            </p>

            {topCollabs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucune collaboration multiple trouvée.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topCollabs.map((collab) => {
                  const widthPercent = (collab.songCount / maxSongs) * 100;
                  return (
                    <div key={`${collab.mbid1}-${collab.mbid2}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <div>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onInspectArtist(collab.mbid1); }}
                            style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}
                          >
                            {collab.artist1}
                          </a>
                          <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>&</span>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onInspectArtist(collab.mbid2); }}
                            style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}
                          >
                            {collab.artist2}
                          </a>
                        </div>
                        <span style={{ fontWeight: '700', color: '#34d399' }}>{collab.songCount} titres</span>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${widthPercent}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Genres */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="#ec4899" />
              Répartition des Genres Principaux
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Genres musicaux les plus représentés parmi les artistes importés dans le graphe.
            </p>

            {topGenres.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Aucune étiquette de genre associée aux artistes en base.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topGenres.map((genre) => {
                  const widthPercent = (genre.artistCount / maxGenreArtists) * 100;
                  return (
                    <div key={genre.genre} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ textTransform: 'capitalize', color: '#fff', fontWeight: '500' }}>
                          {genre.genre}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {genre.artistCount} artiste{genre.artistCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${widthPercent}%`,
                            height: '100%',
                            background: '#ec4899',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Stats;
