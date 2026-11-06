"use client";

import { CircleCheck, CircleX } from "lucide-react";
import type { Word } from "@/core/types";

export type QuizSaveState = "idle" | "saving" | "saved" | "failed";

type QuizFeedbackProps = {
  correct: boolean;
  answer: string;
  formNote: string | null;
  word: Word;
  saveState: QuizSaveState;
  finish: boolean;
  finishLabel?: string;
  onRetry: () => void;
  onContinue: () => void;
};

export function QuizFeedback({
  correct,
  answer,
  formNote,
  word,
  saveState,
  finish,
  finishLabel,
  onRetry,
  onContinue,
}: QuizFeedbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        correct
          ? "mt-5 rounded-xl border border-success/30 bg-success/10 p-4"
          : "mt-5 rounded-xl border border-warn/30 bg-warn/10 p-4"
      }
    >
      <div
        className={
          correct
            ? "flex items-center gap-2 text-success"
            : "flex items-center gap-2 text-warn"
        }
      >
        {correct ? (
          <CircleCheck aria-hidden="true" className="h-5 w-5" />
        ) : (
          <CircleX aria-hidden="true" className="h-5 w-5" />
        )}
        <p className="font-medium">{correct ? "Correct" : "Not quite"}</p>
      </div>

      {!correct ? (
        <p className="mt-2 text-sm text-ink">
          Answer: <span className="font-semibold">{answer}</span>
        </p>
      ) : null}

      {formNote ? <p className="mt-2 text-sm text-muted">{formNote}</p> : null}

      {!correct ? (
        <>
          <p className="mt-3 text-sm text-ink">{word.definition}</p>
          {word.example ? (
            <p className="mt-1 font-serif text-sm leading-6 text-muted">
              {word.example}
            </p>
          ) : null}
        </>
      ) : null}

      {word.arabic ? (
        <p dir="rtl" lang="ar" className="mt-2 font-arabic text-lg text-ink">
          {word.arabic}
        </p>
      ) : null}

      <div className="mt-4">
        {saveState === "failed" ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-warn/40 bg-card px-4 py-2 text-sm font-medium text-warn transition-colors hover:border-warn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warn"
          >
            Couldn&apos;t save, tap to retry
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            disabled={saveState !== "saved"}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {saveState === "saved"
              ? finish
                ? (finishLabel ?? "Finish batch")
                : "Continue"
              : "Saving..."}
          </button>
        )}
      </div>
    </div>
  );
}
