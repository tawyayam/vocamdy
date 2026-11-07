import { describe, expect, it } from "vitest";
import { summarizeProgress, type ProgressDeck } from "./progress-summary";
import type { Progress } from "./types";

const deck: ProgressDeck = {
  groups: [
    { id: "1", label: "Sublist 1", count: 2 },
    { id: "2", label: "Sublist 2", count: 2 },
  ],
  words: [
    { id: "test:one", group: "1" },
    { id: "test:two", group: "1" },
    { id: "test:three", group: "2" },
    { id: "test:four", group: "2" },
  ],
};

function progress(wordId: string, overrides: Partial<Progress> = {}): Progress {
  return {
    wordId,
    deckId: "test",
    stage: 1,
    dueDate: "2026-01-02",
    introducedOn: "2026-01-01",
    graduatedOn: null,
    correctCount: 0,
    wrongCount: 0,
    lastAnsweredOn: null,
    ...overrides,
  };
}

describe("summarizeProgress", () => {
  it("counts every deck word as new when there is no progress", () => {
    const summary = summarizeProgress(deck, []);

    expect(summary.counts).toEqual({
      new: 4,
      learning: 0,
      graduated: 0,
      introduced: 0,
      total: 4,
    });
    expect(summary.groups.map((group) => group.accuracyPercent)).toEqual([
      null,
      null,
    ]);
    expect(summary.currentGroupLabel).toBe("Sublist 1");
  });

  it("splits introduced words into learning and graduated", () => {
    const summary = summarizeProgress(deck, [
      progress("test:one", { stage: 1, correctCount: 3, wrongCount: 1 }),
      progress("test:two", {
        stage: 4,
        dueDate: null,
        graduatedOn: "2026-01-10",
        correctCount: 2,
      }),
      progress("test:three", { stage: 2, correctCount: 1 }),
    ]);

    expect(summary.counts).toEqual({
      new: 1,
      learning: 2,
      graduated: 1,
      introduced: 3,
      total: 4,
    });
    expect(summary.currentGroupLabel).toBe("Sublist 2");
  });

  it("builds per-group bars and accuracy from the words in each group", () => {
    const summary = summarizeProgress(deck, [
      progress("test:one", { stage: 1, correctCount: 3, wrongCount: 1 }),
      progress("test:two", { stage: 4, correctCount: 2 }),
      progress("test:three", { stage: 2, correctCount: 1 }),
    ]);

    expect(summary.groups).toEqual([
      {
        id: "1",
        label: "Sublist 1",
        introduced: 2,
        total: 2,
        correct: 5,
        wrong: 1,
        accuracyPercent: 83,
      },
      {
        id: "2",
        label: "Sublist 2",
        introduced: 1,
        total: 2,
        correct: 1,
        wrong: 0,
        accuracyPercent: 100,
      },
    ]);
  });

  it("ignores progress rows for words outside the deck", () => {
    const summary = summarizeProgress(deck, [
      progress("test:one"),
      progress("test:missing"),
    ]);

    expect(summary.counts.introduced).toBe(1);
    expect(summary.counts.new).toBe(3);
  });
});
