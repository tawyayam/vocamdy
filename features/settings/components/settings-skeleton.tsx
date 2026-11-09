export function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings" className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-primary-soft motion-reduce:animate-none" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-primary-soft motion-reduce:animate-none" />
      </div>
      <div className="h-52 animate-pulse rounded-2xl border border-border bg-card motion-reduce:animate-none" />
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-card motion-reduce:animate-none" />
      <div className="h-44 animate-pulse rounded-2xl border border-border bg-card motion-reduce:animate-none" />
    </div>
  );
}
