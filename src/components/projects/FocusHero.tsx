"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, CheckCircle2, Trash2, ArrowRight } from "lucide-react";
import type { Project } from "@/types/database.types";
import { BRAND, deriveProjectMeta, formatDueDate } from "./spotlight-config";
import EditProjectDialog from "@/components/EditProjectDialog";

type Props = {
  project: Project;
  progress: number;
  teamsCount: number;
  dueDate: string | null;
  onToggleComplete: () => void;
  onDelete: () => void;
  onProjectUpdated: (updated: Project) => void;
};

export default function FocusHero({
  project,
  progress,
  teamsCount,
  dueDate,
  onToggleComplete,
  onDelete,
  onProjectUpdated,
}: Props) {
  const router = useRouter();
  const meta = deriveProjectMeta(project);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const stats: { k: string; v: string; c?: string }[] = [
    { k: "Progress", v: `${Math.round(progress)}%`, c: meta.color },
    { k: "Kicks off", v: formatDueDate(dueDate) },
    { k: "Teams", v: String(teamsCount) },
  ];

  return (
    <div className="min-w-0 flex-1">
      <h1
        className="m-0 font-black text-white text-[clamp(44px,4.6vw,68px)]"
        style={{ letterSpacing: -2, lineHeight: 0.98 }}
      >
        {project.name}
      </h1>

      {project.description && (
        <p className="mt-[18px] max-w-[640px] text-[17px] leading-[1.5] text-white/75">
          {project.description}
        </p>
      )}

      <div className="mt-[28px] grid max-w-[480px] grid-cols-3 gap-[18px]">
        {stats.map((s) => (
          <div key={s.k}>
            <div className="text-[10px] font-bold uppercase tracking-[1.8px] text-white/45">
              {s.k}
            </div>
            <div
              className="mt-1 font-extrabold"
              style={{
                fontSize: 34,
                letterSpacing: -1,
                color: s.c ?? "white",
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[32px] flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => router.push(`/projects/${project.id}`)}
          className="inline-flex items-center gap-2 rounded-[10px] px-[22px] py-[12px] text-[14px] font-bold transition-transform hover:-translate-y-0.5"
          style={{
            background: BRAND.lime,
            color: BRAND.navy,
            boxShadow: "0 8px 24px rgba(129,187,38,0.35)",
          }}
        >
          Open project
          <ArrowRight className="h-4 w-4" />
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="More project actions"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-[10px] bg-transparent px-[14px] py-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#13202e]/95 p-2 text-sm text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10">
                <span className="flex-1 text-white/90">Edit project</span>
                <EditProjectDialog
                  project={project}
                  onProjectUpdated={(updated) => {
                    setMenuOpen(false);
                    onProjectUpdated(updated);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleComplete();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-emerald-200 hover:bg-white/10"
              >
                <CheckCircle2 className="h-4 w-4" />
                {project.completed ? "Mark active" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-200 hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
