import neo4j, { Driver, Session, isInt } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'musicgraphpassword';

let driver: Driver;

try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  console.log(`[Neo4j] Driver initialized for ${uri}`);
} catch (error) {
  console.error('[Neo4j] Driver initialization failed:', error);
  process.exit(1);
}

export const getSession = (): Session => {
  return driver.session();
};

export const closeDriver = async (): Promise<void> => {
  await driver.close();
  console.log('[Neo4j] Driver closed');
};

/**
 * Recursively converts Neo4j Integers into standard JavaScript numbers
 */
export const convertNeo4jTypes = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (isInt(obj)) return obj.toNumber();
  if (Array.isArray(obj)) return obj.map(convertNeo4jTypes);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertNeo4jTypes(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

/**
 * Run a read transaction query on Neo4j
 */
export const runRead = async <T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> => {
  const session = getSession();
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map((record) => convertNeo4jTypes(record.toObject()) as T);
  } catch (error) {
    console.error(`[Neo4j] Read query error:`, error);
    throw error;
  } finally {
    await session.close();
  }
};

/**
 * Run a write transaction query on Neo4j
 */
export const runWrite = async <T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> => {
  const session = getSession();
  try {
    const result = await session.executeWrite((tx) => tx.run(cypher, params));
    return result.records.map((record) => convertNeo4jTypes(record.toObject()) as T);
  } catch (error) {
    console.error(`[Neo4j] Write query error:`, error);
    throw error;
  } finally {
    await session.close();
  }
};


export default driver;
