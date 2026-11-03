import { describe, expect, it } from "vitest";
import { estimateFinish } from "./estimate";

describe("estimateFinish", () => {
  it("uses the worked example from the study day", () => {
    expect(
      estimateFinish({
        totalWords: 570,
        introduced: 148,
        dailyNew: 10,
        newRemaining: 5,
        studyDay: "2026-01-01",
        paused: false,
      }),
    ).toEqual({
      remaining: 422,
      finishLearning: "2026-02-12",
      graduation: "2026-02-23",
    });
  });

  it("starts tomorrow when no new words remain today", () => {
    expect(
      estimateFinish({
        totalWords: 570,
        introduced: 148,
        dailyNew: 10,
        newRemaining: 0,
        studyDay: "2026-01-01",
        paused: false,
      }),
    ).toEqual({
      remaining: 422,
      finishLearning: "2026-02-13",
      graduation: "2026-02-24",
    });
  });

  it("returns no dates when every word is introduced", () => {
    expect(
      estimateFinish({
        totalWords: 570,
        introduced: 570,
        dailyNew: 10,
        newRemaining: 0,
        studyDay: "2026-01-01",
        paused: false,
      }),
    ).toEqual({
      remaining: 0,
      finishLearning: null,
      graduation: null,
    });
  });

  it("returns no dates while new words are paused", () => {
    expect(
      estimateFinish({
        totalWords: 570,
        introduced: 148,
        dailyNew: 10,
        newRemaining: 0,
        studyDay: "2026-01-01",
        paused: true,
      }),
    ).toEqual({
      remaining: 422,
      finishLearning: null,
      graduation: null,
    });
  });

  it("rounds a partial day up", () => {
    expect(
      estimateFinish({
        totalWords: 100,
        introduced: 0,
        dailyNew: 30,
        newRemaining: 10,
        studyDay: "2026-01-01",
        paused: false,
      }),
    ).toEqual({
      remaining: 100,
      finishLearning: "2026-01-04",
      graduation: "2026-01-15",
    });
  });
});
