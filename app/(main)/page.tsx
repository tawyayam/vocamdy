import { getRecentActivity } from "@/db/activity";
import { getProgressForDeck } from "@/db/progress";
import { summarizeDeck } from "@/features/study/deck-summary";
import { DeckError } from "@/features/study/components/deck-error";
import { TodayView } from "@/features/study/components/today-view";
import { loadActiveDeck } from "@/features/study/load-active-deck";

type TodayPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const notice =
    typeof params.notice === "string" ? params.notice : null;
  const { supabase, userId, settings, deck } = await loadActiveDeck();

  if (!deck) {
    return <DeckError />;
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
