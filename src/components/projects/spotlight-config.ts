import type { Project } from "@/types/database.types";

export const BRAND = {
  navy: "#1c3145",
  navyDeep: "#13202e",
  navySoft: "#24425e",
  lime: "#81bb26",
  limeGlow: "#a5e236",
  rose: "#d9544b",
  amber: "#e8a53a",
  sky: "#3a8dbf",
  purple: "#b85ec9",
  muted: "#6b7a8c",
} as const;

export const TAG_COLORS: Record<string, string> = {
  Leagues: BRAND.lime,
  Bookings: BRAND.sky,
  Schools: BRAND.amber,
  Events: BRAND.purple,
  Retention: BRAND.rose,
  Marketing: BRAND.lime,
};

type ProjectMeta = {
  tag: string;
  code: string;
  image: string | null;
};

const META_KEYWORDS: { keywords: string[]; meta: ProjectMeta }[] = [
  {
    keywords: ["league", "7-a-side", "7aside", "womens"],
    meta: { tag: "Leagues", code: "LGE", image: "/Leagues 3.png" },
  },
  {
    keywords: ["booking", "pitch"],
    meta: { tag: "Bookings", code: "BKG", image: "/Bookings 1.jpg" },
  },
  {
    keywords: ["school", "camp", "soccer school"],
    meta: { tag: "Schools", code: "SCH", image: "/Soccer Schools 1.jpg" },
  },
  {
    keywords: ["bubble"],
    meta: { tag: "Events", code: "EVT", image: "/Bubble football 1.jpg" },
  },
  {
    keywords: ["sports day", "old school"],
    meta: { tag: "Events", code: "EVT", image: "/Old School Sports Day 1.jpeg" },
  },
  {
    keywords: ["churn", "retention", "win-back", "winback"],
    meta: { tag: "Retention", code: "CRN", image: null },
  },
  {
    keywords: ["instagram", "reel", "social", "facebook", "marketing", "campaign"],
    meta: { tag: "Marketing", code: "MKT", image: null },
  },
  {
    keywords: ["event"],
    meta: { tag: "Events", code: "EVT", image: null },
  },
];

const DEFAULT_META: ProjectMeta = {
  tag: "Projects",
  code: "PRJ",
  image: null,
};

export function deriveProjectMeta(project: Project): ProjectMeta & { color: string } {
  const haystack = `${project.name} ${project.description ?? ""}`.toLowerCase();
  const matched =
    META_KEYWORDS.find((entry) => entry.keywords.some((kw) => haystack.includes(kw)))?.meta ??
    DEFAULT_META;

  const color = TAG_COLORS[matched.tag] ?? BRAND.muted;
  const shortId = project.id.slice(0, 4).toUpperCase();
  return {
    ...matched,
    code: `${matched.code}-${shortId}`,
    color,
  };
}

export type StatusKey = Project["status"];

export function statusLabel(status: StatusKey, isDelayed: boolean) {
  if (isDelayed) return "DELAYED";
  switch (status) {
    case "in_progress":
      return "LIVE";
    case "not_started":
      return "KICK-OFF SOON";
    case "completed":
      return "FULL-TIME";
    case "delayed":
      return "DELAYED";
    default:
      return String(status).toUpperCase();
  }
}

export function statusDotColor(status: StatusKey) {
  switch (status) {
    case "in_progress":
      return BRAND.lime;
    case "not_started":
      return BRAND.muted;
    case "completed":
      return BRAND.navy;
    case "delayed":
      return BRAND.rose;
    default:
      return BRAND.muted;
  }
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "recently";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatDueDate(iso: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
