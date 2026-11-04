import { redirect } from "next/navigation";
import { getDeck } from "@/content/decks";
import { getRecentActivity } from "@/db/activity";
import { getProgressForDeck } from "@/db/progress";
import { createSupabaseServerClient } from "@/db/server";
import { getUserSettings } from "@/db/settings";
import { summarizeDeck } from "@/features/study/deck-summary";
import { TodayView } from "@/features/study/components/today-view";

type TodayPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const notice =
    typeof params.notice === "string" ? params.notice : null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Could not read the signed-in user.", error);
    redirect("/login");
  }

  const userId = data?.claims?.sub;

  if (typeof userId !== "string" || !userId) {
    redirect("/login");
  }

  const settings = await getUserSettings(supabase, userId);
  const deck = getDeck(settings.activeDeckId);

  if (!deck) {
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

  const [progress, activities] = await Promise.all([
    getProgressForDeck(supabase, userId, deck.id),
    getRecentActivity(supabase, userId, 14),
  ]);

  return (
    <TodayView
      summary={summarizeDeck(deck)}
      progress={progress}
      activities={activities}
      settings={settings}
      notice={notice}
    />
  );
}
