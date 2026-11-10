import { describe, expect, it } from "vitest";
import { choiceIndexForNumberKey, moveChoiceIndex } from "./choice-navigation";

describe("moveChoiceIndex", () => {
  it("moves in both directions and wraps", () => {
    expect(moveChoiceIndex(0, -1, 4)).toBe(3);
    expect(moveChoiceIndex(3, 1, 4)).toBe(0);
    expect(moveChoiceIndex(1, 1, 4)).toBe(2);
  });

  it("handles a single choice and an empty list", () => {
    expect(moveChoiceIndex(0, 1, 1)).toBe(0);
    expect(moveChoiceIndex(0, 1, 0)).toBe(-1);
  });
});

describe("choiceIndexForNumberKey", () => {
  it("maps number keys to choices", () => {
    expect(choiceIndexForNumberKey("1", 4)).toBe(0);
    expect(choiceIndexForNumberKey("4", 4)).toBe(3);
  });

  it("ignores other keys and out-of-range numbers", () => {
    expect(choiceIndexForNumberKey("0", 4)).toBeNull();
    expect(choiceIndexForNumberKey("5", 4)).toBeNull();
    expect(choiceIndexForNumberKey("10", 4)).toBeNull();
    expect(choiceIndexForNumberKey("a", 4)).toBeNull();
    expect(choiceIndexForNumberKey("1", 0)).toBeNull();
  });
});
