import { describe, expect, it } from "vitest";
import { buildDeck, parseDeckConfig, type BuildDeckResult, type CsvRow } from "./deck";
import type { DeckConfig } from "./types";

const config: DeckConfig = {
  id: "test",
  name: "Test Deck",
  file: "test.csv",
  groupLabel: "Sublist",
  columns: {
    word: "word",
    definition: "definition",
    group: "sublist",
    pos: "pos",
    example: "example",
    arabic: "arabic",
  },
};

const fields = ["word", "sublist", "pos", "definition", "example", "arabic"];

function row(overrides: Record<string, string> = {}): CsvRow {
  return {
    word: "assume",
    sublist: "1",
    pos: "verb",
    definition: "To suppose something is true.",
    example: "They assume it is true.",
    arabic: "يفترض",
    ...overrides,
  };
}

function buildOk(
  deckConfig: DeckConfig,
  deckFields: string[],
  rows: CsvRow[],
): Extract<BuildDeckResult, { ok: true }> {
  const result = buildDeck(deckConfig, deckFields, rows);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }

  return result;
}

describe("parseDeckConfig", () => {
  it("accepts a complete config", () => {
    const result = parseDeckConfig({
      id: "awl",
      name: "Academic Word List",
      file: "awl.csv",
      groupLabel: "Sublist",
      columns: {
        word: "word",
        definition: "definition",
        group: "sublist",
        pos: "part_of_speech",
        example: "example",
        arabic: "arabic_translation",
      },
    });

    expect(result).toEqual({
      ok: true,
      config: {
        id: "awl",
        name: "Academic Word List",
        file: "awl.csv",
        groupLabel: "Sublist",
        columns: {
          word: "word",
          definition: "definition",
          group: "sublist",
          pos: "part_of_speech",
          example: "example",
          arabic: "arabic_translation",
        },
      },
    });
  });

  it("accepts an optional blank form column", () => {
    const result = parseDeckConfig({
      id: "awl",
      name: "Academic Word List",
      file: "awl.csv",
      columns: { word: "word", definition: "definition", blankForm: "blank" },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.config.columns.blankForm).toBe("blank");
    }
  });

  it("rejects a non-object", () => {
    expect(parseDeckConfig("awl")).toEqual({
      ok: false,
      errors: ["Deck config must be a JSON object."],
    });
  });

  it("rejects missing required fields", () => {
    const result = parseDeckConfig({});

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("id is required.");
      expect(result.errors).toContain("name is required.");
      expect(result.errors).toContain("file is required.");
      expect(result.errors).toContain("columns must be an object.");
    }
  });

  it("rejects an id that is not lowercase", () => {
    const result = parseDeckConfig({
      id: "AWL",
      name: "Academic Word List",
      file: "awl.csv",
      columns: { word: "word", definition: "definition" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain(
        "id must contain only lowercase letters, digits and hyphens.",
      );
    }
  });

  it("rejects a file outside data/decks", () => {
    const result = parseDeckConfig({
      id: "awl",
      name: "Academic Word List",
      file: "decks/awl.csv",
      columns: { word: "word", definition: "definition" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("file must be a .csv file name inside data/decks.");
    }
  });

  it("rejects a group column without a group label", () => {
    const result = parseDeckConfig({
      id: "awl",
      name: "Academic Word List",
      file: "awl.csv",
      columns: { word: "word", definition: "definition", group: "sublist" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("groupLabel is required when columns.group is set.");
    }
  });

  it("requires the word and definition headers", () => {
    const result = parseDeckConfig({
      id: "awl",
      name: "Academic Word List",
      file: "awl.csv",
      columns: { definition: "definition" },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("columns.word is required.");
    }
  });
});

describe("buildDeck", () => {
  it("maps a row to a word, a group and a cloze", () => {
    const result = buildOk(config, fields, [row()]);

    expect(result.deck.words).toEqual([
      {
        id: "test:assume",
        deck: "test",
        order: 1,
        group: "1",
        word: "assume",
        pos: "verb",
        definition: "To suppose something is true.",
        example: "They assume it is true.",
        arabic: "يفترض",
        cloze: { form: "assume", start: 5, end: 11 },
      },
    ]);
    expect(result.deck.groups).toEqual([{ id: "1", label: "Sublist 1", count: 1 }]);
    expect(result.report.wordCount).toBe(1);
  });

  it("trims values and collapses inner whitespace", () => {
    const result = buildOk(config, fields, [
      row({
        word: "  assume  ",
        sublist: " 1 ",
        definition: " To   suppose. ",
        example: " They   assume   it. ",
        arabic: "  يفترض  ",
      }),
    ]);
    const word = result.deck.words[0];

    expect(word.word).toBe("assume");
    expect(word.definition).toBe("To suppose.");
    expect(word.example).toBe("They assume it.");
    expect(word.arabic).toBe("يفترض");
    expect(word.cloze).toEqual({ form: "assume", start: 5, end: 11 });
  });

  it("builds a word id from the lowercase headword with spaces as hyphens", () => {
    const result = buildOk(config, fields, [
      row({ word: "Case Study", example: "A case study is useful." }),
    ]);

    expect(result.deck.words[0].id).toBe("test:case-study");
    expect(result.deck.words[0].word).toBe("Case Study");
  });

  it("reports a missing required value with its row number", () => {
    const result = buildDeck(config, fields, [row(), row({ word: " ", definition: "x" })]);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain('Row 3: "word" is required.');
      expect(result.report.wordCount).toBe(1);
    }
  });

  it("reports duplicate headwords with both row numbers", () => {
    const result = buildDeck(config, fields, [
      row(),
      row({ word: "  ASSUME ", definition: "Another definition." }),
    ]);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain('Rows 2 and 3: duplicate headword "ASSUME".');
    }
  });

  it("keeps groups in first-appearance order and counts their words", () => {
    const result = buildOk(config, fields, [
      row({ word: "one", sublist: "2" }),
      row({ word: "two", sublist: "1" }),
      row({ word: "three", sublist: "2" }),
    ]);

    expect(result.deck.groups).toEqual([
      { id: "2", label: "Sublist 2", count: 2 },
      { id: "1", label: "Sublist 1", count: 1 },
    ]);
  });

  it("uses a single all group when there is no group column", () => {
    const noGroupConfig: DeckConfig = {
      id: "test",
      name: "Test Deck",
      file: "test.csv",
      columns: { word: "word", definition: "definition" },
    };
    const result = buildOk(noGroupConfig, ["word", "definition"], [
      { word: "assume", definition: "To suppose." },
    ]);

    expect(result.deck.words[0].group).toBe("all");
    expect(result.deck.groups).toEqual([{ id: "all", label: "All", count: 1 }]);
  });

  it("does not report optional columns that are not configured", () => {
    const minimalConfig: DeckConfig = {
      id: "test",
      name: "Test Deck",
      file: "test.csv",
      columns: { word: "word", definition: "definition" },
    };
    const result = buildOk(minimalConfig, ["word", "definition"], [
      { word: "assume", definition: "To suppose." },
    ]);

    expect(result.deck.words[0].cloze).toBeNull();
    expect(result.report.missingExamples).toEqual([]);
    expect(result.report.missingTranslations).toEqual([]);
    expect(result.report.noCloze).toEqual([]);
  });

  it("puts an empty group value in Other and warns", () => {
    const result = buildOk(config, fields, [row({ sublist: "" })]);

    expect(result.deck.words[0].group).toBe("other");
    expect(result.deck.groups).toEqual([{ id: "other", label: "Other", count: 1 }]);
    expect(result.report.warnings).toContain("Row 2: group is empty; using Other.");
  });

  it("omits missing optional fields and reports them", () => {
    const result = buildOk(config, fields, [
      row({ pos: "", example: "", arabic: "" }),
    ]);
    const word = result.deck.words[0];

    expect(word).not.toHaveProperty("pos");
    expect(word).not.toHaveProperty("example");
    expect(word).not.toHaveProperty("arabic");
    expect(word.cloze).toBeNull();
    expect(result.report.missingExamples).toEqual([{ row: 2, word: "assume" }]);
    expect(result.report.missingTranslations).toEqual([{ row: 2, word: "assume" }]);
    expect(result.report.noCloze).toEqual([{ row: 2, word: "assume" }]);
  });

  it("reports forms that differ from the headword", () => {
    const result = buildOk(config, fields, [
      row({ example: "They assumed it." }),
    ]);

    expect(result.report.differentForms).toEqual([{ word: "assume", form: "assumed" }]);
    expect(result.report.noCloze).toEqual([]);
  });

  it("reports a word with no cloze", () => {
    const result = buildOk(config, fields, [row({ example: "Nothing to see." })]);

    expect(result.report.noCloze).toEqual([{ row: 2, word: "assume" }]);
    expect(result.report.differentForms).toEqual([]);
  });

  it("lets a blank form override the headword", () => {
    const blankConfig: DeckConfig = {
      ...config,
      columns: { ...config.columns, blankForm: "blank" },
    };
    const result = buildOk(blankConfig, [...fields, "blank"], [
      row({ blank: "adopted", example: "They adopted it." }),
    ]);

    expect(result.deck.words[0].cloze).toEqual({ form: "adopted", start: 5, end: 12 });
    expect(result.report.differentForms).toEqual([{ word: "assume", form: "adopted" }]);
    expect(result.report.warnings).toEqual([]);
  });

  it("warns and falls back when the blank form is missing", () => {
    const blankConfig: DeckConfig = {
      ...config,
      columns: { ...config.columns, blankForm: "blank" },
    };
    const result = buildOk(blankConfig, [...fields, "blank"], [
      row({ blank: "adoption", example: "They assumed it." }),
    ]);

    expect(result.deck.words[0].cloze?.form).toBe("assumed");
    expect(result.report.warnings).toContain(
      'Row 2: blank form "adoption" was not found in the example; using the headword instead.',
    );
  });

  it("rejects a CSV that lacks a configured column", () => {
    const result = buildDeck(config, ["word", "definition", "sublist", "pos", "arabic"], [
      row(),
    ]);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain(
        'CSV is missing the "example" column configured as columns.example.',
      );
    }
  });

  it("rejects an empty header", () => {
    const result = buildDeck(config, [], []);

    expect(result).toEqual({
      ok: false,
      errors: ["CSV has no header row."],
      report: {
        wordCount: 0,
        missingExamples: [],
        missingTranslations: [],
        differentForms: [],
        noCloze: [],
        warnings: [],
      },
    });
  });

  it("rejects a CSV with no data rows", () => {
    const result = buildDeck(config, fields, []);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain("CSV has no data rows.");
    }
  });
});
