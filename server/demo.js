// Hardcoded sample data for screenshots (enabled with DEMO_MODE=true in .env)

const venues = [
  { id: 'V001', name: 'Chennai Trade Centre', location: 'Nandambakkam, Chennai', capacity: 5000 },
  { id: 'V002', name: 'Jawaharlal Nehru Stadium', location: 'Periamet, Chennai', capacity: 40000 },
  { id: 'V003', name: 'Taj Convention Hall', location: 'Colaba, Mumbai', capacity: 1200 },
  { id: 'V004', name: 'HITEX Exhibition Centre', location: 'Madhapur, Hyderabad', capacity: 8000 },
];
const v = id => venues.find(x => x.id === id);

const events = [
  { id: 'E101', name: 'Tech Summit 2026', date: '2026-11-15', organizer: 'Nexus Events', venueId: 'V001', minTicketPrice: 1500 },
  { id: 'E102', name: 'Indie Music Night', date: '2026-11-22', organizer: 'Beats Entertainment', venueId: 'V003', minTicketPrice: 800 },
  { id: 'E103', name: 'Startup Pitch Fest', date: '2026-12-03', organizer: 'Venture Hub', venueId: 'V004', minTicketPrice: 500 },
  { id: 'E104', name: 'Food & Culture Carnival', date: '2026-12-12', organizer: 'Urban Fiesta', venueId: 'V002', minTicketPrice: 300 },
  { id: 'E105', name: 'Classical Dance Gala', date: '2027-01-09', organizer: 'Kala Productions', venueId: 'V003', minTicketPrice: 1000 },
  { id: 'E106', name: 'Marathon Expo 2027', date: '2027-01-24', organizer: 'RunIndia', venueId: 'V001', minTicketPrice: 600 },
].map(e => ({ ...e, venue: v(e.venueId).name, capacity: v(e.venueId).capacity }));

const customers = [
  { id: 'C001', name: 'Arjun Mehta', email: 'arjun.mehta@example.com' },
  { id: 'C002', name: 'Priya Nair', email: 'priya.nair@example.com' },
  { id: 'C003', name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
  { id: 'C004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com' },
  { id: 'C005', name: 'Karthik Raman', email: 'karthik.raman@example.com' },
  { id: 'C006', name: 'Sneha Reddy', email: 'sneha.reddy@example.com' },
  { id: 'C007', name: 'Vikram Singh', email: 'vikram.singh@example.com' },
  { id: 'C008', name: 'Divya Menon', email: 'divya.menon@example.com' },
];

const tickets = [
  { id: 'T001', type: 'Standard', price: 1500, event: 'Tech Summit 2026' },
  { id: 'T002', type: 'VIP', price: 4500, event: 'Tech Summit 2026' },
  { id: 'T003', type: 'General', price: 800, event: 'Indie Music Night' },
  { id: 'T004', type: 'Premium', price: 2000, event: 'Indie Music Night' },
  { id: 'T005', type: 'Delegate', price: 500, event: 'Startup Pitch Fest' },
  { id: 'T006', type: 'Investor Pass', price: 3000, event: 'Startup Pitch Fest' },
  { id: 'T007', type: 'Entry', price: 300, event: 'Food & Culture Carnival' },
  { id: 'T008', type: 'Family Pack', price: 1000, event: 'Food & Culture Carnival' },
  { id: 'T009', type: 'Gold', price: 1000, event: 'Classical Dance Gala' },
  { id: 'T010', type: 'Platinum', price: 2500, event: 'Classical Dance Gala' },
  { id: 'T011', type: 'Runner', price: 600, event: 'Marathon Expo 2027' },
  { id: 'T012', type: 'Expo Pass', price: 1200, event: 'Marathon Expo 2027' },
].sort((a, b) => b.price - a.price);

const bookings = [
  ['B010', 'C008', 'E104', '2026-10-21', 1000, 'Confirmed', 'Paid'],
  ['B009', 'C002', 'E105', '2026-10-19', 2000, 'Pending', 'Pending'],
  ['B008', 'C007', 'E102', '2026-10-16', 2000, 'Confirmed', 'Paid'],
  ['B007', 'C001', 'E106', '2026-10-14', 1200, 'Cancelled', 'Failed'],
  ['B006', 'C006', 'E105', '2026-10-12', 2500, 'Confirmed', 'Paid'],
  ['B005', 'C005', 'E104', '2026-10-09', 600, 'Confirmed', 'Paid'],
  ['B004', 'C004', 'E101', '2026-10-07', 3000, 'Pending', 'Pending'],
  ['B003', 'C003', 'E103', '2026-10-05', 3000, 'Confirmed', 'Paid'],
  ['B002', 'C002', 'E102', '2026-10-04', 1600, 'Confirmed', 'Paid'],
  ['B001', 'C001', 'E101', '2026-10-02', 4500, 'Confirmed', 'Paid'],
].map(([id, cid, eid, date, amount, status, paymentStatus]) => ({
  id, date, amount, status, paymentStatus,
  customerId: cid,
  customer: customers.find(c => c.id === cid).name,
  event: events.find(e => e.id === eid).name,
}));

const payments = [...bookings]
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((b, i) => ({
    id: `P${String(i + 1).padStart(3, '0')}`,
    bookingId: b.id, customer: b.customer, amount: b.amount, status: b.paymentStatus,
  }));

const customersOut = customers.map(c => ({ ...c, bookings: bookings.filter(b => b.customerId === c.id).length }));
const venuesOut = venues.map(x => ({ ...x, events: events.filter(e => e.venueId === x.id).map(e => e.name) }));

const statusCounts = {};
bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });

const dashboard = {
  events: events.length,
  customers: customers.length,
  bookings: bookings.length,
  venues: venues.length,
  revenue: payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
  bookingStatuses: Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
  upcomingEvents: events.slice(0, 5).map(e => ({ id: e.id, name: e.name, date: e.date, venue: e.venue })),
};

const node = (label, props) => ({ labels: [label], props });
const graph = [];
const link = (a, rel, b) => graph.push({
  sourceLabels: a.labels, source: a.props, relationship: rel, targetLabels: b.labels, target: b.props,
});
events.forEach(e => {
  link(node('Organizer', { name: e.organizer }), 'ORGANIZES', node('Event', { name: e.name }));
  link(node('Event', { name: e.name }), 'HELD_AT', node('Venue', { name: e.venue }));
});
bookings.forEach(b => {
  link(node('Customer', { name: b.customer }), 'MAKES', node('Booking', { booking_id: b.id }));
  link(node('Booking', { booking_id: b.id }), 'HAS_PAYMENT', node('Payment', { name: payments.find(p => p.bookingId === b.id).id }));
  link(node('Booking', { booking_id: b.id }), 'CONTAINS', node('Ticket', { name: b.event + ' ticket' }));
});

export const demoData = {
  dashboard, events, bookings, customers: customersOut, venues: venuesOut, tickets, payments, graph,
  health: { ok: true, database: 'neo4j', connected: true },
};
