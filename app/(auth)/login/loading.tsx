export default function LoginLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div
        aria-busy="true"
        aria-label="Loading login"
        className="w-full max-w-sm animate-pulse text-center motion-reduce:animate-none"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-primary-soft" />
        <div className="mx-auto mt-5 h-8 w-44 rounded-lg bg-primary-soft" />
        <div className="mx-auto mt-3 h-4 w-64 max-w-full rounded bg-primary-soft" />
        <div className="mt-8 h-12 w-full rounded-xl bg-primary-soft" />
        <div className="mx-auto mt-4 h-4 w-56 max-w-full rounded bg-primary-soft" />
      </div>
    </main>
  );
}
