export default function WordLoading() {
  return (
    <div aria-busy="true" aria-label="Loading word" className="space-y-4">
      <div className="h-5 w-20 animate-pulse rounded bg-primary-soft" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
