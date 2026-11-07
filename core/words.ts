import type { Deck, Progress, Word } from "./types";

export type LearnedWordStatus = "learning" | "graduated";

export type WordFilter = "all" | LearnedWordStatus;

export type WordStatus = "new" | LearnedWordStatus;

export type LearnedWord = {
  id: string;
  word: string;
  definition: string;
  pos?: string;
  group: string;
  groupLabel: string;
  status: LearnedWordStatus;
};

export function getWordStatus(progress: Progress | null): WordStatus {
  if (!progress) {
    return "new";
  }

  return progress.stage === 4 ? "graduated" : "learning";
}

export function decodeWordId(wordId: string): string {
  try {
    return decodeURIComponent(wordId);
  } catch {
    return wordId;
  }
}

export function findWordById(
  decks: readonly Deck[],
  wordId: string,
): Word | undefined {
  const decodedId = decodeWordId(wordId);

  for (const deck of decks) {
    const word = deck.words.find((item) => item.id === decodedId);

    if (word) {
      return word;
    }
  }

  return undefined;
}

export function buildLearnedWords(
  deck: Deck,
  progress: readonly Progress[],
): LearnedWord[] {
  const progressByWordId = new Map(
    progress.map((item) => [item.wordId, item]),
  );
  const groupLabels = new Map(
    deck.groups.map((group) => [group.id, group.label]),
  );

  return deck.words.flatMap((word) => {
    const item = progressByWordId.get(word.id);

    if (!item) {
      return [];
    }

    return [
      {
        id: word.id,
        word: word.word,
        definition: word.definition,
        ...(word.pos ? { pos: word.pos } : {}),
        group: word.group,
        groupLabel: groupLabels.get(word.group) ?? word.group,
        status: item.stage === 4 ? "graduated" : "learning",
      },
    ];
  });
}

export function filterLearnedWords(
  words: readonly LearnedWord[],
  query: string,
  filter: WordFilter,
): LearnedWord[] {
  const needle = query.trim().toLocaleLowerCase();

  return words.filter((word) => {
    if (filter !== "all" && word.status !== filter) {
      return false;
    }

    if (!needle) {
      return true;
    }

    return (
      word.word.toLocaleLowerCase().includes(needle) ||
      word.definition.toLocaleLowerCase().includes(needle)
    );
  });
}
