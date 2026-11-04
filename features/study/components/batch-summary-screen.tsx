"use client";

import { ArrowRight, CircleCheck, CircleX } from "lucide-react";
import type { Word } from "@/core/types";
import { countLabel } from "../format";
import { SessionExit } from "./session-exit";

type BatchSummaryScreenProps = {
  words: Word[];
  wrongCounts: Record<string, number>;
  onStop: () => void;
  onContinue: () => void;
};

export function BatchSummaryScreen({
  words,
  wrongCounts,
  onStop,
  onContinue,
}: BatchSummaryScreenProps) {
  const missedCount = words.filter((word) => (wrongCounts[word.id] ?? 0) > 0)
    .length;

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      <header className="flex items-start gap-3">
        <SessionExit />
        <div>
          <p className="text-sm text-muted">Batch summary</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
            {missedCount === 0 ? "Clean sweep." : "A quick look back."}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {missedCount === 0
              ? "You answered every word correctly."
              : `${countLabel(missedCount, "word")} need another look.`}
          </p>
        </div>
      </header>

      <ul className="mt-5 space-y-3">
        {words.map((word) => {
          const wrongCount = wrongCounts[word.id] ?? 0;
          const missed = wrongCount > 0;

          return (
            <li
              key={word.id}
              className={
                missed
                  ? "rounded-2xl border border-warn/40 bg-warn/5 p-4"
                  : "rounded-2xl border border-border bg-card p-4"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-xl font-semibold text-ink">
                    {word.word}
                  </p>
                  <p className="mt-1 text-sm text-muted">{word.definition}</p>
                  {word.arabic ? (
                    <p
                      dir="rtl"
                      lang="ar"
                      className="mt-2 font-arabic text-lg text-muted"
                    >
                      {word.arabic}
                    </p>
                  ) : null}
                </div>
                {missed ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warn/10 px-2 py-1 text-xs font-medium text-warn">
                    <CircleX aria-hidden="true" className="h-4 w-4" />
                    {countLabel(wrongCount, "miss", "misses")}
                  </span>
                ) : (
                  <CircleCheck
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-success"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onContinue}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onStop}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Stop for today
        </button>
      </div>
    </div>
  );
}
