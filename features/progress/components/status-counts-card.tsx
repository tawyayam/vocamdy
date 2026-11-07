import type { StatusCounts } from "@/core/progress-summary";

type StatusCountsCardProps = {
  counts: StatusCounts;
};

const ITEMS = [
  { key: "new", label: "New" },
  { key: "learning", label: "Learning" },
  { key: "graduated", label: "Graduated" },
] as const;

export function StatusCountsCard({ counts }: StatusCountsCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl font-semibold text-ink">Status</h2>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {ITEMS.map((item) => (
          <div key={item.key}>
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              {item.label}
            </dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-ink">
              {counts[item.key]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
