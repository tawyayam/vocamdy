"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SaveQueueStatus } from "@/core/save-queue";
import type { Word } from "@/core/types";

type QuizFeedbackProps = {
  correct: boolean;
  answer: string;
  formNote: string | null;
  word: Word;
  saveStatus: SaveQueueStatus;
  finish: boolean;
  finishLabel?: string;
  isDrained: boolean;
  isBlocked: boolean;
  onContinue: () => void;
};

export function QuizFeedback({
  correct,
  answer,
  formNote,
  word,
  saveStatus,
  finish,
  finishLabel,
  isDrained,
  isBlocked,
  onContinue,
}: QuizFeedbackProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const waitingToFinish = finish && !isDrained;
  const blockedFromContinuing = !finish && isBlocked;
  const actionLabel = finish
    ? isDrained
      ? (finishLabel ?? "Finish batch")
      : saveStatus === "failed"
        ? "Retry save to finish"
        : "Saving..."
    : isBlocked
      ? "Retry to continue"
      : "Continue";

  useEffect(() => {
    if (saveStatus === "saved" && isDrained) {
      actionRef.current?.focus();
    }
  }, [isDrained, saveStatus]);

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
        <p className="mt-2 break-words text-sm text-ink">
          Answer: <span className="font-semibold">{answer}</span>
        </p>
      ) : null}

      {formNote ? (
        <p className="mt-2 break-words text-sm text-muted">{formNote}</p>
      ) : null}

      {!correct ? (
        <>
          <p className="mt-3 break-words text-sm text-ink">
            {word.definition}
          </p>
          {word.example ? (
            <p className="mt-1 break-words font-serif text-sm leading-6 text-muted">
              {word.example}
            </p>
          ) : null}
        </>
      ) : null}

      {word.arabic ? (
        <p
          dir="rtl"
          lang="ar"
          className="mt-2 break-words font-arabic text-lg text-ink"
        >
          {word.arabic}
        </p>
      ) : null}

      <div className="mt-4">
        <button
          ref={actionRef}
          type="button"
          onClick={onContinue}
          disabled={waitingToFinish || blockedFromContinuing}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
