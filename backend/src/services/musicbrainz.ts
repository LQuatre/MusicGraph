import https from 'https';

// Base URL for MusicBrainz API
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';

// Custom Request Queue to respect the 1 request/second rate limit
class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('[MusicBrainz Queue] Task failed:', error);
        }
        // Wait 1.1 seconds between requests to be safe
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    this.processing = false;
  }
}

const mbQueue = new RequestQueue();

/**
 * Execute a queued GET request to MusicBrainz API using native https module with TLS 1.2 configuration
 */
const queuedGet = <T = any>(url: string, params: Record<string, any> = {}): Promise<T> => {
  return mbQueue.add(() => {
    const executeRequest = (retriesLeft: number): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const urlObj = new URL(`${MUSICBRAINZ_BASE_URL}${url}`);
        
        // Add query params
        urlObj.searchParams.set('fmt', 'json');
        for (const key in params) {
          if (params[key] !== undefined && params[key] !== null) {
            urlObj.searchParams.set(key, String(params[key]));
          }
        }

        console.log(`[MusicBrainz API] GET ${urlObj.toString()} (Attempts left: ${retriesLeft})`);

        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: {
            'User-Agent': 'MusicGraph/1.0.0 ( lucas.student@example.com )',
            'Accept': 'application/json'
          },
          minVersion: 'TLSv1.2' as const,
          maxVersion: 'TLSv1.2' as const,
          timeout: 10000 // 10 seconds timeout
        };

        const req = https.request(options, (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            if (res.statusCode === 503 || res.statusCode === 429) {
              const err = new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage} (Rate Limited)`);
              (err as any).status = res.statusCode;
              reject(err);
              return;
            }
            reject(new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}`));
            return;
          }

          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });

          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data as T);
            } catch (err) {
              reject(new Error(`Failed to parse response JSON: ${(err as Error).message}`));
            }
          });
        });

        req.on('timeout', () => {
          req.destroy(new Error('Request Timeout'));
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.end();
      }).catch(async (error) => {
        if (retriesLeft > 0) {
          const isRateLimit = error.status === 503 || error.status === 429;
          const delay = isRateLimit ? 3000 : 1500;
          console.warn(`[MusicBrainz API] Request failed: ${error.message}. Retrying in ${delay}ms...`);
          await new Promise((res) => setTimeout(res, delay));
          return executeRequest(retriesLeft - 1);
        }
        throw error;
      });
    };

    return executeRequest(3); // Try up to 4 times (1 initial + 3 retries)
  });
};


export interface MBArtistSearch {
  id: string;
  name: string;
  type?: string;
  country?: string;
  score?: number;
  'life-span'?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  disambiguation?: string;
}

export interface MBArtistDetails {
  id: string;
  name: string;
  type?: string;
  country?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  disambiguation?: string;
  tags?: { count: number; name: string }[];
  area?: {
    id: string;
    name: string;
    type?: string;
  };
}

export interface MBRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  status?: string;
  'release-group'?: {
    'primary-type'?: string;
  };
  'label-info'?: {
    label?: {
      id: string;
      name: string;
      country?: string;
    };
  }[];
  media?: {
    tracks?: {
      id: string;
      length?: number;
      title: string;
      recording: {
        id: string;
        title: string;
        length?: number;
        'artist-credit'?: {
          name: string;
          joinphrase?: string;
          artist: {
            id: string;
            name: string;
            type?: string;
            country?: string;
          };
        }[];
      };
    }[];
  }[];
}

/**
 * Search for artists by name
 */
export const searchArtists = async (query: string): Promise<MBArtistSearch[]> => {
  try {
    const data = await queuedGet('/artist', { query: `artist:"${query}" OR alias:"${query}"` });
    return (data.artists || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      type: artist.type,
      country: artist.country,
      score: artist.score,
      'life-span': artist['life-span'],
      disambiguation: artist.disambiguation
    }));
  } catch (error) {
    console.error(`[MusicBrainz] Error searching artists for "${query}":`, error);
    throw error;
  }
};

/**
 * Fetch detailed artist information
 */
export const getArtistDetails = async (mbid: string): Promise<MBArtistDetails> => {
  try {
    return await queuedGet(`/artist/${mbid}`, { inc: 'tags' });
  } catch (error) {
    console.error(`[MusicBrainz] Error fetching details for artist ${mbid}:`, error);
    throw error;
  }
};

/**
 * Fetch releases associated with an artist (includes tracks, labels, and artist credits)
 */
export const getArtistReleases = async (mbid: string, limit = 15): Promise<MBRelease[]> => {
  try {
    const data = await queuedGet('/release', {
      artist: mbid,
      inc: 'recordings+labels+release-groups+artist-credits',
      limit: limit
    });
    return data.releases || [];
  } catch (error) {
    console.error(`[MusicBrainz] Error fetching releases for artist ${mbid}:`, error);
    throw error;
  }
};

/**
 * Search for releases (albums) by name
 */
export const searchReleases = async (query: string): Promise<any[]> => {
  try {
    const data = await queuedGet('/release', { query: `release:"${query}"` });
    return (data.releases || []).map((rel: any) => ({
      id: rel.id,
      title: rel.title,
      date: rel.date,
      country: rel.country,
      status: rel.status,
      type: rel['release-group']?.['primary-type'] || 'Album',
      artistCredit: (rel['artist-credit'] || []).map((c: any) => ({
        name: c.name,
        artistMbid: c.artist?.id
      }))
    }));
  } catch (error) {
    console.error(`[MusicBrainz] Error searching releases for "${query}":`, error);
    throw error;
  }
};

/**
 * Search for recordings (songs) by name
 */
export const searchRecordings = async (query: string): Promise<any[]> => {
  try {
    const data = await queuedGet('/recording', { query: `recording:"${query}"` });
    return (data.recordings || []).map((rec: any) => ({
      id: rec.id,
      title: rec.title,
      length: rec.length,
      date: rec['first-release-date'],
      artistCredit: (rec['artist-credit'] || []).map((c: any) => ({
        name: c.name,
        artistMbid: c.artist?.id
      }))
    }));
  } catch (error) {
    console.error(`[MusicBrainz] Error searching recordings for "${query}":`, error);
    throw error;
  }
};

/**
 * Fetch detailed release information
 */
export const getReleaseDetails = async (mbid: string): Promise<any> => {
  try {
    return await queuedGet(`/release/${mbid}`, {
      inc: 'recordings+labels+release-groups+artist-credits'
    });
  } catch (error) {
    console.error(`[MusicBrainz] Error fetching details for release ${mbid}:`, error);
    throw error;
  }
};

/**
 * Fetch detailed recording information
 */
export const getRecordingDetails = async (mbid: string): Promise<any> => {
  try {
    return await queuedGet(`/recording/${mbid}`, {
      inc: 'releases+artist-credits'
    });
  } catch (error) {
    console.error(`[MusicBrainz] Error fetching details for recording ${mbid}:`, error);
    throw error;
  }
};

