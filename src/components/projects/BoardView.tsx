"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Project } from "@/types/database.types";
import FilmstripCard from "./FilmstripCard";

type Props = {
  projects: Project[];
  progressOf: (projectId: string) => number;
  dueOf: (projectId: string) => string | null;
  onSelect: (projectId: string) => void;
};

export default function BoardView({ projects, progressOf, dueOf, onSelect }: Props) {
  const active = projects.filter((p) => !p.completed);
  const completed = projects.filter((p) => p.completed);
  const [completedOpen, setCompletedOpen] = useState(false);

  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        No projects match your search.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto pb-4">
      <div>
        <div className="mb-[14px] text-[11px] font-bold uppercase tracking-[1.5px] text-white/55">
          Active · {active.length} {active.length === 1 ? "project" : "projects"}
        </div>
        {active.length === 0 ? (
          <div className="text-sm text-white/45">Nothing here.</div>
        ) : (
          <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.map((p) => (
              <FilmstripCard
                key={p.id}
                project={p}
                progress={progressOf(p.id)}
                dueDate={dueOf(p.id)}
                onClick={() => onSelect(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setCompletedOpen((v) => !v)}
            aria-expanded={completedOpen}
            className="mb-[14px] flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white/55 transition-colors hover:text-white"
          >
            {completedOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Completed · {completed.length}
          </button>
          {completedOpen && (
            <div className="grid gap-[12px] opacity-70 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {completed.map((p) => (
                <FilmstripCard
                  key={p.id}
                  project={p}
                  progress={progressOf(p.id)}
                  dueDate={dueOf(p.id)}
                  onClick={() => onSelect(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
