"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Cell,
} from "recharts";

/**
 * Churn Dashboard – Hard‑coded data (Next.js App Router)
 * -----------------------------------------------------
 * Drop this file at:  app/churn/page.tsx
 * Deps:  npm i recharts
 * Styling assumes Tailwind CSS is available. If not, replace classNames with your CSS.
 * Brand colours: #81bb26 (accent), #09162a (ink)
 */

// ----------------------
// Brand
// ----------------------
const BRAND = {
  ink: "#0b1220",
  green: "#8CD45C",
  blue: "#6BD3FF",
  grid: "rgba(255,255,255,0.16)",
  grey: "rgba(255,255,255,0.55)",
  frostedBg: "rgba(255, 255, 255, 0.12)",
  frostedBorder: "rgba(255, 255, 255, 0.28)",
  positive: "rgba(255,255,255,0.85)",
};

// ----------------------
// Types
// ----------------------
type NormRow = {
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Sunday";
  format: "5s" | "7s" | "Works";
  month: string;
  year: number;
  season_key: string;
  season_date: string; // YYYY-MM-DD
  total_teams: number;
  teams_lost: number;
  churn_pct: number;
  segment: string; // e.g., "Monday 5S"
  season_index: number;
};

// ----------------------
// Hard‑coded datasets (derived from your CSV)
// ----------------------
// Normalised seasons (47 rows)
const NORM: NormRow[] = [
  { day_of_week: "Monday", format: "5s", month: "March", year: 2024, season_key: "Mon-5s-2024-03", season_date: "2024-03-01", total_teams: 60, teams_lost: 7, churn_pct: 11.7, segment: "Monday 5S", season_index: 1 },
  { day_of_week: "Monday", format: "5s", month: "June", year: 2024, season_key: "Mon-5s-2024-06", season_date: "2024-06-01", total_teams: 62, teams_lost: 7, churn_pct: 11.3, segment: "Monday 5S", season_index: 2 },
  { day_of_week: "Monday", format: "5s", month: "September", year: 2024, season_key: "Mon-5s-2024-09", season_date: "2024-09-01", total_teams: 64, teams_lost: 6, churn_pct: 9.4, segment: "Monday 5S", season_index: 3 },
  { day_of_week: "Monday", format: "5s", month: "January", year: 2025, season_key: "Mon-5s-2025-01", season_date: "2025-01-01", total_teams: 68, teams_lost: 9, churn_pct: 13.2, segment: "Monday 5S", season_index: 4 },
  { day_of_week: "Monday", format: "5s", month: "May", year: 2025, season_key: "Mon-5s-2025-05", season_date: "2025-05-01", total_teams: 72, teams_lost: 15, churn_pct: 20.8, segment: "Monday 5S", season_index: 5 },

  { day_of_week: "Monday", format: "7s", month: "June", year: 2023, season_key: "Mon-7s-2023-06", season_date: "2023-06-01", total_teams: 11, teams_lost: 3, churn_pct: 27.3, segment: "Monday 7S", season_index: 1 },
  { day_of_week: "Monday", format: "7s", month: "October", year: 2023, season_key: "Mon-7s-2023-10", season_date: "2023-10-01", total_teams: 10, teams_lost: 2, churn_pct: 20.0, segment: "Monday 7S", season_index: 2 },
  { day_of_week: "Monday", format: "7s", month: "March", year: 2024, season_key: "Mon-7s-2024-03", season_date: "2024-03-01", total_teams: 10, teams_lost: 2, churn_pct: 20.0, segment: "Monday 7S", season_index: 3 },
  { day_of_week: "Monday", format: "7s", month: "July", year: 2024, season_key: "Mon-7s-2024-07", season_date: "2024-07-01", total_teams: 10, teams_lost: 1, churn_pct: 10.0, segment: "Monday 7S", season_index: 4 },
  { day_of_week: "Monday", format: "7s", month: "November", year: 2024, season_key: "Mon-7s-2024-11", season_date: "2024-11-01", total_teams: 10, teams_lost: 4, churn_pct: 40.0, segment: "Monday 7S", season_index: 5 },
  { day_of_week: "Monday", format: "7s", month: "April", year: 2025, season_key: "Mon-7s-2025-04", season_date: "2025-04-01", total_teams: 10, teams_lost: 3, churn_pct: 30.0, segment: "Monday 7S", season_index: 6 },

  { day_of_week: "Tuesday", format: "5s", month: "August", year: 2023, season_key: "Tue-5s-2023-08", season_date: "2023-08-01", total_teams: 32, teams_lost: 9, churn_pct: 28.1, segment: "Tuesday 5S", season_index: 1 },
  { day_of_week: "Tuesday", format: "5s", month: "November", year: 2023, season_key: "Tue-5s-2023-11", season_date: "2023-11-01", total_teams: 37, teams_lost: 16, churn_pct: 43.2, segment: "Tuesday 5S", season_index: 2 },
  { day_of_week: "Tuesday", format: "5s", month: "February", year: 2024, season_key: "Tue-5s-2024-02", season_date: "2024-02-01", total_teams: 40, teams_lost: 18, churn_pct: 45.0, segment: "Tuesday 5S", season_index: 3 },
  { day_of_week: "Tuesday", format: "5s", month: "July", year: 2024, season_key: "Tue-5s-2024-07", season_date: "2024-07-01", total_teams: 40, teams_lost: 4, churn_pct: 10.0, segment: "Tuesday 5S", season_index: 4 },
  { day_of_week: "Tuesday", format: "5s", month: "October", year: 2024, season_key: "Tue-5s-2024-10", season_date: "2024-10-01", total_teams: 40, teams_lost: 10, churn_pct: 25.0, segment: "Tuesday 5S", season_index: 5 },
  { day_of_week: "Tuesday", format: "5s", month: "March", year: 2025, season_key: "Tue-5s-2025-03", season_date: "2025-03-01", total_teams: 40, teams_lost: 20, churn_pct: 50.0, segment: "Tuesday 5S", season_index: 6 },
  { day_of_week: "Tuesday", format: "5s", month: "June", year: 2025, season_key: "Tue-5s-2025-06", season_date: "2025-06-01", total_teams: 37, teams_lost: 5, churn_pct: 13.5, segment: "Tuesday 5S", season_index: 7 },

  { day_of_week: "Wednesday", format: "5s", month: "August", year: 2023, season_key: "Wed-5s-2023-08", season_date: "2023-08-01", total_teams: 36, teams_lost: 6, churn_pct: 16.7, segment: "Wednesday 5S", season_index: 1 },
  { day_of_week: "Wednesday", format: "5s", month: "October", year: 2023, season_key: "Wed-5s-2023-10", season_date: "2023-10-01", total_teams: 30, teams_lost: 12, churn_pct: 40.0, segment: "Wednesday 5S", season_index: 2 },
  { day_of_week: "Wednesday", format: "5s", month: "February", year: 2024, season_key: "Wed-5s-2024-02", season_date: "2024-02-01", total_teams: 34, teams_lost: 11, churn_pct: 32.4, segment: "Wednesday 5S", season_index: 3 },
  { day_of_week: "Wednesday", format: "5s", month: "May", year: 2024, season_key: "Wed-5s-2024-05", season_date: "2024-05-01", total_teams: 30, teams_lost: 16, churn_pct: 53.3, segment: "Wednesday 5S", season_index: 4 },
  { day_of_week: "Wednesday", format: "5s", month: "September", year: 2024, season_key: "Wed-5s-2024-09", season_date: "2024-09-01", total_teams: 28, teams_lost: 10, churn_pct: 35.7, segment: "Wednesday 5S", season_index: 5 },
  { day_of_week: "Wednesday", format: "5s", month: "December", year: 2024, season_key: "Wed-5s-2024-12", season_date: "2024-12-01", total_teams: 34, teams_lost: 8, churn_pct: 23.5, segment: "Wednesday 5S", season_index: 6 },
  { day_of_week: "Wednesday", format: "5s", month: "April", year: 2025, season_key: "Wed-5s-2025-04", season_date: "2025-04-01", total_teams: 30, teams_lost: 9, churn_pct: 30.0, segment: "Wednesday 5S", season_index: 7 },

  { day_of_week: "Wednesday", format: "Works", month: "January", year: 2024, season_key: "Wed-Works-2024-01", season_date: "2024-01-01", total_teams: 10, teams_lost: 4, churn_pct: 40.0, segment: "Wednesday Works", season_index: 1 },
  { day_of_week: "Wednesday", format: "Works", month: "April", year: 2024, season_key: "Wed-Works-2024-04", season_date: "2024-04-01", total_teams: 10, teams_lost: 7, churn_pct: 70.0, segment: "Wednesday Works", season_index: 2 },
  { day_of_week: "Wednesday", format: "Works", month: "July", year: 2024, season_key: "Wed-Works-2024-07", season_date: "2024-07-01", total_teams: 12, teams_lost: 6, churn_pct: 50.0, segment: "Wednesday Works", season_index: 3 },
  { day_of_week: "Wednesday", format: "Works", month: "October", year: 2024, season_key: "Wed-Works-2024-10", season_date: "2024-10-01", total_teams: 12, teams_lost: 6, churn_pct: 50.0, segment: "Wednesday Works", season_index: 4 },
  { day_of_week: "Wednesday", format: "Works", month: "February", year: 2025, season_key: "Wed-Works-2025-02", season_date: "2025-02-01", total_teams: 10, teams_lost: 1, churn_pct: 10.0, segment: "Wednesday Works", season_index: 5 },
  { day_of_week: "Wednesday", format: "Works", month: "April", year: 2025, season_key: "Wed-Works-2025-04", season_date: "2025-04-01", total_teams: 10, teams_lost: 3, churn_pct: 30.0, segment: "Wednesday Works", season_index: 6 },
  { day_of_week: "Wednesday", format: "Works", month: "July", year: 2025, season_key: "Wed-Works-2025-07", season_date: "2025-07-01", total_teams: 10, teams_lost: 5, churn_pct: 50.0, segment: "Wednesday Works", season_index: 7 },
  { day_of_week: "Wednesday", format: "Works", month: "October", year: 2025, season_key: "Wed-Works-2025-10", season_date: "2025-10-01", total_teams: 10, teams_lost: 4, churn_pct: 40.0, segment: "Wednesday Works", season_index: 8 },

  { day_of_week: "Thursday", format: "5s", month: "August", year: 2023, season_key: "Thu-5s-2023-08", season_date: "2023-08-01", total_teams: 30, teams_lost: 7, churn_pct: 23.3, segment: "Thursday 5S", season_index: 1 },
  { day_of_week: "Thursday", format: "5s", month: "November", year: 2023, season_key: "Thu-5s-2023-11", season_date: "2023-11-01", total_teams: 22, teams_lost: 8, churn_pct: 36.4, segment: "Thursday 5S", season_index: 2 },
  { day_of_week: "Thursday", format: "5s", month: "March", year: 2024, season_key: "Thu-5s-2024-03", season_date: "2024-03-01", total_teams: 19, teams_lost: 4, churn_pct: 21.1, segment: "Thursday 5S", season_index: 3 },
  { day_of_week: "Thursday", format: "5s", month: "June", year: 2024, season_key: "Thu-5s-2024-06", season_date: "2024-06-01", total_teams: 32, teams_lost: 12, churn_pct: 37.5, segment: "Thursday 5S", season_index: 4 },
  { day_of_week: "Thursday", format: "5s", month: "October", year: 2024, season_key: "Thu-5s-2024-10", season_date: "2024-10-01", total_teams: 28, teams_lost: 10, churn_pct: 35.7, segment: "Thursday 5S", season_index: 5 },
  { day_of_week: "Thursday", format: "5s", month: "January", year: 2025, season_key: "Thu-5s-2025-01", season_date: "2025-01-01", total_teams: 34, teams_lost: 9, churn_pct: 26.5, segment: "Thursday 5S", season_index: 6 },
  { day_of_week: "Thursday", format: "5s", month: "May", year: 2025, season_key: "Thu-5s-2025-05", season_date: "2025-05-01", total_teams: 32, teams_lost: 8, churn_pct: 25.0, segment: "Thursday 5S", season_index: 7 },

  { day_of_week: "Sunday", format: "5s", month: "January", year: 2024, season_key: "Sun-5s-2024-01", season_date: "2024-01-01", total_teams: 23, teams_lost: 4, churn_pct: 17.4, segment: "Sunday 5S", season_index: 1 },
  { day_of_week: "Sunday", format: "5s", month: "April", year: 2024, season_key: "Sun-5s-2024-04", season_date: "2024-04-01", total_teams: 12, teams_lost: 8, churn_pct: 66.7, segment: "Sunday 5S", season_index: 2 },
  { day_of_week: "Sunday", format: "5s", month: "July", year: 2024, season_key: "Sun-5s-2024-07", season_date: "2024-07-01", total_teams: 14, teams_lost: 2, churn_pct: 14.3, segment: "Sunday 5S", season_index: 3 },
  { day_of_week: "Sunday", format: "5s", month: "October", year: 2024, season_key: "Sun-5s-2024-10", season_date: "2024-10-01", total_teams: 13, teams_lost: 3, churn_pct: 23.1, segment: "Sunday 5S", season_index: 4 },
  { day_of_week: "Sunday", format: "5s", month: "January", year: 2025, season_key: "Sun-5s-2025-01", season_date: "2025-01-01", total_teams: 18, teams_lost: 6, churn_pct: 33.3, segment: "Sunday 5S", season_index: 5 },
  { day_of_week: "Sunday", format: "5s", month: "March", year: 2025, season_key: "Sun-5s-2025-03", season_date: "2025-03-01", total_teams: 18, teams_lost: 4, churn_pct: 22.2, segment: "Sunday 5S", season_index: 6 },
  { day_of_week: "Sunday", format: "5s", month: "June", year: 2025, season_key: "Sun-5s-2025-06", season_date: "2025-06-01", total_teams: 18, teams_lost: 2, churn_pct: 11.1, segment: "Sunday 5S", season_index: 7 },
];

// QA rows (47)
// Precomputed aggregates
const OVERALL_WEIGHTED = 21.1; // %
const FORMAT_WEIGHTED = [
  { format: "5s", weighted_churn_pct: 19.9 },
  { format: "7s", weighted_churn_pct: 24.6 },
  { format: "Works", weighted_churn_pct: 31.9 },
];
const FIVE_BY_DAY = [
  { day_of_week: "Monday", weighted_churn_pct: 13.5 },
  { day_of_week: "Sunday", weighted_churn_pct: 19.7 },
  { day_of_week: "Wednesday", weighted_churn_pct: 20.2 },
  { day_of_week: "Tuesday", weighted_churn_pct: 24.5 },
  { day_of_week: "Thursday", weighted_churn_pct: 25.9 },
];
const LATEST = [
  { segment: "Monday 5S", current_churn_pct: 20.8, delta_pp_vs_prev: 7.6, total_teams_latest: 72 },
  { segment: "Monday 7S", current_churn_pct: 30.0, delta_pp_vs_prev: -10.0, total_teams_latest: 10 },
  { segment: "Sunday 5S", current_churn_pct: 22.2, delta_pp_vs_prev: -11.1, total_teams_latest: 18 },
  { segment: "Thursday 5S", current_churn_pct: 25.0, delta_pp_vs_prev: -2.6, total_teams_latest: 32 },
  { segment: "Tuesday 5S", current_churn_pct: 13.5, delta_pp_vs_prev: -9.8, total_teams_latest: 37 },
  { segment: "Wednesday 5S", current_churn_pct: 30.0, delta_pp_vs_prev: 19.3, total_teams_latest: 30 },
  { segment: "Wednesday Works", current_churn_pct: 40.0, delta_pp_vs_prev: 20.0, total_teams_latest: 10 },
];
const SEGMENT_TRENDS = [
  { segment: "Monday 5S", trend_slope_pp_per_season: 2.01 },
  { segment: "Monday 7S", trend_slope_pp_per_season: 1.81 },
  { segment: "Sunday 5S", trend_slope_pp_per_season: 2.03 },
  { segment: "Thursday 5S", trend_slope_pp_per_season: -0.72 },
  { segment: "Tuesday 5S", trend_slope_pp_per_season: -2.73 },
  { segment: "Wednesday 5S", trend_slope_pp_per_season: 1.63 },
  { segment: "Wednesday Works", trend_slope_pp_per_season: -0.01 },
];
const MONTH_MEANS = [
  { month: "January", churn_pct: 16.6 },
  { month: "February", churn_pct: 29.8 },
  { month: "March", churn_pct: 24.2 },
  { month: "April", churn_pct: 28.0 },
  { month: "May", churn_pct: 26.4 },
  { month: "June", churn_pct: 22.1 },
  { month: "July", churn_pct: 18.6 },
  { month: "August", churn_pct: 29.7 },
  { month: "September", churn_pct: 14.4 },
  { month: "October", churn_pct: 19.7 },
  { month: "November", churn_pct: 30.1 },
  { month: "December", churn_pct: 23.2 },
];
const BENCHMARKS = { p15: 11.1, p50: 22.2 };
const FORECASTS = [
  { segment: "Monday 5S", method: "DampedTrend", forecast: 21.8, low: 15.4, high: 28.2, teams_lost_next: 16, total_latest: 72 },
  { segment: "Monday 7S", method: "MA3",        forecast: 26.7, low: 3.7,  high: 49.6, teams_lost_next: 3,  total_latest: 10 },
  { segment: "Sunday 5S", method: "MA3",        forecast: 22.2, low: 10.7, high: 33.7, teams_lost_next: 4,  total_latest: 18 },
  { segment: "Thursday 5S", method: "MA3",      forecast: 22.5, low: 8.9,  high: 36.2, teams_lost_next: 7,  total_latest: 32 },
  { segment: "Tuesday 5S", method: "MA3",       forecast: 20.6, low: 7.4,  high: 33.8, teams_lost_next: 8,  total_latest: 37 },
  { segment: "Wednesday 5S", method: "MA3",     forecast: 20.7, low: 4.1,  high: 37.3, teams_lost_next: 6,  total_latest: 30 },
  { segment: "Wednesday Works", method: "MA3",   forecast: 35.4, low: 15.3, high: 55.5, teams_lost_next: 4,  total_latest: 10 },
];

// ----------------------
// Helpers
// ----------------------
const fmtSegment = (s: string) => s.replace(" 5S", " 5s").replace(" 7S", " 7s");
const pct = (n: number) => `${n.toFixed(1)}%`;
const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);
const formatPercentValue = (value: number | string, fractionDigits = 1) =>
  `${toNumber(value).toFixed(fractionDigits)}%`;
const formatSlopeValue = (value: number | string, fractionDigits = 2) => {
  const numeric = toNumber(value);
  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(fractionDigits)} pp`;
};

// Build weighted churn over time per format
type FormatKey = NormRow["format"];
type FormatSeriesPoint = { date: string } & Record<FormatKey, number | null>;

function buildFormatSeries() {
  const formats: FormatKey[] = ["5s", "7s", "Works"];
  const totalsByDate = new Map<string, Record<FormatKey, { lost: number; total: number }>>();
  NORM.forEach((row) => {
    const dateKey = row.season_date.slice(0, 7); // yyyy-mm
    if (!totalsByDate.has(dateKey)) {
      totalsByDate.set(dateKey, {
        "5s": { lost: 0, total: 0 },
        "7s": { lost: 0, total: 0 },
        Works: { lost: 0, total: 0 },
      });
    }
    const bucket = totalsByDate.get(dateKey)!;
    bucket[row.format].lost += row.teams_lost;
    bucket[row.format].total += row.total_teams;
  });

  const sortedDates = [...totalsByDate.keys()].sort();
  return sortedDates.map<FormatSeriesPoint>((date) => {
    const bucket = totalsByDate.get(date)!;
    return formats.reduce<FormatSeriesPoint>(
      (acc, format) => {
        const info = bucket[format];
        acc[format] = info.total ? (info.lost / info.total) * 100 : null;
        return acc;
      },
      { date, "5s": null, "7s": null, Works: null }
    );
  });
}

// Latest 5s by day with delta vs previous
function latest5sByDay() {
  const byDay = new Map<string, NormRow[]>();
  NORM.filter((r) => r.format === "5s").forEach((r) => {
    if (!byDay.has(r.day_of_week)) byDay.set(r.day_of_week, []);
    byDay.get(r.day_of_week)!.push(r);
  });
  const out: { day: string; latest: number; delta?: number }[] = [];
  for (const [day, rows] of byDay) {
    const sorted = rows.sort((a, b) => a.season_index - b.season_index);
    const latest = sorted[sorted.length - 1].churn_pct;
    const prev = sorted.length > 1 ? sorted[sorted.length - 2].churn_pct : undefined;
    out.push({ day, latest, delta: prev !== undefined ? +(latest - prev).toFixed(1) : undefined });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}

// ----------------------
// Component
// ----------------------
const FORMAT_KEYS: FormatKey[] = ["5s", "7s", "Works"];
const FORMAT_COLOURS: Record<FormatKey, string> = {
  "5s": BRAND.green,
  "7s": BRAND.blue,
  Works: "rgba(255,255,255,0.35)",
};

export default function Page() {
  const formatSeries = useMemo(buildFormatSeries, []);
  const latest5s = useMemo(latest5sByDay, []);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at 0% 0%, rgba(129,187,38,0.25), transparent 55%), radial-gradient(circle at 90% 10%, rgba(56,189,248,0.2), transparent 60%), linear-gradient(135deg, #0b1220 0%, #132842 100%)",
      }}
    >
      <header className="px-6 py-8 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Churn Analysis: Oct 2023 - Oct 2025</h1>
          <p className="text-sm text-white/70">Sample data, broken down by day and league type.</p>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          {/* Executive tiles */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            title="Overall churn rate"
            helper="Current view"
            value={pct(OVERALL_WEIGHTED)}
          />
          <Tile
            title="Good target"
            helper="Aim for this or lower"
            value={pct(BENCHMARKS.p15)}
          />
          <Tile
            title="Watch zone"
            helper="Keep an eye on these"
            value={`${pct(BENCHMARKS.p15)} – ${pct(BENCHMARKS.p50)}`}
          />
          <Tile
            title="Needs attention"
            helper="Act on these"
            value={pct(BENCHMARKS.p50)}
          />
        </section>

        {/* Format trend */}
        <section className="grid gap-8 xl:grid-cols-2">
          <Card
            title="Churn over time by game type"
            subtitle="By game type"
          >
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={formatSeries} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke={BRAND.grid} />
                  <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                  <YAxis domain={[0, 80]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number | string) => formatPercentValue(value)} />
                  <Legend />
                  {FORMAT_KEYS.map((formatKey) => (
                    <Line
                      key={formatKey}
                      type="monotone"
                      dataKey={formatKey}
                      name={formatKey}
                      connectNulls
                      stroke={FORMAT_COLOURS[formatKey]}
                      dot
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="5‑a‑side by day – latest season"
            subtitle="Change since last season"
          >
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={latest5s} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke={BRAND.grid} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 80]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number | string) => formatPercentValue(value)} />
                  <Bar dataKey="latest" name="Latest churn" fill={BRAND.green}>
                    <LabelList
                      dataKey="latest"
                      position="top"
                      formatter={(value: number | string) => formatPercentValue(value)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 text-sm text-white/70 space-y-1">
              {latest5s.map((d) => (
                <li key={d.day}>
                  <span className="font-medium text-white">{d.day}</span>
                  <span className="ml-2">
                    Change vs last season{" "}
                    {d.delta !== undefined ? `${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(1)} pts` : "n/a"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Scorecards */}
        <section className="grid gap-8">
          <Card title="By game type" subtitle="Average across seasons">
            <Table
              columns={["Format", "Weighted churn"]}
              rows={FORMAT_WEIGHTED.map((r) => [r.format, pct(r.weighted_churn_pct)])}
            />
          </Card>
          <Card title="5‑a‑side by day" subtitle="Best to worst (lower is better)">
            <Table
              columns={["Day", "Weighted churn", "Rank"]}
              rows={[...FIVE_BY_DAY]
                .sort((a, b) => a.weighted_churn_pct - b.weighted_churn_pct)
                .map((r, i) => [r.day_of_week, pct(r.weighted_churn_pct), i + 1])}
            />
          </Card>
          <Card title="Latest by group" subtitle="Now vs last season">
            <Table
              columns={["Segment", "Current", "Δ vs prev", "Teams"]}
              rows={LATEST.map((r) => [fmtSegment(r.segment), pct(r.current_churn_pct), (r.delta_pp_vs_prev >= 0 ? "+" : "") + r.delta_pp_vs_prev.toFixed(1) + " pp", r.total_teams_latest])}
            />
          </Card>
        </section>

        {/* Seasonality & trend diagnostics */}
        <section className="grid gap-8 xl:grid-cols-2">
          <Card title="Average by month" subtitle="Across all groups and seasons">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={MONTH_MEANS} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke={BRAND.grid} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 80]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number | string) => formatPercentValue(value)} />
                  <ReferenceLine y={BENCHMARKS.p50} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
                  <Bar dataKey="churn_pct" name="Average churn" fill={BRAND.green}>
                    <LabelList
                      dataKey="churn_pct"
                      position="top"
                      formatter={(value: number | string) => formatPercentValue(value)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-white/70 mt-4">
              Peaks cluster around late winter and late summer. September and January continue to be the least
              volatile entry points.
            </p>
          </Card>

          <Card
            title="Trend by group (per season)"
            subtitle="Higher means getting worse"
          >
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart
                  data={SEGMENT_TRENDS}
                  margin={{ left: 16, right: 24, top: 8, bottom: 8 }}
                  layout="vertical"
                >
                  <CartesianGrid stroke={BRAND.grid} />
                  <XAxis
                    type="number"
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `${v.toFixed(1)} pp`}
                  />
                  <YAxis
                    type="category"
                    dataKey="segment"
                    tickFormatter={fmtSegment}
                    width={140}
                  />
                  <Tooltip
                    formatter={(value: number | string) => `${formatSlopeValue(value)} / season`}
                    labelFormatter={(label) => fmtSegment(String(label))}
                  />
                  <ReferenceLine x={0} stroke={BRAND.grid} />
                  <Bar dataKey="trend_slope_pp_per_season" name="pp / season">
                    {SEGMENT_TRENDS.map((entry) => (
                      <Cell
                        key={entry.segment}
                        fill={entry.trend_slope_pp_per_season >= 0 ? BRAND.positive : BRAND.green}
                      />
                    ))}
                    <LabelList
                      dataKey="trend_slope_pp_per_season"
                      position="right"
                      formatter={(value: number | string) => formatSlopeValue(value)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-white/70 mt-4">
              Positive slopes point to worsening churn season-on-season (notably Monday and Sunday cohorts).
              Negative slopes highlight improving retention (Tuesday and Thursday 5s).
            </p>
          </Card>
        </section>

        {/* Forecasts */}
        <section className="grid gap-8">
          <Card
            title="Next season forecast (80% range)"
            subtitle="If team counts stay the same"
          >
            <Table
              columns={["Segment", "Point", "80% low", "80% high", "Teams lost (if last total)"]}
              rows={FORECASTS.map((f) => [fmtSegment(f.segment), pct(f.forecast), pct(f.low), pct(f.high), f.teams_lost_next])}
            />
          </Card>

        </section>

        {/* Narrative analysis (no suggestions, just observations) */}
        <section className="grid gap-6">
          <Card title="What this means" subtitle="Plain‑English highlights">
            <ul className="list-disc pl-6 space-y-2 text-sm text-white/80">
              <li>
                Overall churn is <span className="font-semibold text-white">{pct(OVERALL_WEIGHTED)}</span>. 5‑a‑side is
                lowest; Works is highest.
              </li>
              <li>
                In 5‑a‑side, Monday looks best right now. Thursday is worst and needs the most focus.
              </li>
              <li>
                Recent moves: Wednesday Works {pct(40.0)} (up 20 pts), Wednesday 5s {pct(30.0)} (up 19 pts), Monday 5s
                {" "}
                {pct(20.8)} (up 7.6 pts). Tuesday 5s (down 9.8 pts) and Sunday 5s (down 11.1 pts) improved.
              </li>
              <li>
                Trends: Monday and Sunday are getting worse over time; Tuesday and Thursday are getting better.
              </li>
              <li>
                By month: highest leaving tends to be in Feb, Aug and Nov; lower in Sep and Jan.
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  </div>
  );
}

// ----------------------
// UI bits
// ----------------------
function Card({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl border backdrop-blur-2xl shadow-[0_20px_45px_-28px_rgba(0,0,0,0.8)] p-6"
      style={{
        background: BRAND.frostedBg,
        borderColor: BRAND.frostedBorder,
      }}
    >
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? (
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Tile({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div
      className="rounded-3xl border backdrop-blur-2xl shadow-[0_16px_40px_-30px_rgba(0,0,0,0.75)] p-6 flex flex-col gap-3"
      style={{
        background: BRAND.frostedBg,
        borderColor: BRAND.frostedBorder,
      }}
    >
      <div className="text-sm font-medium text-white/70 uppercase tracking-[0.25em]">{title}</div>
      <div className="text-4xl font-semibold text-white tracking-tight">{value}</div>
      <div className="text-xs text-white/55">{helper}</div>
    </div>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-sm text-white/80">
        <thead>
          <tr className="text-left border-b border-white/10">
            {columns.map((c) => (
              <th key={c} className="py-3 px-4 font-semibold text-white uppercase tracking-[0.2em] text-xs">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b last:border-b-0 border-white/10 hover:bg-white/5 transition-colors duration-200"
            >
              {r.map((cell, j) => (
                <td key={j} className="py-3 px-4 text-sm">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
