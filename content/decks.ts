import type { Deck } from "@/core/types";
import { decks as generatedDecks } from "./generated";

export const decks: readonly Deck[] = generatedDecks;

export function getDeck(deckId: string): Deck | undefined {
  return decks.find((deck) => deck.id === deckId);
}
