import { detectCloze } from "./cloze";
import type { Deck, DeckConfig, Group, Word } from "./types";

export type CsvRow = Record<string, string | undefined>;

export type DeckReport = {
  wordCount: number;
  missingExamples: { row: number; word: string }[];
  missingTranslations: { row: number; word: string }[];
  differentForms: { word: string; form: string }[];
  noCloze: { row: number; word: string }[];
  warnings: string[];
};

export type BuildDeckResult =
  | { ok: true; deck: Deck; report: DeckReport }
  | { ok: false; errors: string[]; report: DeckReport };

type ParsedConfig =
  | { ok: true; config: DeckConfig }
  | { ok: false; errors: string[] };

function createReport(): DeckReport {
  return {
    wordCount: 0,
    missingExamples: [],
    missingTranslations: [],
    differentForms: [],
    noCloze: [],
    warnings: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  errors: string[],
): string {
  const value = record[key];

  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} is required.`);
    return "";
  }

  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  errors: string[],
): string | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push(`${label} must be a string.`);
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    errors.push(`${label} must not be empty when set.`);
    return undefined;
  }

  return trimmed;
}

export function parseDeckConfig(value: unknown): ParsedConfig {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Deck config must be a JSON object."] };
  }

  const errors: string[] = [];
  const id = readRequiredString(value, "id", "id", errors);

  if (id && !/^[a-z0-9-]+$/.test(id)) {
    errors.push("id must contain only lowercase letters, digits and hyphens.");
  }

  const name = readRequiredString(value, "name", "name", errors);
  const file = readRequiredString(value, "file", "file", errors);

  if (file && !/^[^/\\]+\.csv$/i.test(file)) {
    errors.push("file must be a .csv file name inside data/decks.");
  }

  const groupLabel = readOptionalString(value, "groupLabel", "groupLabel", errors);
  const columnsValue = value.columns;
  let columns: DeckConfig["columns"] | undefined;

  if (!isRecord(columnsValue)) {
    errors.push("columns must be an object.");
  } else {
    const word = readRequiredString(columnsValue, "word", "columns.word", errors);
    const definition = readRequiredString(
      columnsValue,
      "definition",
      "columns.definition",
      errors,
    );
    const group = readOptionalString(columnsValue, "group", "columns.group", errors);
    const pos = readOptionalString(columnsValue, "pos", "columns.pos", errors);
    const example = readOptionalString(columnsValue, "example", "columns.example", errors);
    const arabic = readOptionalString(columnsValue, "arabic", "columns.arabic", errors);
    const blankForm = readOptionalString(
      columnsValue,
      "blankForm",
      "columns.blankForm",
      errors,
    );

    if (group && !groupLabel) {
      errors.push("groupLabel is required when columns.group is set.");
    }

    columns = {
      word,
      definition,
      ...(group ? { group } : {}),
      ...(pos ? { pos } : {}),
      ...(example ? { example } : {}),
      ...(arabic ? { arabic } : {}),
      ...(blankForm ? { blankForm } : {}),
    };
  }

  if (errors.length > 0 || !columns) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    config: {
      id,
      name,
      file,
      ...(groupLabel ? { groupLabel } : {}),
      columns,
    },
  };
}

function normalizeCell(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function optionalCell(row: CsvRow, header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }

  const value = normalizeCell(row[header]);
  return value === "" ? undefined : value;
}

function resolveGroup(
  config: DeckConfig,
  row: CsvRow,
  rowNumber: number,
  report: DeckReport,
): { id: string; label: string } {
  if (!config.columns.group) {
    return { id: "all", label: "All" };
  }

  const value = normalizeCell(row[config.columns.group]);

  if (!value) {
    report.warnings.push(`Row ${rowNumber}: group is empty; using Other.`);
    return { id: "other", label: "Other" };
  }

  return {
    id: value.toLowerCase().replace(/\s+/g, "-"),
    label: `${config.groupLabel ?? ""} ${value}`.trim(),
  };
}

export function buildDeck(
  config: DeckConfig,
  fields: string[],
  rows: CsvRow[],
): BuildDeckResult {
  const errors: string[] = [];
  const report = createReport();

  if (fields.length === 0) {
    return { ok: false, errors: ["CSV has no header row."], report };
  }

  const configuredColumns: [string, string | undefined][] = [
    ["word", config.columns.word],
    ["definition", config.columns.definition],
    ["group", config.columns.group],
    ["pos", config.columns.pos],
    ["example", config.columns.example],
    ["arabic", config.columns.arabic],
    ["blankForm", config.columns.blankForm],
  ];

  for (const [name, header] of configuredColumns) {
    if (header && !fields.includes(header)) {
      errors.push(`CSV is missing the "${header}" column configured as columns.${name}.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, report };
  }

  if (rows.length === 0) {
    return { ok: false, errors: ["CSV has no data rows."], report };
  }

  const words: Word[] = [];
  const groups = new Map<string, Group>();
  const seen = new Map<string, number>();
  let order = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const word = normalizeCell(row[config.columns.word]);
    const definition = normalizeCell(row[config.columns.definition]);

    if (!word) {
      errors.push(`Row ${rowNumber}: "${config.columns.word}" is required.`);
      return;
    }

    if (!definition) {
      errors.push(`Row ${rowNumber}: "${config.columns.definition}" is required.`);
      return;
    }

    const normalizedWord = word.toLowerCase();
    const firstRow = seen.get(normalizedWord);

    if (firstRow !== undefined) {
      errors.push(`Rows ${firstRow} and ${rowNumber}: duplicate headword "${word}".`);
      return;
    }

    seen.set(normalizedWord, rowNumber);
    order += 1;

    const group = resolveGroup(config, row, rowNumber, report);
    const pos = optionalCell(row, config.columns.pos);
    const example = optionalCell(row, config.columns.example);
    const arabic = optionalCell(row, config.columns.arabic);
    const blankForm = optionalCell(row, config.columns.blankForm);
    const detection = detectCloze(example, word, blankForm);

    if (detection.blankFormNotFound) {
      report.warnings.push(
        `Row ${rowNumber}: blank form "${blankForm}" was not found in the example; using the headword instead.`,
      );
    }

    if (config.columns.example && !example) {
      report.missingExamples.push({ row: rowNumber, word });
    }

    if (config.columns.arabic && !arabic) {
      report.missingTranslations.push({ row: rowNumber, word });
    }

    if (config.columns.example) {
      if (!detection.cloze) {
        report.noCloze.push({ row: rowNumber, word });
      } else if (detection.cloze.form.toLowerCase() !== normalizedWord) {
        report.differentForms.push({ word, form: detection.cloze.form });
      }
    }

    const existingGroup = groups.get(group.id);

    if (existingGroup) {
      existingGroup.count += 1;
    } else {
      groups.set(group.id, { id: group.id, label: group.label, count: 1 });
    }

    words.push({
      id: `${config.id}:${normalizedWord.replace(/\s+/g, "-")}`,
      deck: config.id,
      order,
      group: group.id,
      word,
      ...(pos ? { pos } : {}),
      definition,
      ...(example ? { example } : {}),
      ...(arabic ? { arabic } : {}),
      cloze: detection.cloze,
    });
  });

  report.wordCount = words.length;

  if (errors.length > 0) {
    return { ok: false, errors, report };
  }

  return {
    ok: true,
    deck: {
      id: config.id,
      name: config.name,
      groups: [...groups.values()],
      words,
    },
    report,
  };
}
