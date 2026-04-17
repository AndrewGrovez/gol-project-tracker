import { useEffect } from "react";

type Options = {
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
  onNew: () => void;
  enabled?: boolean;
};

export function useSpotlightKeyboard({ onPrev, onNext, onOpen, onNew, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (target?.isContentEditable ?? false);
      if (isTyping) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      } else if (event.key === "Enter") {
        event.preventDefault();
        onOpen();
      } else if (event.key === "n" || event.key === "N") {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        event.preventDefault();
        onNew();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext, onOpen, onNew, enabled]);
}
