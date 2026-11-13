import { ProgressView } from "@/features/progress/components/progress-view";
import { summarizeDeck } from "@/features/study/deck-summary";
import { DeckError } from "@/features/study/components/deck-error";
import { loadStudyData } from "@/features/study/load-study-data";

export default async function ProgressPage() {
  const { settings, progress, activities, deck } = await loadStudyData();

  if (!deck) {
    return <DeckError />;
  }

  return (
    <ProgressView
      summary={summarizeDeck(deck)}
      progress={progress}
      activities={activities}
      settings={settings}
    />
  );
}
