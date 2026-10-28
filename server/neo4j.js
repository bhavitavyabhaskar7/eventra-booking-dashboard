import neo4j from 'neo4j-driver';

let driver;

export function getDriver() {
  if (driver) return driver;

  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    throw new Error('Neo4j is not configured. Copy .env.example to .env and fill in your Aura credentials.');
  }
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
  return driver;
}

export async function runQuery(cypher, params = {}) {
  const db = process.env.NEO4J_DATABASE || 'neo4j';
  const session = getDriver().session({ database: db });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

export function plain(value) {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    if (value.constructor?.name === 'Node') {
      return { labels: value.labels, properties: plain(value.properties) };
    }
    if (value.constructor?.name === 'Relationship') {
      return { type: value.type, properties: plain(value.properties) };
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  }
  return value;
}

export async function closeDriver() {
  if (driver) await driver.close();
}