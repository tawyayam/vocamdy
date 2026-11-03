import { describe, expect, it } from "vitest";
import {
  addStudyDays,
  compareStudyDays,
  daysBetweenStudyDays,
  getStudyDay,
  startOfStudyWeek,
} from "./day";

describe("getStudyDay", () => {
  it("uses the 04:00 cutoff", () => {
    expect(getStudyDay(new Date(2024, 0, 15, 3, 59))).toBe("2024-01-14");
    expect(getStudyDay(new Date(2024, 0, 15, 4, 0))).toBe("2024-01-15");
  });

  it("handles month and year ends", () => {
    expect(getStudyDay(new Date(2024, 2, 1, 3, 59))).toBe("2024-02-29");
    expect(getStudyDay(new Date(2025, 0, 1, 3, 59))).toBe("2024-12-31");
  });

  it("keeps local components across a DST change", () => {
    expect(getStudyDay(new Date(2024, 2, 10, 3, 59))).toBe("2024-03-09");
    expect(getStudyDay(new Date(2024, 2, 10, 4, 0))).toBe("2024-03-10");
    expect(addStudyDays("2024-03-09", 2)).toBe("2024-03-11");
    expect(addStudyDays("2024-11-02", 2)).toBe("2024-11-04");
  });
});

describe("study day arithmetic", () => {
  it("adds days across month, leap-year and year ends", () => {
    expect(addStudyDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addStudyDays("2023-02-28", 1)).toBe("2023-03-01");
    expect(addStudyDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addStudyDays("2024-01-01", -1)).toBe("2023-12-31");
  });

  it("compares and counts days without local-time shifts", () => {
    expect(compareStudyDays("2024-03-10", "2024-03-11")).toBeLessThan(0);
    expect(compareStudyDays("2024-03-11", "2024-03-10")).toBeGreaterThan(0);
    expect(compareStudyDays("2024-03-10", "2024-03-10")).toBe(0);
    expect(daysBetweenStudyDays("2024-03-09", "2024-03-11")).toBe(2);
  });

  it("starts weeks on Monday", () => {
    expect(startOfStudyWeek("2024-01-17")).toBe("2024-01-15");
    expect(startOfStudyWeek("2024-01-21")).toBe("2024-01-15");
    expect(startOfStudyWeek("2024-01-15")).toBe("2024-01-15");
    expect(startOfStudyWeek("2025-01-01")).toBe("2024-12-30");
  });

  it("rejects invalid study days", () => {
    expect(() => addStudyDays("2024-02-30", 1)).toThrow("Invalid study day");
    expect(() => addStudyDays("01-01-2024", 1)).toThrow("Invalid study day");
  });
});
