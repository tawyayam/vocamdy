import { ProgressView } from "@/features/progress/components/progress-view";
import { summarizeDeck } from "@/features/study/deck-summary";
import { DeckError } from "@/features/study/components/deck-error";
import { loadActiveDeck } from "@/features/study/load-active-deck";
import { loadProgressActivity } from "@/features/study/load-progress-activity";

export default async function ProgressPage() {
  const { supabase, userId, settings, deck } = await loadActiveDeck();

  if (!deck) {
    return <DeckError />;
  }

  const { progress, activities } = await loadProgressActivity(
    { supabase, userId },
    deck.id,
  );

  return (
    <ProgressView
      summary={summarizeDeck(deck)}
      progress={progress}
      activities={activities}
      settings={settings}
    />
  );
}
