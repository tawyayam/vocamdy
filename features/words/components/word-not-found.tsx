import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function WordNotFound() {
  return (
    <div className="space-y-4">
      <Link
        href="/words"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        Words
      </Link>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Word not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          This word isn&apos;t in any of your decks.
        </p>
      </section>
    </div>
  );
}
