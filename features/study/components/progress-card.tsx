import type { TodayState, Settings } from "@/core/types";
import { estimateFinish } from "@/core/estimate";
import type { ProgressSummary } from "@/core/progress-summary";
import type { DeckSummary } from "../deck-summary";
import { formatLongDate } from "../format";

type ProgressCardProps = {
  summary: DeckSummary;
  progressSummary: ProgressSummary;
  state: TodayState;
  settings: Settings;
};

export function ProgressCard({
  summary,
  progressSummary,
  state,
  settings,
}: ProgressCardProps) {
  const introduced = progressSummary.counts.introduced;
  const estimate = estimateFinish({
    totalWords: summary.total,
    introduced,
    dailyNew: settings.dailyNew,
    newRemaining: state.newRemaining,
    studyDay: state.studyDay,
    paused: state.status === "paused",
  });
  const percent =
    summary.total === 0 ? 0 : Math.round((introduced / summary.total) * 100);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl font-semibold text-ink">Your progress</h2>
      <p className="mt-2 text-sm text-muted">
        {progressSummary.currentGroupLabel} — {introduced} of {summary.total} learned
      </p>
      <div
        role="progressbar"
        aria-label="Words learned"
        aria-valuemin={0}
        aria-valuemax={summary.total}
        aria-valuenow={introduced}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-primary-soft"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 space-y-1 text-sm">
        {estimate.remaining === 0 ? (
          <p className="text-ink">All words introduced.</p>
        ) : estimate.finishLearning && estimate.graduation ? (
          <>
            <p className="text-ink">
              At {settings.dailyNew} words a day you finish learning on{" "}
              {formatLongDate(estimate.finishLearning)}.
            </p>
            <p className="text-muted">
              The last word graduates around{" "}
              {formatLongDate(estimate.graduation)}.
            </p>
          </>
        ) : (
          <p className="text-warn">
            New words are paused until reviews are cleared.
          </p>
        )}
      </div>
    </section>
  );
}
