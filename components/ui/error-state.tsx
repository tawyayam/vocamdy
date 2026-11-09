"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

type ErrorStateProps = {
  onRetry: () => void;
};

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warn/10 text-warn"
      >
        <RotateCcw className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Please try again. If the problem continues, return to Today.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 py-2 font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Today
        </Link>
      </div>
    </section>
  );
}
