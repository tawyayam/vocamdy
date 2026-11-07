import { buildLearnedWords } from "@/core/words";
import { getProgressForDeck } from "@/db/progress";
import { DeckError } from "@/features/study/components/deck-error";
import { loadActiveDeck } from "@/features/study/load-active-deck";
import { WordsView } from "@/features/words/components/words-view";

export default async function WordsPage() {
  const { supabase, userId, deck } = await loadActiveDeck();

  if (!deck) {
    return <DeckError />;
  }

  const progress = await getProgressForDeck(supabase, userId, deck.id);
  const words = buildLearnedWords(deck, progress);

  return <WordsView words={words} />;
}
