export function TodaySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading today"
      className="animate-pulse space-y-4 motion-reduce:animate-none"
    >
      <div className="h-4 w-36 rounded bg-border/70" />
      <div className="h-10 w-64 rounded bg-border/70" />
      <div className="h-5 w-48 rounded bg-border/70" />
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="h-4 w-28 rounded bg-border/70" />
        <div className="mt-3 h-5 w-56 rounded bg-border/70" />
        <div className="mt-6 h-12 w-full rounded-xl bg-border/70" />
        <div className="mt-3 h-10 w-full rounded-xl bg-border/70" />
      </div>
      <div className="h-28 rounded-2xl border border-border bg-card" />
      <div className="h-40 rounded-2xl border border-border bg-card" />
      <div className="h-20 rounded-2xl border border-border bg-card" />
    </div>
  );
}
