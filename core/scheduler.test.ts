import { describe, expect, it } from "vitest";
import {
  answerReview,
  answerTouchOne,
  introduceWord,
  isReviewDue,
  isStaleAnswer,
} from "./scheduler";
import type { Progress, Stage } from "./types";

function progress(stage: Stage, overrides: Partial<Progress> = {}): Progress {
  const graduated = stage === 4;

  return {
    wordId: "test:assume",
    deckId: "test",
    stage,
    dueDate: graduated ? null : "2026-01-01",
    introducedOn: "2025-12-20",
    graduatedOn: graduated ? "2026-01-01" : null,
    correctCount: stage,
    wrongCount: 0,
    lastAnsweredOn: null,
    ...overrides,
  };
}

function expectInvariant(item: Progress) {
  if (item.stage === 4) {
    expect(item.dueDate).toBeNull();
    expect(item.graduatedOn).not.toBeNull();
  } else {
    expect(item.dueDate).not.toBeNull();
    expect(item.graduatedOn).toBeNull();
  }
}

describe("introduceWord", () => {
  it("creates a stage 1 row after touch 1 passes", () => {
    const result = introduceWord({
      wordId: "test:assume",
      deckId: "test",
      studyDay: "2026-01-01",
      wrongCount: 2,
    });

    expect(result).toEqual({
      wordId: "test:assume",
      deckId: "test",
      stage: 1,
      dueDate: "2026-01-02",
      introducedOn: "2026-01-01",
      graduatedOn: null,
      correctCount: 1,
      wrongCount: 2,
      lastAnsweredOn: "2026-01-01",
    });
    expectInvariant(result);
  });
});

describe("answerTouchOne", () => {
  it("does not create a row while the word is being re-asked", () => {
    expect(
      answerTouchOne({
        wordId: "test:assume",
        deckId: "test",
        studyDay: "2026-01-01",
        correct: false,
        wrongCount: 1,
      }),
    ).toBeNull();
  });

  it("creates the row with the quiz's wrong count once answered correctly", () => {
    const result = answerTouchOne({
      wordId: "test:assume",
      deckId: "test",
      studyDay: "2026-01-01",
      correct: true,
      wrongCount: 3,
    });

    expect(result?.stage).toBe(1);
    expect(result?.wrongCount).toBe(3);
  });
});

describe("isStaleAnswer", () => {
  it("rejects a review whose expected stage differs from the stored stage", () => {
    expect(
      isStaleAnswer({
        kind: "review",
        expectedStage: 2,
        progress: progress(1),
      }),
    ).toBe(true);
    expect(
      isStaleAnswer({
        kind: "review",
        expectedStage: 2,
        progress: progress(2),
      }),
    ).toBe(false);
  });

  it("rejects a review when no progress row exists", () => {
    expect(
      isStaleAnswer({
        kind: "review",
        expectedStage: 1,
        progress: null,
      }),
    ).toBe(true);
  });

  it("rejects introducing a word that already has a progress row", () => {
    expect(
      isStaleAnswer({
        kind: "introduce",
        progress: progress(1),
      }),
    ).toBe(true);
    expect(
      isStaleAnswer({
        kind: "introduce",
        progress: null,
      }),
    ).toBe(false);
  });
});

describe("isReviewDue", () => {
  it("is true when due today or overdue and the stage is below 4", () => {
    expect(
      isReviewDue(progress(2, { dueDate: "2026-01-01" }), "2026-01-01"),
    ).toBe(true);
    expect(
      isReviewDue(progress(3, { dueDate: "2025-12-30" }), "2026-01-01"),
    ).toBe(true);
  });

  it("is false before the due date", () => {
    expect(
      isReviewDue(progress(2, { dueDate: "2026-01-05" }), "2026-01-01"),
    ).toBe(false);
  });

  it("is false for a duplicate wrong answer on the same study day", () => {
    const first = answerReview({
      progress: progress(2),
      correct: false,
      studyDay: "2026-01-01",
      firstAttempt: true,
    });

    expect(
      isStaleAnswer({
        kind: "review",
        expectedStage: 2,
        progress: first,
      }),
    ).toBe(false);
    expect(isReviewDue(first, "2026-01-01")).toBe(false);
  });

  it("is false for a graduated or missing row", () => {
    expect(isReviewDue(progress(4), "2026-01-01")).toBe(false);
    expect(isReviewDue(null, "2026-01-01")).toBe(false);
  });
});

describe("answerReview", () => {
  it("moves stage 1 to stage 2 with a three-day interval", () => {
    const result = answerReview({
      progress: progress(1),
      correct: true,
      studyDay: "2026-01-01",
      firstAttempt: true,
    });

    expect(result.stage).toBe(2);
    expect(result.dueDate).toBe("2026-01-04");
    expect(result.correctCount).toBe(2);
    expect(result.lastAnsweredOn).toBe("2026-01-01");
    expectInvariant(result);
  });

  it("moves stage 2 to stage 3 with a seven-day interval", () => {
    const result = answerReview({
      progress: progress(2),
      correct: true,
      studyDay: "2026-01-01",
      firstAttempt: true,
    });

    expect(result.stage).toBe(3);
    expect(result.dueDate).toBe("2026-01-08");
    expect(result.correctCount).toBe(3);
    expectInvariant(result);
  });

  it("graduates stage 3 and clears the due date", () => {
    const result = answerReview({
      progress: progress(3),
      correct: true,
      studyDay: "2026-01-01",
      firstAttempt: true,
    });

    expect(result.stage).toBe(4);
    expect(result.dueDate).toBeNull();
    expect(result.graduatedOn).toBe("2026-01-01");
    expect(result.correctCount).toBe(4);
    expectInvariant(result);
  });

  it("keeps the stage and schedules tomorrow after a wrong answer", () => {
    const result = answerReview({
      progress: progress(2, { wrongCount: 1 }),
      correct: false,
      studyDay: "2026-01-01",
      firstAttempt: true,
    });

    expect(result.stage).toBe(2);
    expect(result.dueDate).toBe("2026-01-02");
    expect(result.wrongCount).toBe(2);
    expect(result.correctCount).toBe(2);
    expect(result.lastAnsweredOn).toBe("2026-01-01");
    expectInvariant(result);
  });

  it("changes nothing for the retry round", () => {
    const original = progress(2, { wrongCount: 1 });

    expect(
      answerReview({
        progress: original,
        correct: true,
        studyDay: "2026-01-01",
        firstAttempt: false,
      }),
    ).toBe(original);
  });

  it("never changes a graduated word", () => {
    const original = progress(4);

    expect(
      answerReview({
        progress: original,
        correct: true,
        studyDay: "2026-01-01",
        firstAttempt: true,
      }),
    ).toBe(original);
  });

  it("keeps the database invariants across every transition", () => {
    const stages: Stage[] = [1, 2, 3];

    for (const stage of stages) {
      for (const correct of [true, false]) {
        expectInvariant(
          answerReview({
            progress: progress(stage),
            correct,
            studyDay: "2026-01-01",
            firstAttempt: true,
          }),
        );
      }
    }
  });
});
