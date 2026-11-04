export function SessionSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your session"
      className="mx-auto w-full max-w-[640px] px-4 py-6"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-border motion-reduce:animate-none" />
      <div className="mt-3 h-9 w-56 animate-pulse rounded bg-border motion-reduce:animate-none" />
      <div className="mt-6 h-48 animate-pulse rounded-2xl bg-border/70 motion-reduce:animate-none" />
    </div>
  );
}
