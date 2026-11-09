import Link from "next/link";

export function DeckError() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h1 className="break-words font-serif text-2xl font-semibold text-ink">
        Couldn&apos;t load your deck
      </h1>
      <p className="mt-2 text-sm text-muted">
        Please refresh the page and try again.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Back to Today
      </Link>
    </section>
  );
}
