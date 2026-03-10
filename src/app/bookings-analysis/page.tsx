"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line,
  Legend,
} from "recharts";

const GOL_GREEN = "#81bb26";
const GOL_NAVY = "#09162a";
const AMBER = "#e5a117";
const RED = "#c43e3e";
const GREY = "#6b7280";
const LIGHT_BG = "#f8fafc";

const oneOffMonthly = [
  { ym: "2023-10", count: 32, revenue: 2688, price: 84 },
  { ym: "2023-11", count: 24, revenue: 2086, price: 84 },
  { ym: "2023-12", count: 24, revenue: 1987, price: 84 },
  { ym: "2024-01", count: 36, revenue: 3121, price: 84 },
  { ym: "2024-02", count: 37, revenue: 3108, price: 84 },
  { ym: "2024-03", count: 34, revenue: 2856, price: 84 },
  { ym: "2024-04", count: 28, revenue: 2436, price: 84 },
  { ym: "2024-05", count: 29, revenue: 2491, price: 84 },
  { ym: "2024-06", count: 28, revenue: 2352, price: 84 },
  { ym: "2024-07", count: 30, revenue: 2515, price: 84, transition: true },
  { ym: "2024-08", count: 24, revenue: 2261, price: 91, transition: true },
  { ym: "2024-09", count: 41, revenue: 4074, price: 91 },
  { ym: "2024-10", count: 29, revenue: 2639, price: 91 },
  { ym: "2024-11", count: 30, revenue: 2821, price: 91 },
  { ym: "2024-12", count: 18, revenue: 1598, price: 91 },
  { ym: "2025-01", count: 30, revenue: 2699, price: 91 },
  { ym: "2025-02", count: 34, revenue: 3127, price: 91 },
  { ym: "2025-03", count: 22, revenue: 1960, price: 91 },
  { ym: "2025-04", count: 23, revenue: 2064, price: 91 },
  { ym: "2025-05", count: 21, revenue: 1911, price: 91 },
  { ym: "2025-06", count: 20, revenue: 1820, price: 91 },
  { ym: "2025-07", count: 11, revenue: 1001, price: 91 },
  { ym: "2025-08", count: 17, revenue: 1542, price: 91 },
  { ym: "2025-09", count: 17, revenue: 1547, price: 91 },
  { ym: "2025-10", count: 15, revenue: 1350, price: 91 },
  { ym: "2025-11", count: 24, revenue: 2304, price: 91 },
  { ym: "2025-12", count: 18, revenue: 1624, price: 91 },
  { ym: "2026-01", count: 27, revenue: 2432, price: 91 },
  { ym: "2026-02", count: 23, revenue: 2086, price: 91 },
];

const blockMonthly = [
  { ym: "2023-10", count: 10, revenue: 735, avgPrice: 74 },
  { ym: "2023-11", count: 14, revenue: 1057, avgPrice: 76 },
  { ym: "2023-12", count: 10, revenue: 770, avgPrice: 77 },
  { ym: "2024-01", count: 16, revenue: 1232, avgPrice: 77 },
  { ym: "2024-02", count: 17, revenue: 1309, avgPrice: 77 },
  { ym: "2024-03", count: 17, revenue: 1309, avgPrice: 77 },
  { ym: "2024-04", count: 14, revenue: 1071, avgPrice: 76 },
  { ym: "2024-05", count: 15, revenue: 1155, avgPrice: 77 },
  { ym: "2024-06", count: 16, revenue: 1232, avgPrice: 77 },
  { ym: "2024-07", count: 10, revenue: 770, avgPrice: 77 },
  { ym: "2024-08", count: 10, revenue: 770, avgPrice: 77 },
  { ym: "2024-09", count: 11, revenue: 875, avgPrice: 80 },
  { ym: "2024-10", count: 12, revenue: 973, avgPrice: 81 },
  { ym: "2024-11", count: 11, revenue: 924, avgPrice: 84 },
  { ym: "2024-12", count: 8, revenue: 672, avgPrice: 84 },
  { ym: "2025-01", count: 12, revenue: 1008, avgPrice: 84 },
  { ym: "2025-02", count: 10, revenue: 840, avgPrice: 84 },
  { ym: "2025-03", count: 12, revenue: 1008, avgPrice: 84 },
  { ym: "2025-04", count: 13, revenue: 1092, avgPrice: 84 },
  { ym: "2025-05", count: 17, revenue: 1428, avgPrice: 84 },
  { ym: "2025-06", count: 17, revenue: 1428, avgPrice: 84 },
  { ym: "2025-07", count: 11, revenue: 924, avgPrice: 84 },
  { ym: "2025-08", count: 13, revenue: 1092, avgPrice: 84 },
  { ym: "2025-09", count: 11, revenue: 924, avgPrice: 84 },
  { ym: "2025-10", count: 12, revenue: 1008, avgPrice: 84 },
  { ym: "2025-11", count: 13, revenue: 1092, avgPrice: 84 },
  { ym: "2025-12", count: 8, revenue: 672, avgPrice: 84 },
  { ym: "2026-01", count: 12, revenue: 1008, avgPrice: 84 },
  { ym: "2026-02", count: 12, revenue: 1008, avgPrice: 84 },
];

const yoyData = [
  { month: "Jan", m2024: 36, m2025: 30, m2026: 27 },
  { month: "Feb", m2024: 37, m2025: 34, m2026: 23 },
  { month: "Mar", m2024: 34, m2025: 22 },
  { month: "Apr", m2024: 28, m2025: 23 },
  { month: "May", m2024: 29, m2025: 21 },
  { month: "Jun", m2024: 28, m2025: 20 },
  { month: "Jul", m2024: 30, m2025: 11 },
  { month: "Aug", m2024: 24, m2025: 17 },
  { month: "Sep", m2024: 41, m2025: 17 },
  { month: "Oct", m2024: 29, m2025: 15 },
  { month: "Nov", m2024: 30, m2025: 24 },
  { month: "Dec", m2024: 18, m2025: 18 },
];

const yoyBlockData = [
  { month: "Jan", m2024: 16, m2025: 12, m2026: 12 },
  { month: "Feb", m2024: 17, m2025: 10, m2026: 12 },
  { month: "Mar", m2024: 17, m2025: 12 },
  { month: "Apr", m2024: 14, m2025: 13 },
  { month: "May", m2024: 15, m2025: 17 },
  { month: "Jun", m2024: 16, m2025: 17 },
  { month: "Jul", m2024: 10, m2025: 11 },
  { month: "Aug", m2024: 10, m2025: 13 },
  { month: "Sep", m2024: 11, m2025: 11 },
  { month: "Oct", m2024: 12, m2025: 12 },
  { month: "Nov", m2024: 11, m2025: 13 },
  { month: "Dec", m2024: 8, m2025: 8 },
];

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)]} '${y.slice(2)}`;
}

function Stat({ label, value, sub, color = GOL_NAVY }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "16px 20px", background: "white", borderRadius: 8, border: "1px solid #e2e8f0", minWidth: 160, flex: "1 1 160px" }}>
      <div style={{ fontSize: 12, color: GREY, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: sub.startsWith("-") ? RED : sub.startsWith("+") ? GOL_GREEN : GREY, fontWeight: 600, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PriceTag({ price, color }: { price: number; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, background: color + "18", color, marginLeft: 6 }}>
      £{price}/hr
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: GOL_NAVY, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || GREY, marginTop: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" && p.name.includes("£") ? `£${p.value.toLocaleString()}` : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function InsightBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, padding: "10px 14px", background: color === RED ? "#fef2f2" : color === AMBER ? "#fffbeb" : "#f0fdf4", borderRadius: 6, borderLeft: `3px solid ${color}`, fontSize: 13, color: GOL_NAVY, lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

export default function SevenASideAnalysis() {
  const [view, setView] = useState("oneoff");
  const [metric, setMetric] = useState("count");

  const chartData = useMemo(() => {
    const source = view === "oneoff" ? oneOffMonthly : blockMonthly;
    return source.map((d) => ({
      ...d,
      label: formatMonth(d.ym),
      displayValue: metric === "count" ? d.count : d.revenue,
    }));
  }, [view, metric]);

  const preAvg = view === "oneoff" ? 30.2 : 14.2;
  const postAvg = view === "oneoff" ? 23.3 : 12.0;
  const pctChange = view === "oneoff" ? -22.8 : -15.8;
  const priceFrom = view === "oneoff" ? 84 : 77;
  const priceTo = view === "oneoff" ? 91 : 84;
  const preRevAvg = view === "oneoff" ? 2569 : 1134;
  const postRevAvg = view === "oneoff" ? 2144 : 985;
  const revChange = view === "oneoff" ? -16.5 : -13.1;

  const priceChangeIndex = view === "oneoff"
    ? chartData.findIndex((d) => d.ym === "2024-08")
    : chartData.findIndex((d) => d.ym === "2024-11");

  const currentYoyData = view === "yoy-oneoff" ? yoyData : yoyBlockData;
  const isYoy = view === "yoy-oneoff" || view === "yoy-block";

  return (
    <div style={{ fontFamily: "'Segoe UI', -apple-system, sans-serif", background: LIGHT_BG, minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 6, height: 32, borderRadius: 3, background: GOL_GREEN }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: GOL_NAVY, margin: 0 }}>Off-Peak 7-a-Side Booking Analysis</h1>
          </div>
          <p style={{ fontSize: 14, color: GREY, margin: "6px 0 0 16px" }}>Oct 2023 &ndash; Feb 2026 &middot; G&ocirc;l Centres Cardiff</p>
        </div>

        {/* View Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "oneoff", label: "One-Off Bookings", sub: "£84 → £91" },
            { id: "block", label: "Block Bookings", sub: "£77 → £84" },
            { id: "yoy-oneoff", label: "YoY One-Off", sub: "2024 vs 2025 vs 2026" },
            { id: "yoy-block", label: "YoY Block", sub: "2024 vs 2025 vs 2026" },
          ].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: "10px 16px", borderRadius: 8,
              border: view === t.id ? `2px solid ${GOL_GREEN}` : "1px solid #e2e8f0",
              background: view === t.id ? GOL_GREEN + "12" : "white",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOL_NAVY }}>{t.label}</div>
              <div style={{ fontSize: 11, color: GREY, marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* ===== YoY Views ===== */}
        {isYoy && (
          <div>
            {view === "yoy-oneoff" ? (
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <Stat label="2024 Total" value="364" sub="avg 30.3/mo" />
                <Stat label="2025 Total" value="252" sub="-30.8% YoY" color={RED} />
                <Stat label="Worst Drop" value="Jul" sub="-63% (30→11)" color={RED} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <Stat label="2024 Total (std)" value="157" sub="avg 13.1/mo" />
                <Stat label="2025 Total (std)" value="149" sub="-5.1% YoY" color={AMBER} />
                <Stat label="Most Stable" value="Oct-Nov" sub="~12-13 both years" color={GOL_GREEN} />
              </div>
            )}
            <div style={{ background: "white", borderRadius: 10, padding: "20px 16px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: GOL_NAVY, margin: "0 0 16px 0" }}>
                {view === "yoy-oneoff" ? "One-Off" : "Block"} Bookings: Month-by-Month Comparison
              </h3>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={currentYoyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: GREY }} />
                  <YAxis tick={{ fontSize: 11, fill: GREY }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="m2024" name={view === "yoy-oneoff" ? "2024 (at £84)" : "2024 (at £77)"} fill={GOL_GREEN} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="m2025" name={view === "yoy-oneoff" ? "2025 (at £91)" : "2025 (at £84)"} fill={RED} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="m2026" name={view === "yoy-oneoff" ? "2026 (at £91)" : "2026 (at £84)"} fill={AMBER} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {view === "yoy-oneoff" ? (
                <InsightBox color={RED}>
                  <strong>Significant YoY decline.</strong> Every month in 2025 saw fewer one-off bookings than the same month in 2024. The summer/autumn drop was severe: Jul (-63%), Sep (-59%), Oct (-48%). Jan and Feb are continuing to trend down into 2026.
                </InsightBox>
              ) : (
                <InsightBox color={AMBER}>
                  <strong>Block bookings more resilient.</strong> The YoY decline is much milder than one-off. May and Jun 2025 actually exceeded 2024. The core base of regular block bookers has largely held, with the main losses in Q1 (Jan-Feb).
                </InsightBox>
              )}
            </div>
          </div>
        )}

        {/* ===== Trend Views ===== */}
        {!isYoy && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <Stat label={`Pre-Increase (£${priceFrom})`} value={`${preAvg}/mo`} sub={`£${preRevAvg.toLocaleString()}/mo rev`} color={GOL_GREEN} />
              <Stat label={`Post-Increase (£${priceTo})`} value={`${postAvg}/mo`} sub={`${pctChange}% volume`} color={RED} />
              <Stat label="Revenue Impact" value={`£${postRevAvg.toLocaleString()}/mo`} sub={`${revChange}% per month`} color={AMBER} />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[{ id: "count", label: "Booking Count" }, { id: "revenue", label: "Revenue (£)" }].map((m) => (
                <button key={m.id} onClick={() => setMetric(m.id)} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: metric === m.id ? GOL_NAVY : "#e2e8f0",
                  color: metric === m.id ? "white" : GREY,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{m.label}</button>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 10, padding: "20px 16px", border: "1px solid #e2e8f0", marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: GOL_NAVY, margin: "0 0 4px 0" }}>
                {view === "oneoff" ? "One-Off" : "Block"} {metric === "count" ? "Bookings per Month" : "Monthly Revenue"}
              </h3>
              <div style={{ fontSize: 11, color: GREY, marginBottom: 16 }}>
                Dashed line marks price change
                <PriceTag price={priceFrom} color={GOL_GREEN} />
                <span style={{ margin: "0 4px", color: GREY }}>→</span>
                <PriceTag price={priceTo} color={RED} />
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: GREY }} interval={2} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: GREY }} />
                  <Tooltip content={<CustomTooltip />} />
                  {priceChangeIndex >= 0 && (
                    <ReferenceLine x={chartData[priceChangeIndex]?.label} stroke={RED} strokeDasharray="6 4" strokeWidth={2}
                      label={{ value: "Price ↑", position: "top", fill: RED, fontSize: 11, fontWeight: 700 }} />
                  )}
                  <Bar dataKey="displayValue" name={metric === "count" ? "Bookings" : "£ Revenue"} radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => {
                      const isPost = view === "oneoff" ? entry.ym >= "2024-08" : entry.ym >= "2024-11";
                      return <Cell key={i} fill={isPost ? ((entry as { transition?: boolean }).transition ? AMBER : RED + "cc") : GOL_GREEN + "cc"} />;
                    })}
                  </Bar>
                  <Line dataKey="displayValue" type="monotone" stroke={GOL_NAVY} strokeWidth={2} dot={false} name="Trend" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "white", borderRadius: 10, padding: "20px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: GOL_NAVY, margin: "0 0 12px 0" }}>Key Findings</h3>
              {view === "oneoff" ? (
                <>
                  <InsightBox color={RED}><strong>Volume down 23%.</strong> Average monthly one-off bookings fell from 30.2 (at £84) to 23.3 (at £91). The £7/hr increase (8.3%) triggered a disproportionate demand response.</InsightBox>
                  <InsightBox color={AMBER}><strong>Revenue down 17%.</strong> Higher price has not compensated for lost volume. Monthly revenue fell from ~£2,569 to ~£2,144 — a net loss of around £425/month or roughly £5,100/year.</InsightBox>
                  <InsightBox color={GOL_GREEN}><strong>Seasonality still present.</strong> Sep 2024 spiked to 41 bookings (likely return-to-play after summer). But the 2025 seasonal pattern is notably weaker across the board.</InsightBox>
                </>
              ) : (
                <>
                  <InsightBox color={RED}><strong>Volume down 16%.</strong> Block bookings fell from 14.2/month (at £77) to 12.0/month (at £84). The increase from £77 to £84 (9.1%) has reduced take-up.</InsightBox>
                  <InsightBox color={AMBER}><strong>Block bookers are stickier.</strong> The volume drop is less severe than one-off bookings, suggesting regular block bookers are more price-tolerant — but the pipeline of new block bookers may have narrowed.</InsightBox>
                  <InsightBox color={GOL_GREEN}><strong>Stable base from Nov 2024.</strong> Post-increase volume has settled around 11-13/month with little further erosion, suggesting the remaining bookers have accepted the new price.</InsightBox>
                </>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: GREY, lineHeight: 1.6 }}>
          <strong>Notes:</strong> Sep 2023 excluded as partial month. Multi-hour bookings (£168 = 2×£84, £182 = 2×£91, etc.) counted as single transactions. Block booking analysis uses standard-price bookings only (£70/£77/£84); small top-up/partial payments excluded.
        </div>
      </div>
    </div>
  );
}