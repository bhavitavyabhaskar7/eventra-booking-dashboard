import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runQuery, plain, closeDriver } from './neo4j.js';
import { demoData } from './demo.js';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

// DEMO_MODE=true in .env -> serve hardcoded sample data instead of querying Neo4j
if (String(process.env.DEMO_MODE).toLowerCase() === 'true') {
  console.log('DEMO MODE ON: serving hardcoded sample data');
  app.get('/api/:resource', (req, res, next) => {
    const data = demoData[req.params.resource];
    return data ? res.json(data) : next();
  });
}

const sendError = (res, error) => {
  console.error(error);
  res.status(500).json({
    error: 'The request failed. Check that your Aura credentials, database name, labels, and relationships are correct.',
    detail: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

app.get('/api/health', async (_req, res) => {
  try {
    const records = await runQuery('RETURN 1 AS connected');
    res.json({ ok: true, database: process.env.NEO4J_DATABASE || 'neo4j', connected: records[0].get('connected') === 1 });
  } catch (error) { sendError(res, error); }
});

app.get('/api/dashboard', async (_req, res) => {
  try {
    const queries = {
      events: 'MATCH (n:Event) RETURN count(n) AS total',
      customers: 'MATCH (n:Customer) RETURN count(n) AS total',
      bookings: 'MATCH (n:Booking) RETURN count(n) AS total',
      venues: 'MATCH (n:Venue) RETURN count(n) AS total',
      revenue: "MATCH (p:Payment) WHERE toLower(coalesce(p.status, '')) IN ['paid','completed','success'] RETURN coalesce(sum(toFloat(p.amount)), 0) AS total",
      bookingStatuses: 'MATCH (b:Booking) RETURN coalesce(b.status, "Unknown") AS name, count(b) AS value ORDER BY value DESC',
      upcomingEvents: "MATCH (e:Event) OPTIONAL MATCH (e)-[:HELD_AT]->(v:Venue) RETURN e.event_id AS id, e.name AS name, e.date AS date, v.name AS venue ORDER BY e.date LIMIT 5"
    };
    const entries = await Promise.all(Object.entries(queries).map(async ([key, q]) => {
      const records = await runQuery(q);
      return [key, records.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))])))];
    }));
    const result = Object.fromEntries(entries);
    for (const key of ['events','customers','bookings','venues','revenue']) {
      result[key] = result[key]?.[0]?.total ?? 0;
    }
    res.json(result);
  } catch (error) { sendError(res, error); }
});

app.get('/api/events', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (e:Event)
      OPTIONAL MATCH (o:Organizer)-[:ORGANIZES]->(e)
      OPTIONAL MATCH (e)-[:HELD_AT]->(v:Venue)
      OPTIONAL MATCH (t:Ticket)-[:FOR]->(e)
      RETURN e.event_id AS id, e.name AS name, e.date AS date,
             o.name AS organizer, v.name AS venue, v.capacity AS capacity,
             min(toFloat(t.price)) AS minTicketPrice
      ORDER BY e.date
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/bookings', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (c:Customer)-[:MAKES]->(b:Booking)
      OPTIONAL MATCH (b)-[:HAS_PAYMENT]->(p:Payment)
      OPTIONAL MATCH (b)-[:CONTAINS]->(t:Ticket)-[:FOR]->(e:Event)
      RETURN b.booking_id AS id, b.booking_date AS date, b.status AS status,
             c.name AS customer, e.name AS event, p.amount AS amount, p.status AS paymentStatus
      ORDER BY b.booking_date DESC
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/venues', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (v:Venue)
      OPTIONAL MATCH (e:Event)-[:HELD_AT]->(v)
      RETURN v.venue_id AS id, v.name AS name, v.location AS location,
             v.capacity AS capacity, collect(e.name) AS events
      ORDER BY v.name
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/customers', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (c:Customer)
      OPTIONAL MATCH (c)-[:MAKES]->(b:Booking)
      RETURN c.customer_id AS id, c.name AS name, c.email AS email,
             count(b) AS bookings
      ORDER BY c.name
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/tickets', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (t:Ticket)
      OPTIONAL MATCH (t)-[:FOR]->(e:Event)
      RETURN t.ticket_id AS id, t.type AS type, t.price AS price, e.name AS event
      ORDER BY toFloat(t.price) DESC
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/payments', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (b:Booking)-[:HAS_PAYMENT]->(p:Payment)
      OPTIONAL MATCH (c:Customer)-[:MAKES]->(b)
      RETURN p.payment_id AS id, p.amount AS amount, p.status AS status,
             b.booking_id AS bookingId, c.name AS customer
      ORDER BY p.payment_id
    `);
    res.json(rows.map(r => Object.fromEntries(r.keys.map(k => [k, plain(r.get(k))]))));
  } catch (error) { sendError(res, error); }
});

app.get('/api/graph', async (_req, res) => {
  try {
    const rows = await runQuery(`
      MATCH (a)-[r]->(b)
      RETURN labels(a) AS sourceLabels, properties(a) AS source,
             type(r) AS relationship, labels(b) AS targetLabels, properties(b) AS target
      LIMIT 150
    `);
    res.json(rows.map(r => ({
      sourceLabels: plain(r.get('sourceLabels')),
      source: plain(r.get('source')),
      relationship: r.get('relationship'),
      targetLabels: plain(r.get('targetLabels')),
      target: plain(r.get('target'))
    })));
  } catch (error) { sendError(res, error); }
});

app.use((error, _req, res, _next) => sendError(res, error));
const server = app.listen(port, () => console.log(`API ready at http://localhost:${port}`));
process.on('SIGINT', async () => { server.close(); await closeDriver(); process.exit(0); });
process.on('SIGTERM', async () => { server.close(); await closeDriver(); process.exit(0); });
