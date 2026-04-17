"use client";

import { Check } from "lucide-react";

export type FocusTask = {
  id: string;
  title: string;
  status: string;
};

type Props = {
  tasks: FocusTask[];
  loading: boolean;
  onToggle: (taskId: string) => void;
};

export default function TodayFocusList({ tasks, loading, onToggle }: Props) {
  return (
    <div
      className="rounded-2xl border border-white/10 p-[18px] backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <div className="mb-[10px] text-[10.5px] font-bold uppercase tracking-[1.5px] text-white/50">
        Today&apos;s focus
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-2 text-[13px] text-white/55">No open tasks — nice.</div>
      ) : (
        tasks.map((t, i) => {
          const done = t.status === "completed";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              className={`flex w-full items-center gap-[10px] py-[7px] text-left transition-colors hover:text-white ${
                i < tasks.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <span
                className={`flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
                  done ? "border-[#81bb26] bg-[#81bb26]/80" : "border-white/30"
                }`}
              >
                {done && <Check className="h-2.5 w-2.5 text-[#13202e]" strokeWidth={4} />}
              </span>
              <span
                className={`text-[13px] ${done ? "text-white/40 line-through" : "text-white/85"}`}
              >
                {t.title}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
