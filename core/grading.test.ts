import { describe, expect, it } from "vitest";
import {
  gradeTypedAnswer,
  isAnswerCorrect,
  normalizeAnswer,
  typedHint,
} from "./grading";

describe("normalizeAnswer", () => {
  it("trims, collapses whitespace and lowercases", () => {
    expect(normalizeAnswer("  Case   Study ")).toBe("case study");
  });
});

describe("isAnswerCorrect", () => {
  it("requires an exact normalized match", () => {
    expect(isAnswerCorrect("  AsSuMe ", "assume")).toBe(true);
    expect(isAnswerCorrect("assum", "assume")).toBe(false);
    expect(isAnswerCorrect("assumes", "assume")).toBe(false);
  });
});

describe("typedHint", () => {
  it("shows the first letter and underscores for the rest", () => {
    expect(typedHint("assume")).toBe("a_____");
    expect(typedHint("Case Study")).toBe("C___ _____");
  });
});

describe("gradeTypedAnswer", () => {
  it("accepts the exact answer", () => {
    expect(gradeTypedAnswer("assume", "assume")).toEqual({
      correct: true,
      formNote: null,
    });
  });

  it("explains when the headword is typed instead of the cloze form", () => {
    expect(gradeTypedAnswer("assume", "assumes", "assume", "assumes")).toEqual({
      correct: false,
      formNote: "The form in the sentence is assumes.",
    });
  });

  it("does not add the form note for other mistakes", () => {
    expect(gradeTypedAnswer("assumed", "assumes", "assume", "assumes")).toEqual({
      correct: false,
      formNote: null,
    });
  });

  it("treats I don't know as wrong", () => {
    expect(gradeTypedAnswer(null, "assume", "assume", "assume")).toEqual({
      correct: false,
      formNote: null,
    });
  });
});
