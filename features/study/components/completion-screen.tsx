"use client";

import { ArrowRight, Check } from "lucide-react";
import type { Completion, TomorrowPreview } from "@/core/types";
import { countLabel } from "../format";
import { SessionExit } from "./session-exit";
import { TomorrowPreview as TomorrowPreviewCard } from "./tomorrow-preview";

export type CompletionSaveState = "idle" | "saving" | "saved" | "failed";

type CompletionScreenProps = {
  completion: Completion;
  introducedToday: number;
  answersToday: number;
  tomorrow: TomorrowPreview;
  learnMoreCount: number;
  canLearnMore: boolean;
  saveState: CompletionSaveState;
  onRetry: () => void;
  onLearnMore: () => void;
  onBack: () => void;
};

export function CompletionScreen({
  completion,
  introducedToday,
  answersToday,
  tomorrow,
  learnMoreCount,
  canLearnMore,
  saveState,
  onRetry,
  onLearnMore,
  onBack,
}: CompletionScreenProps) {
  const isMini = completion === "mini";
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      <header className="flex items-center gap-3">
        <SessionExit />
      </header>

      <section className="mt-10 text-center">
        <div className="mx-auto flex h-20 w-20 animate-[check-in_420ms_ease-out] items-center justify-center rounded-full bg-success/10 text-success motion-reduce:animate-none">
          <Check aria-hidden="true" className="h-10 w-10" strokeWidth={2} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-ink">
          {isMini ? "Mini session done" : "All done for today"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          {isMini
            ? "You showed up and made progress. That is how the list gets smaller."
            : "You showed up and finished the new words. That is how the list gets smaller."}
        </p>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Words learned
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-ink">
            {introducedToday}
          </p>
          <p className="mt-1 text-xs text-muted">New words today</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Answers today
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-ink">
            {answersToday}
          </p>
          <p className="mt-1 text-xs text-muted">Includes retries</p>
        </div>
      </div>

      <div className="mt-3">
        <TomorrowPreviewCard preview={tomorrow} />
      </div>

      {saveState === "failed" ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-warn/40 bg-card px-4 py-2 text-sm font-medium text-warn transition-colors hover:border-warn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warn"
        >
          Couldn&apos;t save, tap to retry
        </button>
      ) : null}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Today
        </button>
        {canLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            disabled={saveState !== "saved"}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {saveState === "saving"
              ? "Saving..."
              : `Learn ${countLabel(learnMoreCount, "more word")}`}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
