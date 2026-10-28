import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CalendarDays, ChevronDown, CircleDollarSign, Command, CreditCard,
  Database, LayoutDashboard, MapPin, Menu, Network, RefreshCw, Search,
  Ticket, Users, X, ArrowUpRight, CalendarCheck, Building2, CheckCircle2, AlertCircle
} from 'lucide-react';

const nav = [
  ['Overview', 'overview', LayoutDashboard],
  ['Events', 'events', CalendarDays],
  ['Bookings', 'bookings', CalendarCheck],
  ['Customers', 'customers', Users],
  ['Venues', 'venues', MapPin],
  ['Tickets', 'tickets', Ticket],
  ['Payments', 'payments', CreditCard],
  ['Graph explorer', 'graph', Network],
];
const money = value => value == null || value === '' ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateText = value => value ? String(value).slice(0, 10) : '—';
const titleCase = value => value ? String(value).replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) : '';

function Badge({ children }) {
  const val = String(children || 'Unknown').toLowerCase();
  const type = ['confirmed','paid','completed','success'].includes(val) ? 'green' : ['pending','processing'].includes(val) ? 'amber' : ['failed','cancelled','canceled'].includes(val) ? 'red' : 'slate';
  return <span className={`badge ${type}`}><span />{children || 'Unknown'}</span>;
}
function Empty({ text = 'No records found' }) { return <div className="empty"><Database size={25}/><p>{text}</p><small>Check your Aura connection and confirm that your sample data is loaded.</small></div>; }
function Table({ columns, rows, search, empty }) {
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return rows.filter(row => !q || columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q)));
  }, [rows, search, columns]);
  if (!filtered.length) return <Empty text={empty || 'No matching records'} />;
  return <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead><tbody>
    {filtered.map((row, i) => <tr key={`${row.id ?? row.name ?? 'row'}-${i}`}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>)}</tr>)}
  </tbody></table></div>;
}
function Stat({ icon: Icon, label, value, note, color }) {
  return <div className="stat"><div className={`stat-icon ${color}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [data, setData] = useState({});
  const [health, setHealth] = useState({ loading: true, ok: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  const endpoints = ['dashboard','events','bookings','customers','venues','tickets','payments','graph'];
  async function loadAll() {
    setLoading(true); setError('');
    try {
      const results = await Promise.all(endpoints.map(async key => {
        const res = await fetch(`/api/${key}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.detail || body.error || `Failed to load ${key}`);
        return [key, body];
      }));
      setData(Object.fromEntries(results));
      setHealth({ loading: false, ok: true });
    } catch (e) {
      setError(e.message || 'Could not connect to the backend.');
      setHealth({ loading: false, ok: false });
    } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  const pageTitle = nav.find(n => n[1] === page)?.[0] || 'Overview';
  const dash = data.dashboard || {};
  const list = data[page] || [];
  const columns = {
    events: [
      { key: 'id', label: 'Event ID' }, { key: 'name', label: 'Event' },
      { key: 'date', label: 'Date', render: v => dateText(v) },
      { key: 'organizer', label: 'Organizer' }, { key: 'venue', label: 'Venue' },
      { key: 'minTicketPrice', label: 'From', render: v => money(v) },
    ],
    bookings: [
      { key: 'id', label: 'Booking ID' }, { key: 'customer', label: 'Customer' },
      { key: 'event', label: 'Event' }, { key: 'date', label: 'Booking date', render: v => dateText(v) },
      { key: 'amount', label: 'Amount', render: v => money(v) },
      { key: 'status', label: 'Booking status', render: v => <Badge>{v}</Badge> },
      { key: 'paymentStatus', label: 'Payment', render: v => <Badge>{v}</Badge> },
    ],
    customers: [
      { key: 'id', label: 'Customer ID' }, { key: 'name', label: 'Customer' },
      { key: 'email', label: 'Email' }, { key: 'bookings', label: 'Bookings' },
    ],
    venues: [
      { key: 'id', label: 'Venue ID' }, { key: 'name', label: 'Venue' },
      { key: 'location', label: 'Location' }, { key: 'capacity', label: 'Capacity' },
      { key: 'events', label: 'Events', render: v => (v || []).filter(Boolean).join(', ') || '—' },
    ],
    tickets: [
      { key: 'id', label: 'Ticket ID' }, { key: 'event', label: 'Event' },
      { key: 'type', label: 'Ticket type' }, { key: 'price', label: 'Price', render: v => money(v) },
    ],
    payments: [
      { key: 'id', label: 'Payment ID' }, { key: 'bookingId', label: 'Booking ID' },
      { key: 'customer', label: 'Customer' }, { key: 'amount', label: 'Amount', render: v => money(v) },
      { key: 'status', label: 'Status', render: v => <Badge>{v}</Badge> },
    ],
  };

  function renderOverview() {
    const statuses = dash.bookingStatuses || [];
    const maxStatus = Math.max(1, ...statuses.map(s => Number(s.value) || 0));
    return <>
      <div className="welcome"><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h2>Your events, <span>at a glance.</span></h2><p>Here's what's happening across your event booking database.</p></div><button className="button primary" onClick={() => setPage('events')}><CalendarDays size={16}/> Explore events <ArrowUpRight size={16}/></button></div>
      <div className="stats-grid">
        <Stat icon={CalendarDays} label="Total events" value={dash.events ?? '—'} note="Events in your database" color="purple"/>
        <Stat icon={Users} label="Customers" value={dash.customers ?? '—'} note="Registered customers" color="blue"/>
        <Stat icon={CalendarCheck} label="Bookings" value={dash.bookings ?? '—'} note="All booking records" color="orange"/>
        <Stat icon={CircleDollarSign} label="Paid revenue" value={money(dash.revenue)} note="Successful payments only" color="green"/>
      </div>
      <div className="overview-grid">
        <section className="panel"><div className="panel-head"><div><h3>Upcoming events</h3><p>Your next scheduled events</p></div><button className="text-button" onClick={() => setPage('events')}>View all <ArrowUpRight size={14}/></button></div>
          {(dash.upcomingEvents || []).length ? <div className="event-list">{dash.upcomingEvents.map((e,i) => <div className="event-row" key={e.id ?? i}><div className="event-date"><span>{dateText(e.date).slice(8,10) || '—'}</span><small>{dateText(e.date).slice(5,7) || ''}</small></div><div className="event-info"><strong>{e.name || 'Untitled event'}</strong><span><MapPin size={13}/>{e.venue || 'Venue not assigned'}</span></div><ArrowUpRight className="muted-icon" size={16}/></div>)}</div> : <Empty text="No events yet"/>}
        </section>
        <section className="panel"><div className="panel-head"><div><h3>Booking status</h3><p>Breakdown by current status</p></div><Activity size={17} className="muted-icon"/></div>
          {statuses.length ? <div className="status-bars">{statuses.map(s => <div className="bar-item" key={s.name}><div className="bar-label"><span>{s.name}</span><strong>{s.value}</strong></div><div className="bar-track"><div className="bar-fill" style={{width:`${(Number(s.value)/maxStatus)*100}%`}}/></div></div>)}</div> : <Empty text="No booking status data"/>}
          <div className="mini-note"><CheckCircle2 size={15}/> Live summary from Neo4j</div>
        </section>
      </div>
      <section className="panel database-panel"><div className="db-symbol"><Network size={22}/></div><div className="db-copy"><h3>Connected data, one workspace</h3><p>Explore the graph behind your events, customers, bookings, tickets and venues.</p></div><button className="button secondary" onClick={() => setPage('graph')}>Open graph explorer <ArrowUpRight size={15}/></button></section>
    </>;
  }

  function renderGraph() {
    const rows = data.graph || [];
    return <section className="panel"><div className="panel-head"><div><h3>Relationship explorer</h3><p>Up to 150 relationships returned from your Neo4j graph.</p></div><span className="live-pill">LIVE DATA</span></div>
      {rows.length ? <div className="graph-list">{rows.map((r,i) => <div className="graph-row" key={i}><div className="graph-node"><span>{(r.sourceLabels || ['Node'])[0]}</span><strong>{r.source?.name || r.source?.event_id || r.source?.customer_id || r.source?.booking_id || 'Entity'}</strong></div><div className="graph-link"><span>{r.relationship}</span><div/></div><div className="graph-node target"><span>{(r.targetLabels || ['Node'])[0]}</span><strong>{r.target?.name || r.target?.event_id || r.target?.customer_id || r.target?.booking_id || 'Entity'}</strong></div></div>)}</div> : <Empty text="No relationships found"/>}
    </section>;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Command size={21}/></div><div><strong>eventra<span>.</span></strong><small>BOOKING INTELLIGENCE</small></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{nav.map(([label,key,Icon]) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => {setPage(key);setSearch('');setMobileNav(false);}}><Icon size={18}/><span>{label}</span>{key === 'graph' && <span className="nav-new">DB</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="connection-card"><div className="connection-top"><span className={`connection-dot ${health.ok ? 'ok' : ''}`}/><strong>{health.ok ? 'Database connected' : health.loading ? 'Connecting…' : 'Connection issue'}</strong></div><p>{health.ok ? 'Neo4j Aura · Live sync' : 'Check your API and Aura credentials.'}</p><button onClick={loadAll}><RefreshCw size={13}/> Refresh connection</button></div><div className="user-chip"><div className="avatar">DA</div><div><strong>DA3 Project</strong><small>Event booking system</small></div><ChevronDown size={15}/></div></div>
    </aside>
    {mobileNav && <button aria-label="Close navigation overlay" className="overlay" onClick={() => setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar"><div className="top-left"><button className="menu-toggle" onClick={() => setMobileNav(true)}><Menu size={20}/></button><span className="breadcrumb">Workspace</span><span className="crumb-sep">/</span><strong>{pageTitle}</strong></div><div className="top-right"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search current page..." /></div><button className="icon-button" title="Refresh data" onClick={loadAll}><RefreshCw size={17} className={loading ? 'spin' : ''}/></button><div className={`sync-state ${health.ok ? 'connected' : ''}`}><span/>{health.ok ? 'Synced' : 'Offline'}</div></div></header>
      <div className="content">
        {error && <div className="error-banner"><AlertCircle size={18}/><div><strong>Could not load live data</strong><p>{error}</p><small>Make sure the backend is running and your .env values are correct.</small></div><button onClick={loadAll}>Retry</button></div>}
        {page === 'overview' && renderOverview()}
        {page === 'graph' && renderGraph()}
        {columns[page] && <section className="panel data-panel"><div className="panel-head"><div><h3>{pageTitle}</h3><p>{(data[page] || []).length} records from your Neo4j database</p></div><button className="button secondary" onClick={loadAll}><RefreshCw size={15}/> Refresh data</button></div><Table columns={columns[page]} rows={list} search={search} /></section>}
        <footer><span>EVENTRA <b>·</b> DA3 EVENT BOOKING</span><span><Database size={13}/> Powered by Neo4j Aura</span></footer>
      </div>
    </main>
  </div>;
}