"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, CheckCircle2, Trash2 } from "lucide-react";
import type { Project } from "@/types/database.types";
import EditProjectDialog from "@/components/EditProjectDialog";

type Props = {
  project: Project;
  onToggleComplete: (project: Project) => void;
  onDelete: (project: Project) => void;
  onProjectUpdated: (updated: Project) => void;
};

const MENU_WIDTH = 224; // matches w-56

export default function ProjectCardMenu({
  project,
  onToggleComplete,
  onDelete,
  onProjectUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Anchor the portalled menu under the trigger, clamped to the viewport.
  const reposition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPosition({ top: rect.bottom + 8, left });
  }, []);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    // Board scrolls, so keep the menu pinned to its trigger.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  const stopCardClick = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${project.name}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={stopCardClick}
        className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {mounted &&
        open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            // Portals still bubble React events to the card, so stop them here.
            onClick={stopCardClick}
            onKeyDown={stopCardClick}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[100] overflow-hidden rounded-xl border border-white/10 bg-[#13202e]/95 p-2 text-sm text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10">
              <span className="flex-1 text-white/90">Edit project</span>
              <EditProjectDialog
                project={project}
                onProjectUpdated={(updated) => {
                  setOpen(false);
                  onProjectUpdated(updated);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onToggleComplete(project);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-emerald-200 hover:bg-white/10"
            >
              <CheckCircle2 className="h-4 w-4" />
              {project.completed ? "Mark active" : "Mark complete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete(project);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-200 hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete project
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
