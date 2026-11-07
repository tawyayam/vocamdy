import { describe, expect, it } from "vitest";
import {
  buildLearnedWords,
  filterLearnedWords,
  findWordById,
  getWordStatus,
  type LearnedWord,
} from "./words";
import type { Deck, Progress } from "./types";

const deck: Deck = {
  id: "test",
  name: "Test Deck",
  groups: [
    { id: "1", label: "Sublist 1", count: 2 },
    { id: "2", label: "Sublist 2", count: 1 },
  ],
  words: [
    {
      id: "test:assume",
      deck: "test",
      order: 1,
      group: "1",
      word: "assume",
      pos: "verb",
      definition: "To suppose something is true.",
      cloze: null,
    },
    {
      id: "test:derive",
      deck: "test",
      order: 2,
      group: "1",
      word: "derive",
      definition: "To obtain something from a source.",
      cloze: null,
    },
    {
      id: "test:source",
      deck: "test",
      order: 3,
      group: "2",
      word: "source",
      definition: "Where something comes from.",
      cloze: null,
    },
  ],
};

function progress(wordId: string, stage: Progress["stage"]): Progress {
  return {
    wordId,
    deckId: "test",
    stage,
    dueDate: stage === 4 ? null : "2026-01-02",
    introducedOn: "2026-01-01",
    graduatedOn: stage === 4 ? "2026-01-10" : null,
    correctCount: 0,
    wrongCount: 0,
    lastAnsweredOn: null,
  };
}

const words: LearnedWord[] = buildLearnedWords(deck, [
  progress("test:assume", 1),
  progress("test:derive", 4),
]);

describe("getWordStatus", () => {
  it("returns new, learning or graduated", () => {
    expect(getWordStatus(null)).toBe("new");
    expect(getWordStatus(progress("test:assume", 3))).toBe("learning");
    expect(getWordStatus(progress("test:assume", 4))).toBe("graduated");
  });
});

describe("findWordById", () => {
  it("resolves decoded and encoded ids to the same word", () => {
    const decoded = findWordById([deck], "test:assume");
    const encoded = findWordById([deck], "test%3Aassume");

    expect(decoded?.id).toBe("test:assume");
    expect(encoded).toEqual(decoded);
  });
});

describe("buildLearnedWords", () => {
  it("keeps only words with a progress row, including early stages", () => {
    expect(words.map((word) => word.id)).toEqual([
      "test:assume",
      "test:derive",
    ]);
    expect(words[0]).toEqual({
      id: "test:assume",
      word: "assume",
      definition: "To suppose something is true.",
      pos: "verb",
      group: "1",
      groupLabel: "Sublist 1",
      status: "learning",
    });
    expect(words[1].status).toBe("graduated");
  });
});

describe("filterLearnedWords", () => {
  it("filters by learning status", () => {
    expect(
      filterLearnedWords(words, "", "learning").map((word) => word.id),
    ).toEqual(["test:assume"]);
  });

  it("filters by graduated status", () => {
    expect(
      filterLearnedWords(words, "", "graduated").map((word) => word.id),
    ).toEqual(["test:derive"]);
  });

  it("searches headwords and definitions without case sensitivity", () => {
    expect(
      filterLearnedWords(words, "ASSUME", "all").map((word) => word.id),
    ).toEqual(["test:assume"]);
    expect(
      filterLearnedWords(words, "source", "all").map((word) => word.id),
    ).toEqual(["test:derive"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterLearnedWords(words, "missing", "all")).toEqual([]);
  });
});
