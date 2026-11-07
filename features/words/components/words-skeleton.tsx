export function WordsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading words" className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-14 animate-pulse rounded bg-primary-soft" />
        <div className="h-9 w-48 animate-pulse rounded-lg bg-primary-soft" />
      </div>
      <div className="h-11 animate-pulse rounded-xl border border-border bg-card" />
      <div className="flex gap-2">
        <div className="h-8 w-14 animate-pulse rounded-full bg-primary-soft" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-primary-soft" />
        <div className="h-8 w-28 animate-pulse rounded-full bg-primary-soft" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
