export function ProgressSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading progress" className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-primary-soft" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
