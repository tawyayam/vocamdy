import { describe, expect, it } from "vitest";
import {
  BACKLOG_CAP_OPTIONS,
  BATCH_SIZE_OPTIONS,
  DAILY_NEW_OPTIONS,
  choicesWithStoredValue,
} from "./settings-options";

describe("choicesWithStoredValue", () => {
  it("returns the standard choices when the stored value is in the list", () => {
    expect(choicesWithStoredValue(DAILY_NEW_OPTIONS, 10)).toEqual([
      5, 10, 15, 20,
    ]);
  });

  it("adds an out-of-list stored value in order", () => {
    expect(choicesWithStoredValue(DAILY_NEW_OPTIONS, 7)).toEqual([
      5, 7, 10, 15, 20,
    ]);
    expect(choicesWithStoredValue(BATCH_SIZE_OPTIONS, 4)).toEqual([
      3, 4, 5, 8, 10,
    ]);
    expect(choicesWithStoredValue(BACKLOG_CAP_OPTIONS, 40)).toEqual([
      20, 30, 40, 50, 100,
    ]);
  });
});
