import type { Cloze } from "./types";

const SUFFIXES = ["s", "es", "d", "ed", "ing", "ly"];

type ClozeDetection = {
  cloze: Cloze | null;
  blankFormNotFound: boolean;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findWholeWord(example: string, value: string): Cloze | null {
  const pattern = new RegExp(`\\b${escapeRegExp(value)}\\b`, "i");
  const match = pattern.exec(example);

  if (!match) {
    return null;
  }

  return {
    form: match[0],
    start: match.index,
    end: match.index + match[0].length,
  };
}

function findHeadwordForm(example: string, headword: string): Cloze | null {
  const suffixes = SUFFIXES.join("|");
  const pattern = new RegExp(`\\b${escapeRegExp(headword)}(?:${suffixes})?\\b`, "i");
  const match = pattern.exec(example);

  if (!match) {
    return null;
  }

  return {
    form: match[0],
    start: match.index,
    end: match.index + match[0].length,
  };
}

export function findCloze(example: string, form: string): Cloze | null {
  const trimmed = form.trim();

  if (!trimmed) {
    return null;
  }

  return findWholeWord(example, trimmed);
}

export function detectCloze(
  example: string | undefined,
  headword: string,
  blankForm?: string,
): ClozeDetection {
  if (!example) {
    return { cloze: null, blankFormNotFound: false };
  }

  const manualForm = blankForm?.trim();

  if (manualForm) {
    const manualCloze = findWholeWord(example, manualForm);

    if (manualCloze) {
      return { cloze: manualCloze, blankFormNotFound: false };
    }

    return { cloze: findHeadwordForm(example, headword), blankFormNotFound: true };
  }

  return { cloze: findHeadwordForm(example, headword), blankFormNotFound: false };
}
