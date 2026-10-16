import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { importArtist } from './services/importer.js';
import { searchArtists } from './services/musicbrainz.js';

dotenv.config();
dotenv.config({ path: path.resolve('../.env') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'musicgraphpassword';

const seed = async () => {
  console.log(`[Seed] Connexion à Neo4j sur ${uri}...`);
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log('[Seed] Nettoyage complet de la base de données (DETACH DELETE)...');
    await session.executeWrite((tx) => tx.run('MATCH (n) DETACH DELETE n'));
    console.log('[Seed] Base de données nettoyée avec succès.');

    // List of key French rap / hip-hop artists to seed
    const artistsToImport = [
      "Gims",
      "Booba",
      "Jul",
      "Niska",
      "Damso",
      "Sexion d'Assaut",
      "Nekfeu",
      "Orelsan",
      "SCH",
      "Ninho"
    ];

    console.log(`[Seed] Recherche et import en direct de ${artistsToImport.length} artistes majeurs de la scène française...`);

    for (const name of artistsToImport) {
      try {
        console.log(`[Seed] Recherche de l'artiste : "${name}"...`);
        const searchResults = await searchArtists(name);
        
        if (searchResults.length === 0) {
          console.warn(`[Seed] Aucun artiste trouvé sur MusicBrainz pour : "${name}"`);
          continue;
        }

        // Find the best match (score 100 or matching name)
        const bestMatch = searchResults[0];
        console.log(`[Seed] Meilleure correspondance trouvée : ${bestMatch.name} (${bestMatch.id}). Lancement de l'import...`);
        
        await importArtist(bestMatch.id);
        console.log(`[Seed] Import réussi pour : ${bestMatch.name}`);

        // Wait 2 seconds between imports to strictly respect the MusicBrainz API rate limit
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.error(`[Seed] Échec de l'import en direct pour l'artiste "${name}" :`, err.message);
      }
    }

    console.log('[Seed] Processus de peuplement live terminé !');
  } catch (error) {
    console.error('[Seed] Erreur lors du peuplement :', error);
  } finally {
    await session.close();
    await driver.close();
    console.log('[Seed] Connexion Neo4j fermée');
  }
};

seed();
