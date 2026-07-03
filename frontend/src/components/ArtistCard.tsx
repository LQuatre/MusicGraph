import React from 'react';
import { motion } from 'framer-motion';

export interface ArtistInfo {
  properties: {
    mbid: string;
    name: string;
    type?: string;
    country?: string;
    beginDate?: string;
    endDate?: string;
    disambiguation?: string;
    source?: string;
  };
  area?: {
    name: string;
    type?: string;
  };
  genres?: string[];
}

interface ArtistCardProps {
  artist: ArtistInfo;
  onInspect: (mbid: string) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onInspect }) => {
  const { name, type, country, beginDate, endDate, disambiguation, mbid } = artist.properties;
  const genres = artist.genres || [];
  const areaName = artist.area?.name || country;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>{name}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {type || 'Artiste'}
          </p>
        </div>
        <span className="badge badge-primary">{artist.properties.source || 'MusicBrainz'}</span>
      </div>

      {disambiguation && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
          "{disambiguation}"
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        {areaName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Origine</span>
            <span style={{ color: '#fff', fontWeight: '500' }}>{areaName}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Activité</span>
          <span style={{ color: '#fff', fontWeight: '500' }}>
            {beginDate ? beginDate : '?'}
            {endDate ? ` – ${endDate}` : ''}
          </span>
        </div>
      </div>

      {genres.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
          {genres.map((g) => (
            <span key={g} className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
              {g}
            </span>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem' }} onClick={() => onInspect(mbid)}>
        Inspecter le profil
      </button>
    </motion.div>
  );
};

export default ArtistCard;
