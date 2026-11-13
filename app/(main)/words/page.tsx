import { buildLearnedWords } from "@/core/words";
import { DeckError } from "@/features/study/components/deck-error";
import { loadStudyData } from "@/features/study/load-study-data";
import { WordsView } from "@/features/words/components/words-view";

export default async function WordsPage() {
  const { progress, deck } = await loadStudyData();

  if (!deck) {
    return <DeckError />;
  }

  const words = buildLearnedWords(deck, progress);

  return <WordsView words={words} />;
}
