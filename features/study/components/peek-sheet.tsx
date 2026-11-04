"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { Word } from "@/core/types";
import { WordCard } from "./word-card";

type PeekSheetProps = {
  words: Word[];
  open: boolean;
  onClose: () => void;
};

export function PeekSheet({ words, open, onClose }: PeekSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Words in this batch"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-t-3xl border border-border bg-paper p-4 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Words in this batch
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close word list"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {words.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>
      </div>
    </div>
  );
}
