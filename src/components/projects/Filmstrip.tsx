"use client";

import type { Project } from "@/types/database.types";
import FilmstripCard from "./FilmstripCard";

type Props = {
  projects: Project[];
  progressOf: (projectId: string) => number;
  dueOf: (projectId: string) => string | null;
  onSelect: (projectId: string) => void;
};

export default function Filmstrip({ projects, progressOf, dueOf, onSelect }: Props) {
  if (projects.length === 0) return null;

  return (
    <div className="mt-auto">
      <div className="mb-[10px] flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/55">
          Up next · {projects.length} {projects.length === 1 ? "project" : "projects"}
        </div>
        <div className="text-[12px] text-white/45">← → to navigate</div>
      </div>
      <div
        className="flex gap-[10px] overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
      >
        {projects.map((p) => (
          <div key={p.id} className="w-[200px] shrink-0">
            <FilmstripCard
              project={p}
              progress={progressOf(p.id)}
              dueDate={dueOf(p.id)}
              onClick={() => onSelect(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
