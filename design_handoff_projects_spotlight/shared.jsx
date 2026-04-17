// Shared chrome and primitives for all Projects-page designs.
// Brand: navy #1c3145, lime #81bb26, warm off-white canvas.

const BRAND = {
  navy: '#1c3145',
  navyDeep: '#13202e',
  navySoft: '#24425e',
  lime: '#81bb26',
  limeGlow: '#a5e236',
  cream: '#f6f3ec',
  paper: '#fbfaf7',
  ink: '#0f1a26',
  muted: '#6b7a8c',
  line: '#e7e3d9',
  amber: '#e8a53a',
  rose: '#d9544b',
  sky: '#3a8dbf',
};

// ──────────────────────────────────────────────────────────────
// Sidebar — real navigation chrome from the GOL app
// ──────────────────────────────────────────────────────────────
function Sidebar({ active = 'Projects' }) {
  const items = [
    { label: 'Projects', icon: 'home' },
    { label: 'My Dashboard', icon: 'dash' },
    { label: 'My Tasks', icon: 'check' },
    { label: 'Year-By-Year', icon: 'cal' },
  ];
  const groups = [
    { header: 'Leagues', items: [
      { label: 'Churn Rates', icon: 'trend' },
      { label: 'Churn Analysis', icon: 'pie' },
      { label: 'League Analysis', icon: 'trophy' },
    ]},
    { header: 'Bookings', items: [
      { label: 'Bookings Analysis', icon: 'cal' },
    ]},
    { header: 'Marketing', items: [
      { label: 'Social Scheduler', icon: 'clock' },
    ]},
    { header: 'Analytics', items: [
      { label: 'Social Analytics', icon: 'line' },
      { label: 'Web Analytics', icon: 'bar' },
    ]},
  ];

  return (
    <aside style={{
      width: 224,
      background: BRAND.navy,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 10px',
      fontSize: 13,
      flexShrink: 0,
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 18px' }}>
        <img src="assets/GolLogo.png" alt="GOL" style={{ height: 32, objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 4, marginBottom: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center',
          color: 'rgba(255,255,255,0.6)', fontSize: 12, border: '1px solid rgba(255,255,255,0.08)',
        }}>‹</div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {items.map((it) => (
          <NavRow key={it.label} {...it} active={active === it.label} />
        ))}
        {groups.map((g) => (
          <div key={g.header}>
            <div style={{
              padding: '14px 14px 6px',
              fontSize: 10.5, letterSpacing: 1.1, fontWeight: 600,
              color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
            }}>{g.header}</div>
            {g.items.map((it) => (
              <NavRow key={it.label} {...it} active={active === it.label} />
            ))}
          </div>
        ))}
      </div>

      <NavRow label="Sign Out" icon="out" />
    </aside>
  );
}

function NavRow({ label, icon, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', margin: '1px 0',
      borderRadius: 8,
      background: active ? 'rgba(129,187,38,0.22)' : 'transparent',
      color: active ? 'white' : 'rgba(255,255,255,0.82)',
      fontWeight: active ? 600 : 500,
      fontSize: 13,
    }}>
      <NavIcon kind={icon} />
      <span>{label}</span>
    </div>
  );
}

function NavIcon({ kind }) {
  const s = { width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'home': return <svg viewBox="0 0 24 24" {...s}><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>;
    case 'dash': return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    case 'check': return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/></svg>;
    case 'cal': return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>;
    case 'trend': return <svg viewBox="0 0 24 24" {...s}><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>;
    case 'pie': return <svg viewBox="0 0 24 24" {...s}><path d="M12 3v9h9a9 9 0 1 1-9-9z"/></svg>;
    case 'trophy': return <svg viewBox="0 0 24 24" {...s}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3M10 13h4v4h-4zM8 21h8"/></svg>;
    case 'clock': return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'line': return <svg viewBox="0 0 24 24" {...s}><path d="M3 3v18h18"/><path d="M7 14l4-5 3 3 5-7"/></svg>;
    case 'bar': return <svg viewBox="0 0 24 24" {...s}><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7"/><rect x="12" y="7" width="3" height="11"/><rect x="17" y="14" width="3" height="4"/></svg>;
    case 'out': return <svg viewBox="0 0 24 24" {...s}><path d="M15 3h5v18h-5"/><path d="M10 17l-5-5 5-5M5 12h11"/></svg>;
    default: return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

// ──────────────────────────────────────────────────────────────
// Realistic project data, based on the GOL / sports business
// ──────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'p1', code: 'LGE-42',
    name: 'Autumn Leagues 2026', emoji: '🏆',
    description: 'Recruit, schedule and launch 18 adult 7-a-side leagues across 4 venues.',
    status: 'in_progress', progress: 62,
    owner: 'Andrew', team: ['Andrew', 'Jake', 'Steve'],
    updated: '2h ago', due: 'Sep 12', venues: 4, teams: 124,
    tasks: { done: 28, total: 45 }, kpi: '+14% vs Spring',
    tag: 'Leagues', color: BRAND.lime, img: 'assets/leagues.png',
  },
  {
    id: 'p2', code: 'BKG-17',
    name: 'Pitch Booking Revamp', emoji: '📅',
    description: 'Rebuild end-to-end booking flow; target 30% reduction in no-shows.',
    status: 'in_progress', progress: 38,
    owner: 'Jake', team: ['Jake', 'Aaron'],
    updated: '30m ago', due: 'Jul 02', venues: 6, teams: 0,
    tasks: { done: 11, total: 29 }, kpi: '−22% no-shows',
    tag: 'Bookings', color: BRAND.sky, img: 'assets/bookings.jpg',
  },
  {
    id: 'p3', code: 'SCH-08',
    name: 'Soccer Schools Summer', emoji: '⚽️',
    description: 'Full summer holiday camps programme across six locations.',
    status: 'not_started', progress: 6,
    owner: 'Steve', team: ['Steve', 'Emma'],
    updated: 'yesterday', due: 'Aug 05', venues: 6, teams: 42,
    tasks: { done: 2, total: 34 }, kpi: '320 bookings goal',
    tag: 'Schools', color: BRAND.amber, img: 'assets/soccer-schools.jpg',
  },
  {
    id: 'p4', code: 'CRN-03',
    name: 'Churn Reduction Q2', emoji: '📉',
    description: 'Identify at-risk teams, launch win-back offers & improve retention.',
    status: 'delayed', progress: 44,
    owner: 'Aaron', team: ['Aaron', 'Andrew'],
    updated: '4h ago', due: 'Jun 30', venues: 0, teams: 0,
    tasks: { done: 9, total: 20 }, kpi: '−8% churn target',
    tag: 'Retention', color: BRAND.rose, img: null,
  },
  {
    id: 'p5', code: 'EVT-11',
    name: 'Bubble Football Launch', emoji: '🫧',
    description: 'New product line — weekend sessions, stag parties, corporate events.',
    status: 'in_progress', progress: 78,
    owner: 'Emma', team: ['Emma', 'Jake'],
    updated: '1h ago', due: 'May 24', venues: 3, teams: 0,
    tasks: { done: 18, total: 23 }, kpi: '48 booked',
    tag: 'Events', color: '#b85ec9', img: 'assets/bubble.jpg',
  },
  {
    id: 'p6', code: 'MKT-22',
    name: 'Old School Sports Day', emoji: '🥇',
    description: 'Annual corporate event — content calendar, partnerships & on-day ops.',
    status: 'in_progress', progress: 52,
    owner: 'Andrew', team: ['Andrew', 'Emma', 'Steve'],
    updated: '6h ago', due: 'Jul 19', venues: 1, teams: 22,
    tasks: { done: 14, total: 27 }, kpi: '22 teams reg.',
    tag: 'Events', color: '#e8a53a', img: 'assets/sports-day.jpg',
  },
  {
    id: 'p7', code: 'SOC-04',
    name: 'Instagram Reels Sprint', emoji: '📱',
    description: 'Daily reels across all brands — test hooks, scale what works.',
    status: 'completed', progress: 100,
    owner: 'Jake', team: ['Jake'],
    updated: '3d ago', due: 'Apr 10', venues: 0, teams: 0,
    tasks: { done: 21, total: 21 }, kpi: '+180% reach',
    tag: 'Marketing', color: BRAND.lime, img: null,
  },
  {
    id: 'p8', code: 'LGE-43',
    name: 'Womens League Pilot', emoji: '✨',
    description: 'New standalone womens 5-a-side league at Cardiff Central.',
    status: 'in_progress', progress: 24,
    owner: 'Emma', team: ['Emma', 'Andrew'],
    updated: '45m ago', due: 'Aug 30', venues: 1, teams: 14,
    tasks: { done: 6, total: 25 }, kpi: '14 / 16 teams',
    tag: 'Leagues', color: BRAND.sky, img: 'assets/7aside.jpg',
  },
];

// ──────────────────────────────────────────────────────────────
// Shared UI bits
// ──────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    in_progress: BRAND.lime,
    not_started: BRAND.muted,
    completed: BRAND.navy,
    delayed: BRAND.rose,
  };
  return <span style={{ width: 8, height: 8, borderRadius: 99, background: map[status] || BRAND.muted, display: 'inline-block' }}/>;
}

function StatusLabel({ status }) {
  const map = {
    in_progress: 'In progress',
    not_started: 'Not started',
    completed: 'Completed',
    delayed: 'Delayed',
  };
  return map[status] || status;
}

function AvatarInitials({ name, size = 24, i = 0 }) {
  const palette = ['#81bb26', '#3a8dbf', '#e8a53a', '#d9544b', '#b85ec9', '#1c3145'];
  const bg = palette[i % palette.length];
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: 99,
      background: bg, color: 'white',
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      boxShadow: '0 0 0 2px white',
      letterSpacing: -0.2,
    }}>{initials}</div>
  );
}

function AvatarStack({ names }) {
  return (
    <div style={{ display: 'flex' }}>
      {names.map((n, i) => (
        <div key={n} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <AvatarInitials name={n} i={i} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { BRAND, Sidebar, PROJECTS, StatusDot, StatusLabel, AvatarInitials, AvatarStack });
