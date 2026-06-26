import React from 'react';
import { User, Users, MapPin, Calendar, HelpCircle, Eye } from 'lucide-react';

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

  const renderTypeIcon = () => {
    switch (type?.toLowerCase()) {
      case 'person':
        return <User size={16} className="text-secondary" />;
      case 'group':
        return <Users size={16} className="text-secondary" />;
      default:
        return <HelpCircle size={16} className="text-secondary" />;
    }
  };

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>{name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {renderTypeIcon()}
            <span>{type || 'Artiste'}</span>
          </p>
        </div>
        <span className="badge badge-primary">{artist.properties.source || 'MusicBrainz'}</span>
      </div>

      {disambiguation && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
          "{disambiguation}"
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {areaName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={15} />
            <span>{areaName}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={15} />
          <span>
            {beginDate ? `Depuis ${beginDate}` : 'Début inconnu'}
            {endDate ? ` jusqu'à ${endDate}` : ''}
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
        <Eye size={16} />
        Inspecter le profil
      </button>
    </div>
  );
};

export default ArtistCard;
