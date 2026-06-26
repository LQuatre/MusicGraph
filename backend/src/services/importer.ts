import { getArtistDetails, getArtistReleases, getReleaseDetails, getRecordingDetails } from './musicbrainz.js';
import { runWrite } from '../config/database.js';
import { DEMO_CATALOG } from './demoCatalog.js';

/**
 * Normalise les chaînes de date de MusicBrainz (ex: "1993-05-18" -> "1993")
 */
const getYearOnly = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})/);
  return match ? match[1] : null;
};

/**
 * Importe un artiste et toutes ses données associées (Niveau 1) dans Neo4j
 */
export const importArtist = async (mbid: string): Promise<{ success: boolean; artistName: string }> => {
  console.log(`[Importer] Lancement de l'import pour l'artiste MBID: ${mbid}`);

  let details: any;
  let releases: any[];
  let isDemo = false;

  // 1. Récupération des données via l'API
  try {
    details = await getArtistDetails(mbid);
    releases = await getArtistReleases(mbid, 15); // Limiter à 15 releases
  } catch (error: any) {
    throw new Error(`L'API MusicBrainz a échoué : ${error.message}`);
  }

  const artistName = details.name;
  console.log(`[Importer] Données récupérées pour ${artistName} (MusicBrainz API). Début de l'écriture Neo4j...`);

  // 2. Création/Mise à jour du nœud Artist principal
  const beginDate = details['life-span']?.begin ? getYearOnly(details['life-span'].begin) : null;
  const endDate = details['life-span']?.end ? getYearOnly(details['life-span'].end) : null;

  await runWrite(
    `
    MERGE (a:Artist {mbid: $mbid})
    SET a.name = $name,
        a.type = $type,
        a.country = $country,
        a.beginDate = $beginDate,
        a.endDate = $endDate,
        a.disambiguation = $disambiguation,
        a.lastImported = datetime(),
        a.source = $source
    RETURN a
    `,
    {
      mbid: details.id,
      name: details.name,
      type: details.type || 'Unknown',
      country: details.country || 'Unknown',
      beginDate: beginDate || '',
      endDate: endDate || '',
      disambiguation: details.disambiguation || '',
      source: isDemo ? 'Demo (Offline)' : 'MusicBrainz'
    }
  );

  // 3. Liaison avec l'Area (Zone géographique) de l'artiste
  if (details.area) {
    await runWrite(
      `
      MERGE (ar:Area {mbid: $areaMbid})
      SET ar.name = $areaName,
          ar.type = $areaType
      WITH ar
      MATCH (a:Artist {mbid: $artistMbid})
      MERGE (a)-[:FROM_AREA]->(ar)
      `,
      {
        areaMbid: details.area.id,
        areaName: details.area.name,
        areaType: details.area.type || 'Area',
        artistMbid: details.id
      }
    );
  }

  // 4. Import des Genres de l'artiste (depuis les tags de MusicBrainz)
  if (details.tags && details.tags.length > 0) {
    // Prendre les 5 genres les plus populaires (nombre de votes)
    const topGenres = [...details.tags]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((t) => t.name.toLowerCase());

    for (const genreName of topGenres) {
      await runWrite(
        `
        MERGE (g:Genre {name: $genreName})
        WITH g
        MATCH (a:Artist {mbid: $artistMbid})
        MERGE (a)-[:ASSOCIATED_WITH_GENRE]->(g)
        `,
        {
          genreName,
          artistMbid: details.id
        }
      );
    }
  }

  // 5. Import des Releases (Albums), Labels et Recordings (Morceaux)
  for (const rel of releases) {
    const releaseMbid = rel.id;
    const releaseTitle = rel.title;
    const releaseDate = rel.date || '';
    const releaseCountry = rel.country || 'Unknown';
    const releaseType = rel['release-group']?.['primary-type'] || 'Album';

    // Créer le nœud Release
    await runWrite(
      `
      MERGE (r:Release {mbid: $mbid})
      SET r.title = $title,
          r.date = $date,
          r.country = $country,
          r.releaseType = $releaseType
      `,
      {
        mbid: releaseMbid,
        title: releaseTitle,
        date: releaseDate,
        country: releaseCountry,
        releaseType
      }
    );

    // Relier la release à son Area si spécifié
    if (rel.country && rel.country !== 'Unknown') {
      await runWrite(
        `
        MERGE (ar:Area {name: $countryName})
        SET ar.type = 'Country'
        WITH ar
        MATCH (r:Release {mbid: $releaseMbid})
        MERGE (r)-[:RELEASED_IN]->(ar)
        `,
        {
          countryName: rel.country,
          releaseMbid
        }
      );
    }

    // Gérer les Labels de la release
    if (rel['label-info'] && rel['label-info'].length > 0) {
      for (const info of rel['label-info']) {
        if (info.label && info.label.name) {
          await runWrite(
            `
            MERGE (l:Label {mbid: $labelMbid})
            SET l.name = $labelName,
                l.country = $labelCountry
            WITH l
            MATCH (r:Release {mbid: $releaseMbid})
            MERGE (r)-[:RELEASED_BY]->(l)
            `,
            {
              labelMbid: info.label.id,
              labelName: info.label.name,
              labelCountry: info.label.country || 'Unknown',
              releaseMbid
            }
          );
        }
      }
    }

    // Parcourir les morceaux (recordings) de la release
    if (rel.media && rel.media.length > 0) {
      for (const medium of rel.media) {
        if (medium.tracks && medium.tracks.length > 0) {
          for (const track of medium.tracks) {
            const rec = track.recording;
            if (!rec) continue;

            const recMbid = rec.id;
            const recTitle = rec.title;
            const recLength = rec.length || null;

            // Créer le nœud Recording
            await runWrite(
              `
              MERGE (rec:Recording {mbid: $mbid})
              SET rec.title = $title,
                  rec.length = $length,
                  rec.firstReleaseDate = $firstReleaseDate
              WITH rec
              MATCH (r:Release {mbid: $releaseMbid})
              MERGE (rec)-[:APPEARS_ON]->(r)
              `,
              {
                mbid: recMbid,
                title: recTitle,
                length: recLength,
                firstReleaseDate: releaseDate,
                releaseMbid
              }
            );

            // Gérer les crédits d'artistes pour ce morceau (pour les collaborations)
            if (rec['artist-credit'] && rec['artist-credit'].length > 0) {
              const creditList = rec['artist-credit'];

              for (const credit of creditList) {
                const collabArtist = credit.artist;
                if (!collabArtist) continue;

                const collabMbid = collabArtist.id;
                const collabName = collabArtist.name;

                // Créer le nœud de l'artiste collaborateur s'il n'existe pas
                await runWrite(
                  `
                  MERGE (c:Artist {mbid: $mbid})
                  ON CREATE SET c.name = $name,
                                c.type = $type,
                                c.country = $country,
                                c.source = "MusicBrainz"
                  `,
                  {
                    mbid: collabMbid,
                    name: collabName,
                    type: collabArtist.type || 'Unknown',
                    country: collabArtist.country || 'Unknown'
                  }
                );

                // Déterminer la relation (PERFORMED vs FEATURED_ON)
                // Par défaut, si l'artiste courant fait partie des crédits
                const joinphrase = (credit.joinphrase || '').toLowerCase();
                const isFeatured =
                  joinphrase.includes('feat') ||
                  joinphrase.includes('featuring') ||
                  joinphrase.includes('ft') ||
                  joinphrase.includes('avec');

                const relType = isFeatured ? 'FEATURED_ON' : 'PERFORMED';

                if (isFeatured) {
                  await runWrite(
                    `
                    MATCH (c:Artist {mbid: $collabMbid})
                    MATCH (rec:Recording {mbid: $recMbid})
                    MERGE (c)-[:FEATURED_ON]->(rec)
                    `,
                    { collabMbid, recMbid }
                  );
                } else {
                  await runWrite(
                    `
                    MATCH (c:Artist {mbid: $collabMbid})
                    MATCH (rec:Recording {mbid: $recMbid})
                    MERGE (c)-[:PERFORMED]->(rec)
                    `,
                    { collabMbid, recMbid }
                  );
                }

                // Créer la relation de collaboration directe (:Artist)-[:COLLABORATED_WITH]->(:Artist)
                // uniquement si le collaborateur n'est pas l'artiste principal lui-même
                if (collabMbid !== mbid) {
                  await runWrite(
                    `
                    MATCH (a1:Artist {mbid: $mbid1})
                    MATCH (a2:Artist {mbid: $mbid2})
                    MERGE (a1)-[rel:COLLABORATED_WITH]-(a2)
                    ON CREATE SET rel.count = 1
                    ON MATCH SET rel.count = rel.count + 1
                    `,
                    {
                      mbid1: mbid,
                      mbid2: collabMbid
                    }
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`[Importer] Fin de l'importation avec succès pour ${artistName}`);
  return { success: true, artistName };
};

/**
 * Imports a single Release (Album) and all its tracks and artist relationships
 */
export const importRelease = async (mbid: string): Promise<{ success: boolean; releaseTitle: string }> => {
  console.log(`[Importer] Lancement de l'import pour l'album/release MBID: ${mbid}`);

  let rel: any;
  try {
    rel = await getReleaseDetails(mbid);
  } catch (error: any) {
    throw new Error(`L'API MusicBrainz a échoué : ${error.message}`);
  }

  const releaseTitle = rel.title;
  const releaseDate = rel.date || '';
  const releaseCountry = rel.country || 'Unknown';
  const releaseType = rel['release-group']?.['primary-type'] || 'Album';

  // 1. Create the Release node
  await runWrite(
    `
    MERGE (r:Release {mbid: $mbid})
    SET r.title = $title,
        r.date = $date,
        r.country = $country,
        r.releaseType = $releaseType,
        r.lastImported = datetime(),
        r.source = 'MusicBrainz'
    `,
    {
      mbid,
      title: releaseTitle,
      date: releaseDate,
      country: releaseCountry,
      releaseType
    }
  );

  // 2. Link with Area
  if (rel.country && rel.country !== 'Unknown') {
    await runWrite(
      `
      MERGE (ar:Area {name: $countryName})
      SET ar.type = 'Country'
      WITH ar
      MATCH (r:Release {mbid: $releaseMbid})
      MERGE (r)-[:RELEASED_IN]->(ar)
      `,
      {
        countryName: rel.country,
        releaseMbid: mbid
      }
    );
  }

  // 3. Link with Labels
  if (rel['label-info'] && rel['label-info'].length > 0) {
    for (const info of rel['label-info']) {
      if (info.label && info.label.name) {
        await runWrite(
          `
          MERGE (l:Label {mbid: $labelMbid})
          SET l.name = $labelName,
              l.country = $labelCountry
          WITH l
          MATCH (r:Release {mbid: $releaseMbid})
          MERGE (r)-[:RELEASED_BY]->(l)
          `,
          {
            labelMbid: info.label.id,
            labelName: info.label.name,
            labelCountry: info.label.country || 'Unknown',
            releaseMbid: mbid
          }
        );
      }
    }
  }

  // 4. Link with Tracks / Recordings
  if (rel.media && rel.media.length > 0) {
    for (const medium of rel.media) {
      if (medium.tracks && medium.tracks.length > 0) {
        for (const track of medium.tracks) {
          const rec = track.recording;
          if (!rec) continue;

          const recMbid = rec.id;
          const recTitle = rec.title;
          const recLength = rec.length || null;

          // Create Recording node and APPEARS_ON link
          await runWrite(
            `
            MERGE (rec:Recording {mbid: $mbid})
            SET rec.title = $title,
                rec.length = $length,
                rec.firstReleaseDate = $firstReleaseDate
            WITH rec
            MATCH (r:Release {mbid: $releaseMbid})
            MERGE (rec)-[:APPEARS_ON]->(r)
            `,
            {
              mbid: recMbid,
              title: recTitle,
              length: recLength,
              firstReleaseDate: releaseDate,
              releaseMbid: mbid
            }
          );

          // Handle artist credits for this track
          if (rec['artist-credit'] && rec['artist-credit'].length > 0) {
            const creditList = rec['artist-credit'];

            for (const credit of creditList) {
              const collabArtist = credit.artist;
              if (!collabArtist) continue;

              const collabMbid = collabArtist.id;
              const collabName = collabArtist.name;

              // Create Artist node (skeleton or full)
              await runWrite(
                `
                MERGE (c:Artist {mbid: $mbid})
                ON CREATE SET c.name = $name,
                              c.type = $type,
                              c.country = $country,
                              c.source = "MusicBrainz"
                `,
                {
                  mbid: collabMbid,
                  name: collabName,
                  type: collabArtist.type || 'Unknown',
                  country: collabArtist.country || 'Unknown'
                }
              );

              const joinphrase = (credit.joinphrase || '').toLowerCase();
              const isFeatured =
                joinphrase.includes('feat') ||
                joinphrase.includes('featuring') ||
                joinphrase.includes('ft') ||
                joinphrase.includes('avec');

              if (isFeatured) {
                await runWrite(
                  `
                  MATCH (c:Artist {mbid: $collabMbid})
                  MATCH (rec:Recording {mbid: $recMbid})
                  MERGE (c)-[:FEATURED_ON]->(rec)
                  `,
                  { collabMbid, recMbid }
                );
              } else {
                await runWrite(
                  `
                  MATCH (c:Artist {mbid: $collabMbid})
                  MATCH (rec:Recording {mbid: $recMbid})
                  MERGE (c)-[:PERFORMED]->(rec)
                  `,
                  { collabMbid, recMbid }
                );
              }

              // Create COLLABORATED_WITH relationships between credited artists
              for (const otherCredit of creditList) {
                const otherArtist = otherCredit.artist;
                if (otherArtist && otherArtist.id !== collabMbid) {
                  await runWrite(
                    `
                    MATCH (a1:Artist {mbid: $mbid1})
                    MATCH (a2:Artist {mbid: $mbid2})
                    MERGE (a1)-[rel:COLLABORATED_WITH]-(a2)
                    ON CREATE SET rel.count = 1
                    ON MATCH SET rel.count = rel.count + 1
                    `,
                    {
                      mbid1: collabMbid,
                      mbid2: otherArtist.id
                    }
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`[Importer] Fin de l'importation avec succès pour l'album ${releaseTitle}`);
  return { success: true, releaseTitle };
};

/**
 * Imports a single Recording (Morceau) and all its artist and release relationships
 */
export const importRecording = async (mbid: string): Promise<{ success: boolean; recordingTitle: string }> => {
  console.log(`[Importer] Lancement de l'import pour le morceau MBID: ${mbid}`);

  let rec: any;
  try {
    rec = await getRecordingDetails(mbid);
  } catch (error: any) {
    throw new Error(`L'API MusicBrainz a échoué : ${error.message}`);
  }

  const recordingTitle = rec.title;
  const recordingLength = rec.length || null;
  const firstReleaseDate = rec['first-release-date'] || '';

  // 1. Create/Update the Recording node
  await runWrite(
    `
    MERGE (rec:Recording {mbid: $mbid})
    SET rec.title = $title,
        rec.length = $length,
        rec.firstReleaseDate = $firstReleaseDate,
        rec.lastImported = datetime(),
        rec.source = 'MusicBrainz'
    `,
    {
      mbid,
      title: recordingTitle,
      length: recordingLength,
      firstReleaseDate
    }
  );

  // 2. Link with Artist Credits
  if (rec['artist-credit'] && rec['artist-credit'].length > 0) {
    const creditList = rec['artist-credit'];

    for (const credit of creditList) {
      const collabArtist = credit.artist;
      if (!collabArtist) continue;

      const collabMbid = collabArtist.id;
      const collabName = collabArtist.name;

      // Create Artist node (skeleton or full)
      await runWrite(
        `
        MERGE (c:Artist {mbid: $mbid})
        ON CREATE SET c.name = $name,
                      c.type = $type,
                      c.country = $country,
                      c.source = "MusicBrainz"
        `,
        {
          mbid: collabMbid,
          name: collabName,
          type: collabArtist.type || 'Unknown',
          country: collabArtist.country || 'Unknown'
        }
      );

      const joinphrase = (credit.joinphrase || '').toLowerCase();
      const isFeatured =
        joinphrase.includes('feat') ||
        joinphrase.includes('featuring') ||
        joinphrase.includes('ft') ||
        joinphrase.includes('avec');

      if (isFeatured) {
        await runWrite(
          `
          MATCH (c:Artist {mbid: $collabMbid})
          MATCH (rec:Recording {mbid: $recMbid})
          MERGE (c)-[:FEATURED_ON]->(rec)
          `,
          { collabMbid, recMbid: mbid }
        );
      } else {
        await runWrite(
          `
          MATCH (c:Artist {mbid: $collabMbid})
          MATCH (rec:Recording {mbid: $recMbid})
          MERGE (c)-[:PERFORMED]->(rec)
          `,
          { collabMbid, recMbid: mbid }
        );
      }

      // Create COLLABORATED_WITH relationships between credited artists
      for (const otherCredit of creditList) {
        const otherArtist = otherCredit.artist;
        if (otherArtist && otherArtist.id !== collabMbid) {
          await runWrite(
            `
            MATCH (a1:Artist {mbid: $mbid1})
            MATCH (a2:Artist {mbid: $mbid2})
            MERGE (a1)-[rel:COLLABORATED_WITH]-(a2)
            ON CREATE SET rel.count = 1
            ON MATCH SET rel.count = rel.count + 1
            `,
            {
              mbid1: collabMbid,
              mbid2: otherArtist.id
            }
          );
        }
      }
    }
  }

  // 3. Link with its Releases (Albums)
  if (rec.releases && rec.releases.length > 0) {
    for (const release of rec.releases) {
      if (release.id && release.title) {
        // Create Release node skeleton
        await runWrite(
          `
          MERGE (r:Release {mbid: $mbid})
          ON CREATE SET r.title = $title,
                        r.date = $date,
                        r.country = $country,
                        r.releaseType = $releaseType,
                        r.source = 'MusicBrainz'
          `,
          {
            mbid: release.id,
            title: release.title,
            date: release.date || '',
            country: release.country || 'Unknown',
            releaseType: release['release-group']?.['primary-type'] || 'Album'
          }
        );

        // Link Recording to Release
        await runWrite(
          `
          MATCH (rec:Recording {mbid: $recMbid})
          MATCH (r:Release {mbid: $releaseMbid})
          MERGE (rec)-[:APPEARS_ON]->(r)
          `,
          {
            recMbid: mbid,
            releaseMbid: release.id
          }
        );
      }
    }
  }

  console.log(`[Importer] Fin de l'importation avec succès pour le morceau ${recordingTitle}`);
  return { success: true, recordingTitle };
};
