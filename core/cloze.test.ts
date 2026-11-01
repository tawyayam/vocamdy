import { describe, expect, it } from "vitest";
import { detectCloze, findCloze } from "./cloze";

describe("findCloze", () => {
  it("finds the first whole-word match and keeps the written form", () => {
    expect(findCloze("The analysis of the data.", "analysis")).toEqual({
      form: "analysis",
      start: 4,
      end: 12,
    });
  });

  it("matches at the start of a sentence regardless of case", () => {
    expect(findCloze("Analysis matters.", "analysis")).toEqual({
      form: "Analysis",
      start: 0,
      end: 8,
    });
  });

  it("does not match part of a longer word", () => {
    expect(findCloze("The analyst works.", "analysis")).toBeNull();
  });

  it("returns the first match", () => {
    expect(findCloze("An area and another area.", "area")?.start).toBe(3);
  });
});

describe("detectCloze", () => {
  it("matches every allowed suffix", () => {
    const cases = [
      ["assume", "assumes"],
      ["assess", "assesses"],
      ["assume", "assumed"],
      ["assess", "assessed"],
      ["walk", "walking"],
      ["quick", "quickly"],
    ];

    for (const [headword, form] of cases) {
      expect(detectCloze(`It ${form} here.`, headword).cloze?.form).toBe(form);
    }
  });

  it("does not apply other inflections or stemming", () => {
    expect(detectCloze("The assumption is clear.", "assume").cloze).toBeNull();
    expect(detectCloze("The studies are clear.", "study").cloze).toBeNull();
  });

  it("uses the first match", () => {
    expect(detectCloze("Assumed then assume.", "assume").cloze?.form).toBe("Assumed");
  });

  it("lets a blank form override the headword", () => {
    const result = detectCloze("They adopted it.", "approach", "adopted");

    expect(result.cloze).toEqual({ form: "adopted", start: 5, end: 12 });
    expect(result.blankFormNotFound).toBe(false);
  });

  it("warns when the blank form is missing and falls back to the headword", () => {
    const result = detectCloze("The approach was adopted.", "approach", "adoption");

    expect(result.cloze?.form).toBe("approach");
    expect(result.blankFormNotFound).toBe(true);
  });

  it("returns no cloze without an example", () => {
    expect(detectCloze(undefined, "assume").cloze).toBeNull();
  });

  it("does not warn for an empty blank form", () => {
    expect(detectCloze("They assume it.", "assume", "  ").blankFormNotFound).toBe(false);
  });
});
