import { summarizeDeck } from "@/features/study/deck-summary";
import { DeckError } from "@/features/study/components/deck-error";
import { TodayView } from "@/features/study/components/today-view";
import { loadStudyData } from "@/features/study/load-study-data";

type TodayPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const notice =
    typeof params.notice === "string" ? params.notice : null;
  const { settings, progress, activities, deck } = await loadStudyData();

  if (!deck) {
    return <DeckError />;
  }

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
