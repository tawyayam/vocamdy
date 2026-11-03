import { describe, expect, it } from "vitest";
import { buildWeek, isActiveDay, WEEKLY_GOAL } from "./week";
import type { Activity } from "./types";

function activity(studyDay: string, overrides: Partial<Activity> = {}): Activity {
  return {
    studyDay,
    answersCount: 0,
    newWordsCount: 0,
    reviewsCount: 0,
    completed: null,
    ...overrides,
  };
}

describe("isActiveDay", () => {
  it("requires ten answers or a completed session", () => {
    expect(isActiveDay(null)).toBe(false);
    expect(isActiveDay(activity("2026-01-01", { answersCount: 9 }))).toBe(false);
    expect(isActiveDay(activity("2026-01-01", { answersCount: 10 }))).toBe(true);
    expect(isActiveDay(activity("2026-01-01", { completed: "mini" }))).toBe(true);
    expect(isActiveDay(activity("2026-01-01", { completed: "full" }))).toBe(true);
  });
});

describe("buildWeek", () => {
  it("groups Monday through Sunday around the study day", () => {
    const week = buildWeek("2026-01-07", []);

    expect(week.days.map((day) => day.studyDay)).toEqual([
      "2026-01-05",
      "2026-01-06",
      "2026-01-07",
      "2026-01-08",
      "2026-01-09",
      "2026-01-10",
      "2026-01-11",
    ]);
    expect(week.days.filter((day) => day.isToday)).toEqual([
      { studyDay: "2026-01-07", active: false, isToday: true },
    ]);
  });

  it("keeps Sunday in the week that started on Monday", () => {
    const week = buildWeek("2026-01-11", []);

    expect(week.days[0].studyDay).toBe("2026-01-05");
    expect(week.days[6].studyDay).toBe("2026-01-11");
    expect(week.days[6].isToday).toBe(true);
  });

  it("counts active days and reaches the weekly goal at five", () => {
    const activities = [
      activity("2026-01-05", { answersCount: 10 }),
      activity("2026-01-06", { completed: "mini" }),
      activity("2026-01-07", { answersCount: 12 }),
      activity("2026-01-08", { answersCount: 9 }),
      activity("2026-01-09", { completed: "full" }),
    ];
    const fourActive = buildWeek("2026-01-07", activities.slice(0, 4));
    const fiveActive = buildWeek("2026-01-07", activities);

    expect(fourActive.activeCount).toBe(3);
    expect(fourActive.goalReached).toBe(false);
    expect(fiveActive.activeCount).toBe(4);
    expect(fiveActive.goalReached).toBe(false);

    const withGoal = buildWeek("2026-01-07", [
      ...activities,
      activity("2026-01-10", { answersCount: 10 }),
    ]);

    expect(withGoal.activeCount).toBe(WEEKLY_GOAL);
    expect(withGoal.goalReached).toBe(true);
  });
});
