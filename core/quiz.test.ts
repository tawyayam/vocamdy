import { describe, expect, it } from "vitest";
import {
  answerQuiz,
  createQuiz,
  currentQuizItem,
  getWrongCount,
  isQuizComplete,
} from "./quiz";

describe("quiz", () => {
  it("starts with every word once, in order, on attempt 1", () => {
    const state = createQuiz(["one", "two", "three"]);

    expect(state.queue).toEqual([
      { wordId: "one", attempt: 1 },
      { wordId: "two", attempt: 1 },
      { wordId: "three", attempt: 1 },
    ]);
    expect(currentQuizItem(state)).toEqual({ wordId: "one", attempt: 1 });
    expect(isQuizComplete(state)).toBe(false);
  });

  it("removes a word after a correct answer", () => {
    const state = answerQuiz(createQuiz(["one", "two"]), true);

    expect(currentQuizItem(state)).toEqual({ wordId: "two", attempt: 1 });
    expect(state.correctWordIds).toEqual(["one"]);
    expect(getWrongCount(state, "one")).toBe(0);
  });

  it("appends a wrong word to the end with the next attempt", () => {
    const state = answerQuiz(createQuiz(["one", "two", "three"]), false);

    expect(state.queue).toEqual([
      { wordId: "two", attempt: 1 },
      { wordId: "three", attempt: 1 },
      { wordId: "one", attempt: 2 },
    ]);
    expect(getWrongCount(state, "one")).toBe(1);
  });

  it("re-asks a wrong word immediately when it is the only one left", () => {
    const state = answerQuiz(createQuiz(["one"]), false);

    expect(currentQuizItem(state)).toEqual({ wordId: "one", attempt: 2 });
    expect(state.queue).toHaveLength(1);
  });

  it("counts wrong answers separately for each word", () => {
    let state = createQuiz(["one", "two"]);

    state = answerQuiz(state, false);
    state = answerQuiz(state, false);
    state = answerQuiz(state, false);

    expect(state.queue).toEqual([
      { wordId: "two", attempt: 2 },
      { wordId: "one", attempt: 3 },
    ]);
    expect(getWrongCount(state, "one")).toBe(2);
    expect(getWrongCount(state, "two")).toBe(1);
  });

  it("ends only when every word has been answered correctly", () => {
    let state = createQuiz(["one", "two"]);

    state = answerQuiz(state, true);
    expect(isQuizComplete(state)).toBe(false);

    state = answerQuiz(state, false);
    expect(isQuizComplete(state)).toBe(false);

    state = answerQuiz(state, true);
    expect(isQuizComplete(state)).toBe(true);
    expect(currentQuizItem(state)).toBeNull();
    expect(state.correctWordIds).toEqual(["one", "two"]);
  });
});
