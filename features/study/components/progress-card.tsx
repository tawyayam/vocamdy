import type { TodayState, Settings, Group } from "@/core/types";
import { estimateFinish } from "@/core/estimate";
import type { DeckSummary } from "../deck-summary";
import { formatLongDate } from "../format";

type ProgressCardProps = {
  summary: DeckSummary;
  introduced: number;
  state: TodayState;
  settings: Settings;
};

function currentGroupLabel(groups: Group[], introduced: number): string {
  let cumulative = 0;

  for (const group of groups) {
    cumulative += group.count;

    if (introduced < cumulative) {
      return group.label;
    }
  }

  return groups.at(-1)?.label ?? "Deck";
}

export function ProgressCard({
  summary,
  introduced,
  state,
  settings,
}: ProgressCardProps) {
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
  const groupLabel = currentGroupLabel(summary.groups, introduced);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl font-semibold text-ink">Your progress</h2>
      <p className="mt-2 text-sm text-muted">
        {groupLabel} · {introduced} of {summary.total} learned
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
