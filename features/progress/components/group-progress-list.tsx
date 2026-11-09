import type { GroupProgress } from "@/core/progress-summary";

type GroupProgressListProps = {
  groups: GroupProgress[];
};

export function GroupProgressList({ groups }: GroupProgressListProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl font-semibold text-ink">By group</h2>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-muted">This deck has no groups.</p>
      ) : (
        <ul className="mt-4 space-y-5">
          {groups.map((group) => {
            const percent =
              group.total === 0
                ? 0
                : Math.round((group.introduced / group.total) * 100);

            return (
              <li key={group.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 break-words font-medium text-ink">
                    {group.label}
                  </p>
                  <p className="shrink-0 text-sm text-muted">
                    {group.introduced} of {group.total}
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${group.label} words learned`}
                  aria-valuemin={0}
                  aria-valuemax={group.total}
                  aria-valuenow={group.introduced}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-primary-soft"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-muted">
                  Accuracy:{" "}
                  {group.accuracyPercent === null
                    ? "—"
                    : `${group.accuracyPercent}%`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
