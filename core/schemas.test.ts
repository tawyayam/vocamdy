import { describe, expect, it } from "vitest";
import {
  answerInputForServerDay,
  completionSchema,
  extraAttemptSchema,
  introducedWordSchema,
  reviewAnswerSchema,
  settingsInputSchema,
  studyDaySchema,
} from "./schemas";

const serverDay = "2026-01-10";

describe("studyDaySchema", () => {
  it("accepts a real date in the expected format", () => {
    expect(studyDaySchema.safeParse("2026-01-10").success).toBe(true);
  });

  it("rejects a malformed date", () => {
    expect(studyDaySchema.safeParse("2026-1-10").success).toBe(false);
    expect(studyDaySchema.safeParse("10-01-2026").success).toBe(false);
  });

  it("rejects a date that does not exist", () => {
    expect(studyDaySchema.safeParse("2026-02-30").success).toBe(false);
  });
});

describe("answer input schemas", () => {
  it("accepts a review answer", () => {
    const result = reviewAnswerSchema.safeParse({
      kind: "review",
      studyDay: serverDay,
      wordId: "awl:analysis",
      expectedStage: 2,
      correct: true,
    });

    expect(result.success).toBe(true);
  });

  it("accepts an introduced word and an extra attempt", () => {
    expect(
      introducedWordSchema.safeParse({
        kind: "introduce",
        studyDay: serverDay,
        wordId: "awl:analysis",
        wrongCount: 2,
      }).success,
    ).toBe(true);
    expect(
      extraAttemptSchema.safeParse({
        kind: "extra",
        studyDay: serverDay,
        wordId: "awl:analysis",
      }).success,
    ).toBe(true);
  });

  it("accepts a completion", () => {
    expect(
      completionSchema.safeParse({
        kind: "completion",
        studyDay: serverDay,
        completion: "full",
      }).success,
    ).toBe(true);
  });

  it("rejects a negative wrong count", () => {
    expect(
      introducedWordSchema.safeParse({
        kind: "introduce",
        studyDay: serverDay,
        wordId: "awl:analysis",
        wrongCount: -1,
      }).success,
    ).toBe(false);
  });

  it("accepts a wrong count up to 50 and rejects more", () => {
    const introducedWord = {
      kind: "introduce",
      studyDay: serverDay,
      wordId: "awl:analysis",
    };

    expect(
      introducedWordSchema.safeParse({ ...introducedWord, wrongCount: 50 }).success,
    ).toBe(true);
    expect(
      introducedWordSchema.safeParse({ ...introducedWord, wrongCount: 51 }).success,
    ).toBe(false);
  });

  it("rejects a study day more than two days from the server day", () => {
    const schema = answerInputForServerDay(serverDay);
    const answer = {
      kind: "extra",
      wordId: "awl:analysis",
    };

    expect(schema.safeParse({ ...answer, studyDay: "2026-01-08" }).success).toBe(true);
    expect(schema.safeParse({ ...answer, studyDay: "2026-01-12" }).success).toBe(true);
    expect(schema.safeParse({ ...answer, studyDay: "2026-01-07" }).success).toBe(false);
    expect(schema.safeParse({ ...answer, studyDay: "2026-01-13" }).success).toBe(false);
  });
});

describe("settingsInputSchema", () => {
  it("accepts the database bounds", () => {
    expect(
      settingsInputSchema.safeParse({
        activeDeckId: "awl",
        dailyNew: 1,
        batchSize: 3,
        backlogCap: 10,
      }).success,
    ).toBe(true);
    expect(
      settingsInputSchema.safeParse({
        activeDeckId: "awl",
        dailyNew: 30,
        batchSize: 10,
        backlogCap: 100,
      }).success,
    ).toBe(true);
  });

  it("rejects values outside the database bounds", () => {
    const settings = {
      activeDeckId: "awl",
      dailyNew: 10,
      batchSize: 5,
      backlogCap: 30,
    };

    expect(settingsInputSchema.safeParse({ ...settings, dailyNew: 0 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...settings, dailyNew: 31 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...settings, batchSize: 2 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...settings, batchSize: 11 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...settings, backlogCap: 9 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...settings, backlogCap: 101 }).success).toBe(false);
  });
});
