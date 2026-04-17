# Handoff: Projects Page — "Focus Spotlight"

## Overview

Redesign of the **Projects** landing page for the GOL internal tool. Replaces the current grid of cards with a single-project "spotlight" experience: one large featured project is rendered hero-style against full-bleed imagery, with a filmstrip of the remaining active projects along the bottom for quick navigation.

The goal is to make the most important / most recently worked project feel like the user's "today" — less of a dashboard, more of a cockpit.

## About the Design Files

The files in this bundle are **design references created in HTML/React (via inline Babel)** — prototypes showing intended look and behaviour, not production code to drop in.

Your task: **recreate this design inside the existing Next.js app (`project-tracker/`)** using its established patterns:
- `src/components/ProjectList.tsx` is the current component — this design replaces it
- Existing shadcn-style UI in `src/components/ui/*` (Button, Card, Input, Select)
- Tailwind classes, `lucide-react` icons
- Supabase client via `createClient()` from `src/utils/supabase/client`
- Types from `src/types/database.types.ts`

Do NOT copy the inline-style React in the reference files verbatim — they use inline styles for fast prototyping. Translate to Tailwind + the existing component library.

## Fidelity

**High-fidelity.** Colors, typography, spacing, layout, and interactions are all specified. Match pixel-for-pixel at a 1440×900 target viewport, then make it responsive.

## Target screen

**Route:** `/` (already serving `<ProjectList />` via `src/app/page.tsx`)

## Layout (1440×900 reference)

```
┌─────────┬──────────────────────────────────────────────┐
│         │ Top bar: "Focus mode" label · view toggle    │  ← 26px top padding
│ Sidebar │        (Focus / Board / Timeline) ............ Search · + New project
│ (224px) ├──────────────────────────────────────────────┤
│ (existing)│                                              │
│         │  ┌──────────────────────┐  ┌──────────────┐ │
│         │  │ Tag chip · CODE LIVE │  │              │ │
│         │  │                      │  │  Progress    │ │
│         │  │  HERO TITLE (60px)   │  │  Ring (160)  │ │
│         │  │                      │  │  + Team card │ │
│         │  │  Description         │  │              │ │
│         │  │                      │  │  ┌─────────┐ │ │
│         │  │  [4 big stat cells]  │  │  │ Today's │ │ │
│         │  │                      │  │  │  focus  │ │ │
│         │  │  [Open] [Tasks] [⋯]  │  │  │ list    │ │ │
│         │  └──────────────────────┘  │  └─────────┘ │ │
│         │                              └──────────────┘ │
│         │                                                │
│         │  "Up next · N projects"      ← → to navigate │
│         │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│         │  │  │ │  │ │  │ │  │ │  │ │  │  filmstrip  │
│         │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘              │
└─────────┴──────────────────────────────────────────────┘
```

- The whole right side uses **full-bleed blurred imagery of the current focus project** as the background, with a dark navy gradient on top for legibility.
- Left column ≈ `flex: 1 max-width: 640px`; right column = `340px` fixed width.
- Filmstrip: 6 equal-width cards in a horizontal flex row with 10px gap, overflow hidden.

## Design tokens

```ts
// Brand (already in use across the app)
const BRAND = {
  navy:      '#1c3145',  // primary navy
  navyDeep:  '#13202e',  // page bg
  navySoft:  '#24425e',
  lime:      '#81bb26',  // accent / CTA
  limeGlow:  '#a5e236',  // highlight on dark
  rose:      '#d9544b',  // delayed
  amber:     '#e8a53a',  // watch
  sky:       '#3a8dbf',  // bookings tag
};

// Glass surface (used for progress-ring card, today-focus card, filmstrip cards)
background: rgba(255,255,255,0.05) — 0.06
border:     1px solid rgba(255,255,255,0.10)
borderRadius: 12–16
backdropFilter: blur(14px)

// Typography scale
Hero title:     60px / 900 / letter-spacing -2 / line-height 0.98
Body lead:      17px / 400 / line-height 1.5
Big stat value: 34px / 800 / letter-spacing -1 / ui-monospace
Stat label:     10px / 700 / letter-spacing 1.8 / uppercase
Section eyebrow:11px / 700 / letter-spacing 1.5 / uppercase / rgba(255,255,255,0.55)
Body small:     13px / 400 / rgba(255,255,255,0.85)
Meta/timestamp: 11px / 400 / rgba(255,255,255,0.45)

// Monospace font family: ui-monospace, "SF Mono", Menlo
// Sans font family: inherit from app (Arial/Helvetica currently; OK to upgrade to Inter/system-ui)
```

## Components

### 1. Focus-mode top bar
- Left: uppercase eyebrow "FOCUS MODE", then pill-style view toggle with three options: **Focus** (active = `rgba(255,255,255,0.08)` pill), **Board**, **Timeline**. Clicking Board/Timeline should navigate to those alternate views (future work — wire up as route links, greyed out is fine for v1).
- Right: search input (dark variant, 220px min width), then primary "+ New project" button in lime (`#81bb26` bg, navy text, 10px radius, green glow shadow `0 4px 14px rgba(129,187,38,0.35)`).

### 2. Hero project panel (left column)

- **Tag chip**: pill `padding: 4px 10px`, `borderRadius: 3`, background = project category color, text color = navy, uppercase 10.5px / 800, letter-spacing 1.5
- **Code line**: monospace 11px, `{code} · LIVE` (LIVE when status = in_progress, else show status). Color `rgba(255,255,255,0.55)`.
- **Title**: `h1`, 60px, weight 900, letter-spacing -2, includes the project emoji as prefix
- **Description**: max-width 520px, 17px/1.5, `rgba(255,255,255,0.75)`, 18px margin-top
- **Four stat cells** in a 4-col grid, 18px gap:
  - Progress (value colored by category color)
  - Kicks off (the due/start date)
  - Teams (numeric)
  - Venues (numeric)
  Each cell: uppercase 10px label on top, big 34px monospace number below
- **CTA row** (32px margin-top, 10px gap):
  - Primary: "Open project →" (lime bg, navy text, `12px 22px`, 10px radius, lime glow shadow). Links to `/projects/[id]`.
  - Secondary: "View tasks" (`rgba(255,255,255,0.1)` bg, white text, `1px solid rgba(255,255,255,0.15)`). Links to `/tasks?project=[id]`.
  - Icon tertiary: `⋯` menu for edit/delete/toggle complete (use existing `EditProjectDialog`)

### 3. Right column

#### 3a. Progress ring card
- Glass surface (see tokens above), 16px radius, 22px padding, flex row, 18px gap between ring and meta block
- SVG ring: 160×160, radius 68, strokeWidth 10, track `rgba(255,255,255,0.08)`, progress stroke = project color, rounded cap, rotated -90°
- Inside ring: big centered number (36px/800 monospace) + "% COMPLETE" (11px letter-spacing-2)
- Right side of card: "TEAM" eyebrow → AvatarStack → "Led by {owner}" → "updated {timestamp}"

#### 3b. Today's focus list
- Glass surface, 16px radius, 18px padding
- Eyebrow: "TODAY'S FOCUS" (11px uppercase letter-spacing 1.5)
- List of 3 open tasks (top tasks due today for this project, filtered via Supabase). Each row: 14×14 rounded-square checkbox border → task title (13px)
- Rows separated by `1px solid rgba(255,255,255,0.06)`, 7px vertical padding
- Clicking checkbox marks task complete (update `tasks` table)

### 4. Filmstrip (bottom)

- Eyebrow row: "UP NEXT · N PROJECTS" (left) / "← → to navigate" hint (right), 11/12px
- 6 equal-width cards, `flex: 1 1 0`, 10px gap, glass surface 12px radius, 14px padding
- Each filmstrip card:
  - Top row: monospace code (10px, colored) + StatusDot (8×8)
  - Middle: project emoji + name (14px/700, 2-line clamp at ~36px height)
  - Progress bar: 4px tall, `rgba(255,255,255,0.08)` track, project color fill
  - Bottom row: `{progress}%` (left) · `{due}` (right), both 11px `rgba(255,255,255,0.6)`
- Clicking a card promotes it to the focus slot (the active project above)
- Keyboard: **←** / **→** cycles focus through `[current, ...strip]`
- Animate focus change: 300ms fade the bg image, slide-in from +20px translateY for hero text (simple framer-motion or a CSS transition is enough)

### 5. Background imagery layer

The full right-side area has two stacked absolute layers behind content:
1. `url({focus.img}) center/cover`, opacity 0.28, `filter: saturate(1.2)`
2. On top: `linear-gradient(90deg, rgba(15,26,38,0.95) 0%, rgba(15,26,38,0.82) 55%, rgba(15,26,38,0.45) 100%)`

The imagery must update when focus changes. Crossfade (opacity transition, 400ms ease-out) — don't hard swap.

## Interactions & behaviour

- **Keyboard:** `ArrowRight` / `ArrowLeft` cycles focus. `Enter` opens the focused project. `N` opens the New Project dialog.
- **Click a filmstrip card** → becomes focus (reorder: current focus slides into strip).
- **Open project →** navigates to `/projects/[id]`.
- **View tasks** → navigates to `/tasks` prefiltered to the focus project.
- **Empty state:** if the user has zero active projects, show a full-width empty state in the hero area with a large "+ Create your first project" button. No filmstrip.
- **Loading state:** full-page dark shimmer — pulse on the hero title block + 4 skeleton filmstrip cards.
- **Delayed project in focus:** the tag chip should be filled `BRAND.rose` instead of the category color, and the monospace code line text flips to `· DELAYED`.
- **Completed projects are NOT shown** in the filmstrip or focus slot by default. Add a view toggle / filter that brings them back (can be phase 2).

## Status / category color mapping

Already implicit in the current `Project.status` enum + `tag` categorisation. Recommended mapping:

```ts
const TAG_COLORS: Record<string, string> = {
  Leagues:    '#81bb26', // lime
  Bookings:   '#3a8dbf', // sky
  Schools:    '#e8a53a', // amber
  Events:     '#b85ec9', // purple
  Retention:  '#d9544b', // rose
  Marketing:  '#81bb26', // lime
};
```

`Project.status` determines the chip label/color override:
- `in_progress` → use `TAG_COLORS[tag]`, label "LIVE"
- `not_started` → muted (`#6b7a8c`), label "KICK-OFF SOON"
- `delayed` → `#d9544b`, label "DELAYED"
- `completed` → navy, label "FULL-TIME"

You'll likely need to add a `tag` / `category` column to the `projects` table, or derive from name/description for now. Suggest doing a small migration (example in `supabase/migrations/`).

## Data requirements

Already available from the existing `projects` query in `ProjectList.tsx`:
- `id, name, description, status, completed, created_at, updated_at, owner_id`

Additional joins needed for the spotlight:
- **Task counts** per project: `SELECT project_id, count(*) FILTER (WHERE status='completed') as done, count(*) as total FROM tasks GROUP BY project_id`
- **Today's open tasks** for the focus project: `SELECT id, title FROM tasks WHERE project_id = $1 AND status != 'completed' ORDER BY due_date ASC NULLS LAST LIMIT 3`
- **Team** (display names of `profiles` where profile.id IN project.allowed_users)
- **KPIs** (optional, phase 2) — latest row from `kpis` table

For fields not in the schema yet (tag/category, emoji, venues count, teams count, due date), either:
1. Add columns to the `projects` table (preferred), or
2. Derive from a lookup map keyed by project name in a first pass

## State management

```ts
type SpotlightState = {
  projects: Project[];           // from supabase, already filtering allowed_users
  focusId: string;               // starts at projects[0].id, persisted to localStorage
  loading: boolean;
  error: string | null;
};
```

`focusId` must be persisted to localStorage so refresh keeps place.

## Assets

All reference imagery is already in `project-tracker/public/` — no new assets needed:
- `/public/Leagues 3.png` — Autumn Leagues hero
- `/public/Bookings 1.jpg` — Pitch Booking
- `/public/Soccer Schools 1.jpg` — Soccer Schools
- `/public/Bubble football 1.jpg` — Bubble Football
- `/public/Old School Sports Day 1.jpeg` — Sports Day
- `/public/7aside pitch.jpeg` — Womens League

Map these via a `project.image_url` column or a slug-keyed lookup table on the client.

## Files in this bundle

- `Projects Page - 6 Designs.html` — all six alternate designs on a pannable canvas (design 6 is the one being implemented)
- `design6.jsx` — the Focus Spotlight component source (reference only — inline styles, not production)
- `shared.jsx` — shared primitives (Sidebar, PROJECTS mock, AvatarStack, StatusDot) — **the Sidebar here mirrors the real `src/components/Sidebar.tsx`**; reuse the real one
- `design-canvas.jsx` — canvas wrapper used only for the mockup; not shipping
- `assets/` — copies of the real public imagery and logo used in the prototype

## Suggested component breakdown

```
src/components/projects/
  ProjectSpotlight.tsx           // top-level page content (replaces ProjectList body)
  FocusHero.tsx                  // left column hero + CTAs
  ProgressRingCard.tsx           // right column top card
  TodayFocusList.tsx             // right column bottom card
  Filmstrip.tsx                  // bottom row
  FilmstripCard.tsx
  SpotlightBackground.tsx        // layered image + gradient
  useSpotlightKeyboard.ts        // keyboard nav hook
```

## Acceptance checks

- [ ] Loads at `/` with live Supabase data
- [ ] Focus project updates when arrow-keying or clicking a filmstrip card, with a 300ms crossfade
- [ ] Focus id persists across reload via localStorage
- [ ] "+ New project" still uses the existing `NewProjectDialog`
- [ ] Delayed projects render rose accent in chip + status line
- [ ] Progress ring animates on focus change (stroke-dashoffset transition, 500ms)
- [ ] Empty state shown if no active projects
- [ ] Sidebar (`src/components/Sidebar.tsx`) is untouched; the new component renders inside the existing `MainContent` wrapper
- [ ] Matches design at 1440×900, gracefully degrades to ~1200px (stack right column below hero), mobile is out of scope for v1
