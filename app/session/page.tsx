import Link from "next/link";
import { redirect } from "next/navigation";
import { SessionView } from "@/features/study/components/session-view";
import { loadSessionData } from "@/features/study/session-data";

type SessionPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function SessionPage({ searchParams }: SessionPageProps) {
  const mode = (await searchParams).mode === "mini" ? "mini" : "full";
  const result = await loadSessionData();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "deck-missing") {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-[560px] flex-1 items-center px-4 py-12">
        <section className="w-full rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-ink">
            Couldn&apos;t load your deck
          </h1>
          <p className="mt-3 text-sm text-muted">
            Please refresh the page and try again.
          </p>
          <Link
            href="/"
            className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to Today
          </Link>
        </section>
      </main>
    );
  }

  return <SessionView data={result.data} mode={mode} />;
}
