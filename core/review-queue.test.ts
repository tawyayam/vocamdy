import { describe, expect, it } from "vitest";
import {
  answerReviewQueue,
  createReviewQueue,
  currentReviewItem,
  getReviewRoundProgress,
  getReviewWrongCount,
  isReviewBlockComplete,
} from "./review-queue";
import type { Progress, Stage } from "./types";

function makeReview(wordId: string, stage: Stage = 1): Progress {
  return {
    wordId,
    deckId: "test",
    stage,
    dueDate: "2026-01-01",
    introducedOn: "2025-12-01",
    graduatedOn: null,
    correctCount: stage,
    wrongCount: 0,
    lastAnsweredOn: null,
  };
}

describe("review queue", () => {
  it("starts with every due review once, in order, on the first attempt", () => {
    const state = createReviewQueue([
      makeReview("one", 1),
      makeReview("two", 2),
      makeReview("three", 3),
    ]);

    expect(state.queue).toEqual([
      { wordId: "one", stage: 1, attempt: 1 },
      { wordId: "two", stage: 2, attempt: 1 },
      { wordId: "three", stage: 3, attempt: 1 },
    ]);
    expect(currentReviewItem(state)).toEqual({
      wordId: "one",
      stage: 1,
      attempt: 1,
    });
    expect(isReviewBlockComplete(state)).toBe(false);
  });

  it("removes a review after a correct first attempt", () => {
    const state = answerReviewQueue(
      createReviewQueue([makeReview("one"), makeReview("two")]),
      true,
    );

    expect(currentReviewItem(state)).toEqual({
      wordId: "two",
      stage: 1,
      attempt: 1,
    });
    expect(getReviewWrongCount(state, "one")).toBe(0);
  });

  it("appends exactly one retry after a wrong first attempt", () => {
    const state = answerReviewQueue(
      createReviewQueue([
        makeReview("one"),
        makeReview("two"),
        makeReview("three"),
      ]),
      false,
    );

    expect(state.queue).toEqual([
      { wordId: "two", stage: 1, attempt: 1 },
      { wordId: "three", stage: 1, attempt: 1 },
      { wordId: "one", stage: 1, attempt: 2 },
    ]);
    expect(getReviewWrongCount(state, "one")).toBe(1);
  });

  it("does not append another retry after a wrong retry", () => {
    let state = createReviewQueue([makeReview("one")]);
    state = answerReviewQueue(state, false);
    state = answerReviewQueue(state, false);

    expect(state.queue).toEqual([]);
    expect(getReviewWrongCount(state, "one")).toBe(1);
    expect(isReviewBlockComplete(state)).toBe(true);
  });

  it("does not append another retry after a correct retry", () => {
    let state = createReviewQueue([makeReview("one"), makeReview("two")]);
    state = answerReviewQueue(state, false);
    state = answerReviewQueue(state, true);
    state = answerReviewQueue(state, true);

    expect(state.queue).toEqual([]);
    expect(isReviewBlockComplete(state)).toBe(true);
  });

  it("keeps the original queue unchanged when an answer is saved", () => {
    const initial = createReviewQueue([makeReview("one"), makeReview("two")]);
    const next = answerReviewQueue(initial, false);

    expect(initial.queue).toEqual([
      { wordId: "one", stage: 1, attempt: 1 },
      { wordId: "two", stage: 1, attempt: 1 },
    ]);
    expect(next.queue).not.toBe(initial.queue);
  });

  it("ends only when the retry queue is empty", () => {
    let state = createReviewQueue([makeReview("one")]);
    state = answerReviewQueue(state, false);

    expect(isReviewBlockComplete(state)).toBe(false);

    state = answerReviewQueue(state, true);

    expect(isReviewBlockComplete(state)).toBe(true);
    expect(currentReviewItem(state)).toBeNull();
  });

  it("keeps the first-pass counter fixed when a wrong answer queues a retry", () => {
    const initial = createReviewQueue([
      makeReview("one"),
      makeReview("two"),
    ]);
    const afterWrong = answerReviewQueue(initial, false);

    expect(
      getReviewRoundProgress(afterWrong, 2, {
        wordId: "one",
        stage: 1,
        attempt: 1,
      }),
    ).toEqual({ round: "first", completed: 1, total: 2 });

    const retryRound = answerReviewQueue(afterWrong, true);

    expect(
      getReviewRoundProgress(retryRound, 2, currentReviewItem(retryRound)),
    ).toEqual({ round: "second", completed: 0, total: 1 });
  });

  it("counts retries in their own round without creating more retries", () => {
    let state = createReviewQueue([makeReview("one")]);
    state = answerReviewQueue(state, false);

    expect(
      getReviewRoundProgress(state, 1, currentReviewItem(state)),
    ).toEqual({ round: "second", completed: 0, total: 1 });

    state = answerReviewQueue(state, false);

    expect(
      getReviewRoundProgress(state, 1, {
        wordId: "one",
        stage: 1,
        attempt: 2,
      }),
    ).toEqual({ round: "second", completed: 1, total: 1 });
    expect(state.queue).toEqual([]);
  });

  it("ignores graduated progress", () => {
    const state = createReviewQueue([
      makeReview("one", 4),
      makeReview("two", 1),
    ]);

    expect(state.queue).toEqual([
      { wordId: "two", stage: 1, attempt: 1 },
    ]);
  });
});
