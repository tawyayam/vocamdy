import { describe, expect, it } from "vitest";
import { buildTodayState, planMiniSession, splitIntoBatches } from "./planner";
import type { Activity, Deck, Progress, Settings, Stage, Word } from "./types";

const studyDay = "2026-01-01";

const settings: Settings = {
  activeDeckId: "test",
  dailyNew: 10,
  batchSize: 5,
  backlogCap: 30,
};

function makeWord(id: string, order: number, group = "1"): Word {
  return {
    id,
    deck: "test",
    order,
    group,
    word: id.replace("test:", ""),
    definition: `Definition of ${id}.`,
    cloze: null,
  };
}

function makeDeck(words: Word[]): Deck {
  const groupIds = [...new Set(words.map((word) => word.group))];

  return {
    id: "test",
    name: "Test Deck",
    groups: groupIds.map((id) => ({
      id,
      label: id,
      count: words.filter((word) => word.group === id).length,
    })),
    words,
  };
}

function makeProgress(
  wordId: string,
  stage: Stage,
  dueDate: string | null = studyDay,
  overrides: Partial<Progress> = {},
): Progress {
  const graduated = stage === 4;

  return {
    wordId,
    deckId: "test",
    stage,
    dueDate: graduated ? null : dueDate,
    introducedOn: "2025-12-01",
    graduatedOn: graduated ? "2025-12-20" : null,
    correctCount: stage,
    wrongCount: 0,
    lastAnsweredOn: null,
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    studyDay,
    answersCount: 0,
    newWordsCount: 0,
    reviewsCount: 0,
    completed: null,
    ...overrides,
  };
}

function build(
  deck: Deck,
  progress: Progress[],
  activity: Activity | null = null,
  customSettings: Settings = settings,
) {
  return buildTodayState({
    deck,
    progress,
    activity,
    settings: customSettings,
    studyDay,
  });
}

describe("buildTodayState", () => {
  it("orders due reviews by due date, stage descending, then word order", () => {
    const words = [
      makeWord("test:w1", 1),
      makeWord("test:w2", 2),
      makeWord("test:w3", 3),
      makeWord("test:w4", 4),
      makeWord("test:w5", 5),
    ];
    const progress = [
      makeProgress("test:w1", 1, "2026-01-02"),
      makeProgress("test:w2", 1, "2026-01-01"),
      makeProgress("test:w3", 3, "2026-01-01"),
      makeProgress("test:w4", 1, "2026-01-01"),
      makeProgress("test:w5", 2, "2026-01-01"),
    ];

    const state = buildTodayState({
      deck: makeDeck(words),
      progress,
      activity: null,
      settings,
      studyDay: "2026-01-02",
    });

    expect(state.dueReviews.map((item) => item.wordId)).toEqual([
      "test:w3",
      "test:w5",
      "test:w2",
      "test:w4",
      "test:w1",
    ]);
  });

  it("does not count a review due today as overdue", () => {
    const deck = makeDeck([makeWord("test:w1", 1)]);
    const state = build(deck, [makeProgress("test:w1", 1, studyDay)]);

    expect(state.dueReviews).toHaveLength(1);
    expect(state.overdueCount).toBe(0);
    expect(state.status).toBe("start");
  });

  it("pauses when overdue reviews exceed the backlog limit", () => {
    const deck = makeDeck([
      makeWord("test:w1", 1),
      makeWord("test:w2", 2),
      makeWord("test:w3", 3),
    ]);
    const progress = [
      makeProgress("test:w1", 1, "2025-12-30"),
      makeProgress("test:w2", 1, "2025-12-31"),
    ];
    const state = build(deck, progress, null, { ...settings, backlogCap: 1 });

    expect(state.overdueCount).toBe(2);
    expect(state.newRemaining).toBe(0);
    expect(state.status).toBe("paused");
  });

  it("limits newRemaining by daily_new, introduced today and the deck", () => {
    const deck = makeDeck(
      Array.from({ length: 20 }, (_, index) => makeWord(`test:w${index + 1}`, index + 1)),
    );
    const progress = [
      makeProgress("test:w1", 1, "2026-01-02", { introducedOn: studyDay }),
      makeProgress("test:w2", 1, "2026-01-02", { introducedOn: studyDay }),
      makeProgress("test:w3", 1, "2026-01-02", { introducedOn: studyDay }),
    ];
    const state = build(deck, progress);

    expect(state.introducedToday).toBe(3);
    expect(state.newRemaining).toBe(7);
    expect(state.newWords).toHaveLength(7);

    const smallDeck = makeDeck(
      Array.from({ length: 5 }, (_, index) => makeWord(`test:w${index + 1}`, index + 1)),
    );
    const smallState = build(smallDeck, progress);

    expect(smallState.newRemaining).toBe(2);
  });

  it("builds the five Today states", () => {
    const deck = makeDeck([makeWord("test:w1", 1)]);
    const introducedToday = makeProgress("test:w1", 1, "2026-01-02", {
      introducedOn: studyDay,
    });

    expect(build(deck, []).status).toBe("start");
    expect(build(deck, [], makeActivity({ answersCount: 1 })).status).toBe("continue");
    expect(build(deck, [introducedToday]).status).toBe("complete");
    expect(
      build(deck, [makeProgress("test:w1", 1, "2025-12-31")], null, {
        ...settings,
        backlogCap: 0,
      }).status,
    ).toBe("paused");
    expect(build(deck, [makeProgress("test:w1", 4)]).status).toBe("deck-complete");
  });

  it("applies the day-complete rule", () => {
    const deck = makeDeck([makeWord("test:w1", 1)]);
    const introducedToday = makeProgress("test:w1", 1, "2026-01-02", {
      introducedOn: studyDay,
    });

    expect(build(deck, [introducedToday]).isComplete).toBe(true);
    expect(build(deck, [makeProgress("test:w1", 1, studyDay)]).isComplete).toBe(false);
    expect(build(deck, []).isComplete).toBe(false);
  });

  it("builds the tomorrow preview", () => {
    const deck = makeDeck(
      Array.from({ length: 20 }, (_, index) => makeWord(`test:w${index + 1}`, index + 1)),
    );
    const progress = [
      makeProgress("test:w1", 1, "2026-01-02", { introducedOn: studyDay }),
      makeProgress("test:w2", 1, "2026-01-02"),
      makeProgress("test:w3", 1, "2026-01-02"),
    ];
    const state = build(deck, progress);

    expect(state.newRemaining).toBe(9);
    expect(state.tomorrow).toEqual({ newWords: 8, reviews: 12 });
  });

  it("plans a mini session with reviews first, then one new batch", () => {
    const deck = makeDeck(
      Array.from({ length: 20 }, (_, index) => makeWord(`test:w${index + 1}`, index + 1)),
    );
    const fourDue = build(
      deck,
      Array.from({ length: 4 }, (_, index) => makeProgress(`test:w${index + 1}`, 1)),
    );
    const twelveDue = build(
      deck,
      Array.from({ length: 12 }, (_, index) => makeProgress(`test:w${index + 1}`, 1)),
    );
    const paused = build(
      deck,
      Array.from({ length: 3 }, (_, index) =>
        makeProgress(`test:w${index + 1}`, 1, "2025-12-31"),
      ),
      null,
      { ...settings, backlogCap: 1 },
    );

    expect(planMiniSession(fourDue, 5).reviews).toHaveLength(4);
    expect(planMiniSession(fourDue, 5).newWords).toHaveLength(5);
    expect(planMiniSession(twelveDue, 5).reviews).toHaveLength(10);
    expect(planMiniSession(twelveDue, 5).newWords).toHaveLength(0);
    expect(planMiniSession(paused, 5).reviews).toHaveLength(3);
    expect(planMiniSession(paused, 5).newWords).toHaveLength(0);
  });

  it("splits batches with a smaller last batch", () => {
    expect(splitIntoBatches([1, 2, 3, 4, 5, 6, 7], 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7],
    ]);
    expect(splitIntoBatches([], 5)).toEqual([]);
    expect(() => splitIntoBatches([1], 0)).toThrow("Batch size must be a positive integer.");
  });
});
