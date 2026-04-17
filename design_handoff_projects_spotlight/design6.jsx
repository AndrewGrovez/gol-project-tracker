// Design 6 — "Focus Spotlight"
// Single-project-at-a-time hero with a filmstrip of the rest.
// Designed for deep focus — the anti-dashboard.

function Design6_Spotlight() {
  const all = PROJECTS.filter(p => p.status !== 'completed');
  const focus = all[0];
  const strip = all.slice(1, 7);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: BRAND.navyDeep, color: 'white', fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Bg imagery */}
      <div style={{ position: 'absolute', inset: 0, background: `url(${focus.img}) center/cover`, opacity: 0.28, filter: 'saturate(1.2)' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,26,38,0.95) 0%, rgba(15,26,38,0.82) 55%, rgba(15,26,38,0.45) 100%)' }}/>

      <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
        <Sidebar active="Projects" />
        <div style={{ flex: 1, padding: '26px 40px 30px', display: 'flex', flexDirection: 'column' }}>
          {/* Top nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>Focus mode</div>
              <div style={{ display: 'flex', gap: 4, fontSize: 12.5 }}>
                <div style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 99, color: 'white' }}>Focus</div>
                <div style={{ padding: '5px 12px', color: 'rgba(255,255,255,0.5)' }}>Board</div>
                <div style={{ padding: '5px 12px', color: 'rgba(255,255,255,0.5)' }}>Timeline</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchField dark/>
              <PrimaryBtn>+ New project</PrimaryBtn>
            </div>
          </div>

          {/* Hero project */}
          <div style={{ flex: 1, display: 'flex', gap: 40, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: '4px 10px', background: focus.color, color: BRAND.navy, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, borderRadius: 3 }}>{focus.tag.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>{focus.code} · LIVE</div>
              </div>
              <h1 style={{ fontSize: 60, fontWeight: 900, margin: 0, letterSpacing: -2, lineHeight: 0.98 }}>
                {focus.emoji} {focus.name}
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)', marginTop: 18, maxWidth: 520 }}>
                {focus.description}
              </p>

              {/* Big stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 28, maxWidth: 560 }}>
                {[
                  { k: 'Progress', v: `${focus.progress}%`, c: focus.color },
                  { k: 'Kicks off', v: focus.due },
                  { k: 'Teams', v: focus.teams },
                  { k: 'Venues', v: focus.venues },
                ].map(s => (
                  <div key={s.k}>
                    <div style={{ fontSize: 10, letterSpacing: 1.8, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>{s.k}</div>
                    <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4, color: s.c || 'white', letterSpacing: -1, fontFamily: 'ui-monospace, "SF Mono", monospace' }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
                <div style={{ padding: '12px 22px', background: BRAND.lime, color: BRAND.navy, borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(129,187,38,0.35)' }}>Open project →</div>
                <div style={{ padding: '12px 22px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.15)' }}>View tasks</div>
                <div style={{ padding: '12px 18px', background: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: 10, fontWeight: 500, fontSize: 14 }}>⋯</div>
              </div>
            </div>

            {/* Right: progress ring + team */}
            <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <ProgressRing p={focus}/>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, backdropFilter: 'blur(14px)' }}>
                <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Today's focus</div>
                {[
                  'Confirm Riverside pitch availability',
                  'Finalise team-captain welcome email',
                  'Review refereeing rota w/ Aaron',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid rgba(255,255,255,0.3)`, flexShrink: 0 }}/>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filmstrip */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 10px' }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Up next · {strip.length} projects</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>← → to navigate</div>
            </div>
            <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
              {strip.map((p) => <FilmstripCard key={p.id} p={p}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ p }) {
  const r = 68, c = 2 * Math.PI * r;
  const offset = c * (1 - p.progress / 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 22, backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
        <circle cx="80" cy="80" r={r} fill="none" stroke={p.color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 80 80)"/>
        <text x="80" y="78" textAnchor="middle" fill="white" fontSize="36" fontWeight="800" fontFamily="ui-monospace, monospace">{p.progress}</text>
        <text x="80" y="98" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11" fontWeight="600" letterSpacing="2">% COMPLETE</text>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Team</div>
        <div style={{ marginTop: 8 }}><AvatarStack names={p.team}/></div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>Led by <strong style={{ color: 'white' }}>{p.owner}</strong></div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>updated {p.updated}</div>
      </div>
    </div>
  );
}

function FilmstripCard({ p }) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 14,
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: p.color, fontWeight: 700, letterSpacing: 0.5 }}>{p.code}</div>
        <StatusDot status={p.status}/>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, color: 'white', height: 36, overflow: 'hidden' }}>{p.emoji} {p.name}</div>
      <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${p.progress}%`, height: '100%', background: p.color }}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.progress}%</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{p.due}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Design6_Spotlight });
