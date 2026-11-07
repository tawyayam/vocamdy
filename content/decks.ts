import { findWordById as findWordInDecks } from "@/core/words";
import type { Deck, Word } from "@/core/types";
import { decks as generatedDecks } from "./generated";

export const decks: readonly Deck[] = generatedDecks;

export function getDeck(deckId: string): Deck | undefined {
  return decks.find((deck) => deck.id === deckId);
}

export function findWordById(wordId: string): Word | undefined {
  return findWordInDecks(decks, wordId);
}
