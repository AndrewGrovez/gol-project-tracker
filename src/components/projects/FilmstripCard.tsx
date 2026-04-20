"use client";

import type { Project } from "@/types/database.types";
import { deriveProjectMeta, formatDueDate, statusDotColor } from "./spotlight-config";

type Props = {
  project: Project;
  progress: number;
  dueDate: string | null;
  onClick: () => void;
  active?: boolean;
};

export default function FilmstripCard({ project, progress, dueDate, onClick, active }: Props) {
  const meta = deriveProjectMeta(project);
  const displayStatus = project.completed ? "completed" : project.status;
  const dotColor = statusDotColor(displayStatus);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full min-w-0 flex-col rounded-xl border border-white/10 p-[14px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 ${
        active ? "ring-1 ring-[#a5e236]/60" : ""
      }`}
      style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(14px)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-[0.5px]"
          style={{ color: meta.color, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
        >
          {meta.code}
        </span>
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: dotColor }}
        />
      </div>
      <div className="h-[36px] overflow-hidden text-[14px] font-bold leading-[1.25] text-white">
        {project.name}
      </div>
      <div className="mt-[10px] h-[4px] w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: meta.color }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
        <span>{Math.round(progress)}%</span>
        <span>{formatDueDate(dueDate)}</span>
      </div>
    </button>
  );
}
