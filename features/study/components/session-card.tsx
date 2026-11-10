import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { TodayState } from "@/core/types";
import { countLabel } from "../format";

type SessionCardProps = {
  state: TodayState;
  deckName: string;
  hasAnswers: boolean;
  repeatsGreeting: boolean;
  miniCount: number;
};

function getSessionTitle(hasAnswers: boolean, repeatsGreeting: boolean) {
  if (!hasAnswers) {
    return "Ready when you are.";
  }

  return repeatsGreeting ? "Today's session" : "Pick up where you stopped.";
}

const primaryButtonClassName =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const secondaryLinkClassName =
  "flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function MiniSessionLink({ miniCount }: { miniCount: number }) {
  if (miniCount === 0) {
    return null;
  }

  return (
    <Link href="/session?mode=mini" className={secondaryLinkClassName}>
      Short on time? {miniCount} cards only
    </Link>
  );
}

export function SessionCard({
  state,
  deckName,
  hasAnswers,
  repeatsGreeting,
  miniCount,
}: SessionCardProps) {
  if (state.status === "complete") {
    return (
      <section className="rounded-2xl border border-success/30 bg-card p-5">
        <div className="flex items-center gap-2 text-success">
          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          <h2 className="font-serif text-xl font-semibold">All done for today</h2>
        </div>
        <p className="mt-3 text-sm text-muted">
          Nice work, {countLabel(state.introducedToday, "new word")} today.
        </p>
      </section>
    );
  }

  if (state.status === "deck-complete") {
    return (
      <section className="rounded-2xl border border-success/30 bg-card p-5">
        <div className="flex items-center gap-2 text-success">
          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          <h2 className="font-serif text-xl font-semibold">Deck complete</h2>
        </div>
        <p className="mt-3 break-words text-sm text-muted">
          You have learned every word in {deckName}.
        </p>
      </section>
    );
  }

  if (state.status === "paused") {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-warn">
          Today
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
          Let&apos;s clear the reviews first.
        </h2>
        <p className="mt-2 text-sm text-muted">
          {countLabel(state.dueReviews.length, "review")}{" "}
          {state.dueReviews.length === 1 ? "is" : "are"} due. New words are
          paused until you catch up.
        </p>
        <div className="mt-5 space-y-3">
          <Link href="/session" className={primaryButtonClassName}>
            {hasAnswers ? "Continue" : "Start"} reviews
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <MiniSessionLink miniCount={miniCount} />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted">
        Today · {countLabel(state.newRemaining, "new word")} ·{" "}
        {countLabel(state.dueReviews.length, "review")}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
        {getSessionTitle(hasAnswers, repeatsGreeting)}
      </h2>
      <div className="mt-5 space-y-3">
        <Link href="/session" className={primaryButtonClassName}>
          {hasAnswers ? "Continue" : "Start"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <MiniSessionLink miniCount={miniCount} />
      </div>
    </section>
  );
}
