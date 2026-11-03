export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isAnswerCorrect(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

export function typedHint(answer: string): string {
  const trimmed = answer.trim();

  if (!trimmed) {
    return "";
  }

  return Array.from(trimmed)
    .map((character, index) => {
      if (index === 0 || character === " " || character === "-") {
        return character;
      }

      return "_";
    })
    .join("");
}

export type TypedAnswerResult = {
  correct: boolean;
  formNote: string | null;
};

export function gradeTypedAnswer(
  input: string | null,
  expected: string,
  headword?: string,
  form?: string,
): TypedAnswerResult {
  if (input === null) {
    return { correct: false, formNote: null };
  }

  if (isAnswerCorrect(input, expected)) {
    return { correct: true, formNote: null };
  }

  if (!headword || !form || normalizeAnswer(headword) === normalizeAnswer(form)) {
    return { correct: false, formNote: null };
  }

  const typedHeadword = isAnswerCorrect(input, headword);
  const expectedIsForm = isAnswerCorrect(expected, form);

  if (typedHeadword && expectedIsForm) {
    return { correct: false, formNote: `The form in the sentence is ${form}.` };
  }

  return { correct: false, formNote: null };
}
