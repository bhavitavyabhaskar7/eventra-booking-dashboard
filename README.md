# Eventra — Neo4j Event Booking Dashboard

A dark, responsive React dashboard with an Express API connected to your existing Neo4j Aura database.

## Features

- Dashboard metrics: events, customers, bookings, venues and paid revenue
- Events with organizer and venue
- Bookings with customer, event and payment status
- Customers, venues, tickets and payments tables
- Graph relationship explorer
- Search current table, refresh data and connection status
- Credentials stay on the backend in `.env`

## Requirements

- Node.js 18+ (recommended: current LTS)
- A Neo4j Aura database and its connection URI, username and password

## Setup on Windows

1. Install Node.js from https://nodejs.org/ if it is not installed.
2. Extract this project ZIP to a folder such as `C:\\Projects\\neo4j-event-booking`.
3. Open that folder in VS Code, or open PowerShell in the folder.
4. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Edit `.env` and fill in your Aura details:
   ```env
   NEO4J_URI=neo4j+s://your-aura-id.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-real-password
   NEO4J_DATABASE=neo4j
   PORT=4000
   ```
   Find the URI in the Aura console's connection details. Do not paste the password into chat or commit `.env`.
6. Install dependencies:
   ```powershell
   npm install
   ```
7. Start the frontend and backend:
   ```powershell
   npm run dev
   ```
8. Open http://localhost:5173 in your browser. The backend API is at http://localhost:4000/api/health.

## Important: expected graph schema

The API expects these node labels and properties:

- `Event`: `event_id`, `name`, `date`
- `Organizer`: `organizer_id`, `name`, `phone`
- `Venue`: `venue_id`, `name`, `location`, `capacity`
- `Customer`: `customer_id`, `name`, `email`
- `Booking`: `booking_id`, `booking_date`, `status`
- `Ticket`: `ticket_id`, `type`, `price`
- `Payment`: `payment_id`, `amount`, `status`

Expected relationships:

- `(Organizer)-[:ORGANIZES]->(Event)`
- `(Event)-[:HELD_AT]->(Venue)`
- `(Customer)-[:MAKES]->(Booking)`
- `(Booking)-[:CONTAINS]->(Ticket)`
- `(Ticket)-[:FOR]->(Event)`
- `(Booking)-[:HAS_PAYMENT]->(Payment)`

If your actual diagram uses different labels, relationship names, or properties, update the Cypher in `server/index.js` to match it. An empty page can mean that the graph is empty or the schema names differ.

## API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/events`
- `GET /api/bookings`
- `GET /api/customers`
- `GET /api/venues`
- `GET /api/tickets`
- `GET /api/payments`
- `GET /api/graph`

## Common issues

- **Authentication failed:** check username/password in `.env`.
- **Could not connect:** verify the Aura URI, database status, and network access.
- **Dashboard loads but tables are empty:** check that your labels, properties and relationships match the expected schema above.
- **Changes to `.env` not taking effect:** stop the server with Ctrl+C and restart `npm run dev`.
- **Never expose credentials:** do not put Neo4j credentials in React files or `VITE_` environment variables. Those are public in the browser build.

## Production notes

This is a coursework starter. Before deploying publicly, add authentication/authorization, validation, rate limiting, logging, and stricter CORS rules. Do not expose a public API that gives untrusted users access to your database.
