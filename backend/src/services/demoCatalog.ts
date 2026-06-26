// Catalog of high-quality mock data for offline/rate-limit fallback
import { MBArtistDetails, MBRelease } from './musicbrainz.js';

export interface DemoCatalogEntry {
  details: MBArtistDetails;
  releases: MBRelease[];
}

export const DEMO_CATALOG: Record<string, DemoCatalogEntry> = {
  'artist-daft-punk': {
    details: {
      id: 'artist-daft-punk',
      name: 'Daft Punk',
      type: 'Group',
      country: 'FR',
      'life-span': { begin: '1993', end: '2021', ended: true },
      disambiguation: 'Duo de musique électronique français',
      tags: [
        { count: 100, name: 'electronic' },
        { count: 80, name: 'french touch' },
        { count: 50, name: 'dance' }
      ],
      area: { id: 'area-fr', name: 'France', type: 'Country' }
    },
    releases: [
      {
        id: 'release-ram',
        title: 'Random Access Memories',
        date: '2013-05-17',
        country: 'XE',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-columbia', name: 'Columbia Records', country: 'US' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-get-lucky',
                title: 'Get Lucky',
                length: 369000,
                recording: {
                  id: 'rec-get-lucky',
                  title: 'Get Lucky',
                  length: 369000,
                  'artist-credit': [
                    { name: 'Daft Punk', artist: { id: 'artist-daft-punk', name: 'Daft Punk', type: 'Group', country: 'FR' } },
                    { name: 'Pharrell Williams', joinphrase: ' feat. ', artist: { id: 'artist-pharrell', name: 'Pharrell Williams', type: 'Person', country: 'US' } }
                  ]
                }
              },
              {
                id: 'track-lose-yourself',
                title: 'Lose Yourself to Dance',
                length: 353000,
                recording: {
                  id: 'rec-lose-yourself',
                  title: 'Lose Yourself to Dance',
                  length: 353000,
                  'artist-credit': [
                    { name: 'Daft Punk', artist: { id: 'artist-daft-punk', name: 'Daft Punk', type: 'Group', country: 'FR' } },
                    { name: 'Pharrell Williams', joinphrase: ' feat. ', artist: { id: 'artist-pharrell', name: 'Pharrell Williams', type: 'Person', country: 'US' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-stromae': {
    details: {
      id: 'artist-stromae',
      name: 'Stromae',
      type: 'Person',
      country: 'BE',
      'life-span': { begin: '2000', ended: false },
      disambiguation: 'Auteur-compositeur-interprète belge',
      tags: [
        { count: 100, name: 'electronic' },
        { count: 90, name: 'pop' },
        { count: 40, name: 'hip hop' }
      ],
      area: { id: 'area-be', name: 'Belgique', type: 'Country' }
    },
    releases: [
      {
        id: 'release-multitude',
        title: 'Multitude',
        date: '2022-03-04',
        country: 'BE',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-l-enfer',
                title: "L'enfer",
                length: 189000,
                recording: {
                  id: 'rec-l-enfer',
                  title: "L'enfer",
                  length: 189000,
                  'artist-credit': [
                    { name: 'Stromae', artist: { id: 'artist-stromae', name: 'Stromae', type: 'Person', country: 'BE' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-angele': {
    details: {
      id: 'artist-angele',
      name: 'Angèle',
      type: 'Person',
      country: 'BE',
      'life-span': { begin: '2015', ended: false },
      disambiguation: 'Chanteuse et musicienne pop belge',
      tags: [
        { count: 100, name: 'pop' },
        { count: 70, name: 'synth-pop' },
        { count: 50, name: 'chanson' }
      ],
      area: { id: 'area-be', name: 'Belgique', type: 'Country' }
    },
    releases: [
      {
        id: 'release-brol',
        title: 'Brol',
        date: '2018-10-05',
        country: 'FR',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-tout-oublier',
                title: 'Tout oublier',
                length: 202000,
                recording: {
                  id: 'rec-tout-oublier',
                  title: 'Tout oublier',
                  length: 202000,
                  'artist-credit': [
                    { name: 'Angèle', artist: { id: 'artist-angele', name: 'Angèle', type: 'Person', country: 'BE' } },
                    { name: 'Roméo Elvis', joinphrase: ' feat. ', artist: { id: 'artist-romeo-elvis', name: 'Roméo Elvis', type: 'Person', country: 'BE' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-damso': {
    details: {
      id: 'artist-damso',
      name: 'Damso',
      type: 'Person',
      country: 'BE',
      'life-span': { begin: '2006', ended: false },
      disambiguation: 'Rappeur belgo-congolais',
      tags: [
        { count: 100, name: 'rap' },
        { count: 80, name: 'hip hop' }
      ],
      area: { id: 'area-be', name: 'Belgique', type: 'Country' }
    },
    releases: [
      {
        id: 'release-ipseite',
        title: 'Ipséité',
        date: '2017-04-28',
        country: 'FR',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-silence',
                title: 'Silence',
                length: 221000,
                recording: {
                  id: 'rec-silence',
                  title: 'Silence',
                  length: 221000,
                  'artist-credit': [
                    { name: 'Damso', artist: { id: 'artist-damso', name: 'Damso', type: 'Person', country: 'BE' } },
                    { name: 'Angèle', joinphrase: ' feat. ', artist: { id: 'artist-angele', name: 'Angèle', type: 'Person', country: 'BE' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-gims': {
    details: {
      id: 'artist-gims',
      name: 'Gims',
      type: 'Person',
      country: 'FR',
      'life-span': { begin: '2002', ended: false },
      disambiguation: 'Rappeur et chanteur congolais',
      tags: [
        { count: 100, name: 'pop' },
        { count: 80, name: 'rap' },
        { count: 60, name: 'r&b' }
      ],
      area: { id: 'area-fr', name: 'France', type: 'Country' }
    },
    releases: [
      {
        id: 'release-subliminal',
        title: 'Subliminal',
        date: '2013-05-20',
        country: 'FR',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-bella',
                title: 'Bella',
                length: 252000,
                recording: {
                  id: 'rec-bella',
                  title: 'Bella',
                  length: 252000,
                  'artist-credit': [
                    { name: 'Gims', artist: { id: 'artist-gims', name: 'Gims', type: 'Person', country: 'FR' } }
                  ]
                }
              },
              {
                id: 'track-sapes',
                title: 'Sapés comme jamais',
                length: 204000,
                recording: {
                  id: 'rec-sapes',
                  title: 'Sapés comme jamais',
                  length: 204000,
                  'artist-credit': [
                    { name: 'Gims', artist: { id: 'artist-gims', name: 'Gims', type: 'Person', country: 'FR' } },
                    { name: 'Niska', joinphrase: ' feat. ', artist: { id: 'artist-niska', name: 'Niska', type: 'Person', country: 'FR' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-niska': {
    details: {
      id: 'artist-niska',
      name: 'Niska',
      type: 'Person',
      country: 'FR',
      'life-span': { begin: '2010', ended: false },
      disambiguation: 'Rappeur français',
      tags: [
        { count: 100, name: 'rap' }
      ],
      area: { id: 'area-fr', name: 'France', type: 'Country' }
    },
    releases: [
      {
        id: 'release-charo-life',
        title: 'Charo Life',
        date: '2015-10-02',
        country: 'FR',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-sapes',
                title: 'Sapés comme jamais',
                length: 204000,
                recording: {
                  id: 'rec-sapes',
                  title: 'Sapés comme jamais',
                  length: 204000,
                  'artist-credit': [
                    { name: 'Gims', artist: { id: 'artist-gims', name: 'Gims', type: 'Person', country: 'FR' } },
                    { name: 'Niska', joinphrase: ' feat. ', artist: { id: 'artist-niska', name: 'Niska', type: 'Person', country: 'FR' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-dua-lipa': {
    details: {
      id: 'artist-dua-lipa',
      name: 'Dua Lipa',
      type: 'Person',
      country: 'GB',
      'life-span': { begin: '2014', ended: false },
      disambiguation: 'Chanteuse pop britannique',
      tags: [
        { count: 100, name: 'pop' }
      ],
      area: { id: 'area-uk', name: 'Royaume-Uni', type: 'Country' }
    },
    releases: [
      {
        id: 'release-future-nostalgia',
        title: 'Future Nostalgia',
        date: '2020-03-27',
        country: 'GB',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        'label-info': [{ label: { id: 'label-universal', name: 'Universal Music Division', country: 'FR' } }],
        media: [
          {
            tracks: [
              {
                id: 'track-fever',
                title: 'Fever',
                length: 157000,
                recording: {
                  id: 'rec-fever',
                  title: 'Fever',
                  length: 157000,
                  'artist-credit': [
                    { name: 'Dua Lipa', artist: { id: 'artist-dua-lipa', name: 'Dua Lipa', type: 'Person', country: 'GB' } },
                    { name: 'Angèle', joinphrase: ' feat. ', artist: { id: 'artist-angele', name: 'Angèle', type: 'Person', country: 'BE' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-romeo-elvis': {
    details: {
      id: 'artist-romeo-elvis',
      name: 'Roméo Elvis',
      type: 'Person',
      country: 'BE',
      'life-span': { begin: '2012', ended: false },
      disambiguation: 'Rappeur belge',
      tags: [
        { count: 100, name: 'rap' }
      ],
      area: { id: 'area-be', name: 'Belgique', type: 'Country' }
    },
    releases: [
      {
        id: 'release-brol',
        title: 'Brol',
        date: '2018-10-05',
        country: 'FR',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        media: [
          {
            tracks: [
              {
                id: 'track-tout-oublier',
                title: 'Tout oublier',
                length: 202000,
                recording: {
                  id: 'rec-tout-oublier',
                  title: 'Tout oublier',
                  length: 202000,
                  'artist-credit': [
                    { name: 'Angèle', artist: { id: 'artist-angele', name: 'Angèle', type: 'Person', country: 'BE' } },
                    { name: 'Roméo Elvis', joinphrase: ' feat. ', artist: { id: 'artist-romeo-elvis', name: 'Roméo Elvis', type: 'Person', country: 'BE' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  'artist-pharrell': {
    details: {
      id: 'artist-pharrell',
      name: 'Pharrell Williams',
      type: 'Person',
      country: 'US',
      'life-span': { begin: '1992', ended: false },
      disambiguation: 'Producteur et chanteur américain',
      tags: [
        { count: 100, name: 'pop' },
        { count: 80, name: 'r&b' }
      ],
      area: { id: 'area-us', name: 'États-Unis', type: 'Country' }
    },
    releases: [
      {
        id: 'release-ram',
        title: 'Random Access Memories',
        date: '2013-05-17',
        country: 'XE',
        status: 'Official',
        'release-group': { 'primary-type': 'Album' },
        media: [
          {
            tracks: [
              {
                id: 'track-get-lucky',
                title: 'Get Lucky',
                length: 369000,
                recording: {
                  id: 'rec-get-lucky',
                  title: 'Get Lucky',
                  length: 369000,
                  'artist-credit': [
                    { name: 'Daft Punk', artist: { id: 'artist-daft-punk', name: 'Daft Punk', type: 'Group', country: 'FR' } },
                    { name: 'Pharrell Williams', joinphrase: ' feat. ', artist: { id: 'artist-pharrell', name: 'Pharrell Williams', type: 'Person', country: 'US' } }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  }
};

export const searchDemoArtists = (query: string) => {
  const q = query.toLowerCase().trim();
  const results = [];
  
  for (const id in DEMO_CATALOG) {
    const entry = DEMO_CATALOG[id];
    if (
      entry.details.name.toLowerCase().includes(q) ||
      (entry.details.disambiguation && entry.details.disambiguation.toLowerCase().includes(q))
    ) {
      results.push({
        id: entry.details.id,
        name: entry.details.name,
        type: entry.details.type,
        country: entry.details.country,
        score: 100,
        disambiguation: entry.details.disambiguation,
        'life-span': entry.details['life-span']
      });
    }
  }
  
  return results;
};
