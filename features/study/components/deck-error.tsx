export function DeckError() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h1 className="font-serif text-2xl font-semibold text-ink">
        Couldn&apos;t load your deck
      </h1>
      <p className="mt-2 text-sm text-muted">
        Please refresh the page and try again.
      </p>
    </section>
  );
}
