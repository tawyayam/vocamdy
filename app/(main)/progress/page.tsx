import { getRecentActivity } from "@/db/activity";
import { getProgressForDeck } from "@/db/progress";
import { ProgressView } from "@/features/progress/components/progress-view";
import { summarizeDeck } from "@/features/study/deck-summary";
import { DeckError } from "@/features/study/components/deck-error";
import { loadActiveDeck } from "@/features/study/load-active-deck";

export default async function ProgressPage() {
  const { supabase, userId, settings, deck } = await loadActiveDeck();

  if (!deck) {
    return <DeckError />;
  }

  const [progress, activities] = await Promise.all([
    getProgressForDeck(supabase, userId, deck.id),
    getRecentActivity(supabase, userId, 14),
  ]);

  return (
    <ProgressView
      summary={summarizeDeck(deck)}
      progress={progress}
      activities={activities}
      settings={settings}
    />
  );
}
