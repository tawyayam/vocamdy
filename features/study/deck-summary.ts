import type { Deck, Group, Word } from "@/core/types";

export type DeckSummaryWord = {
  id: string;
  order: number;
  group: string;
};

export type DeckSummary = {
  id: string;
  name: string;
  groups: Group[];
  words: DeckSummaryWord[];
  total: number;
};

export function summarizeDeck(deck: Deck): DeckSummary {
  return {
    id: deck.id,
    name: deck.name,
    groups: deck.groups,
    words: deck.words.map((word) => ({
      id: word.id,
      order: word.order,
      group: word.group,
    })),
    total: deck.words.length,
  };
}

export function toPlannerDeck(summary: DeckSummary): Deck {
  // The planner only reads id and order, so Today avoids shipping word text.
  const words: Word[] = summary.words.map((word) => ({
    ...word,
    deck: summary.id,
    word: "",
    definition: "",
    cloze: null,
  }));

  return {
    id: summary.id,
    name: summary.name,
    groups: summary.groups,
    words,
  };
}
