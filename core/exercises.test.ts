import { describe, expect, it } from "vitest";
import { createExercise } from "./exercises";
import type { Cloze, Deck, Word } from "./types";

type WordInput = {
  id: string;
  order: number;
  group: string;
  word: string;
  arabic?: string;
  example?: string;
  cloze?: Cloze | null;
};

function makeWord(input: WordInput): Word {
  return {
    id: input.id,
    deck: "test",
    order: input.order,
    group: input.group,
    word: input.word,
    definition: `Definition of ${input.word}.`,
    ...(input.arabic ? { arabic: input.arabic } : {}),
    ...(input.example ? { example: input.example } : {}),
    cloze: input.cloze ?? null,
  };
}

function makeDeck(words: Word[], groupIds: string[]): Deck {
  return {
    id: "test",
    name: "Test Deck",
    groups: groupIds.map((id) => ({
      id,
      label: id,
      count: words.filter((word) => word.group === id).length,
    })),
    words,
  };
}

const target = makeWord({
  id: "test:assume",
  order: 1,
  group: "1",
  word: "assume",
  arabic: "arb-assume",
  example: "They assumed it.",
  cloze: { form: "assumed", start: 5, end: 12 },
});

const sameGroupWords = [
  makeWord({
    id: "test:analyse",
    order: 2,
    group: "1",
    word: "analyse",
    arabic: "arb-analyse",
    example: "They analyse it.",
    cloze: { form: "analyse", start: 5, end: 12 },
  }),
  makeWord({
    id: "test:assess",
    order: 3,
    group: "1",
    word: "assess",
    arabic: "arb-assess",
    example: "They assess it.",
    cloze: { form: "assess", start: 5, end: 11 },
  }),
  makeWord({
    id: "test:approach",
    order: 4,
    group: "1",
    word: "approach",
    arabic: "arb-approach",
    example: "They approach it.",
    cloze: { form: "approach", start: 5, end: 13 },
  }),
];

const farWords = [
  makeWord({
    id: "test:benefit",
    order: 5,
    group: "2",
    word: "benefit",
    arabic: "arb-benefit",
    example: "They benefit from it.",
    cloze: { form: "benefit", start: 5, end: 12 },
  }),
  makeWord({
    id: "test:concept",
    order: 6,
    group: "2",
    word: "concept",
    arabic: "arb-concept",
    example: "The concept is clear.",
    cloze: { form: "concept", start: 4, end: 11 },
  }),
];

const deck = makeDeck([target, ...sameGroupWords, ...farWords], ["1", "2"]);

function create(touch: 1 | 2 | 3 | 4, word: Word = target, attempt = 1) {
  return createExercise({
    word,
    deck,
    touch,
    studyDay: "2026-01-01",
    attempt,
  });
}

describe("createExercise", () => {
  it("uses choice_meaning for touch 1 when Arabic exists", () => {
    const exercise = create(1);

    expect(exercise.kind).toBe("choice_meaning");

    if (exercise.kind !== "choice_meaning") {
      throw new Error("Expected a choice exercise.");
    }

    expect(exercise.options).toHaveLength(4);
    expect(new Set(exercise.options).size).toBe(4);
    expect(exercise.options).toContain(exercise.answer);
    expect(["headword_to_arabic", "arabic_to_headword"]).toContain(exercise.direction);

    if (exercise.direction === "headword_to_arabic") {
      expect(exercise.prompt).toBe("assume");
      expect(exercise.answer).toBe("arb-assume");
    } else {
      expect(exercise.prompt).toBe("arb-assume");
      expect(exercise.answer).toBe("assume");
    }
  });

  it("falls back to choice_definition for touch 1 without Arabic", () => {
    const noArabic = makeWord({
      id: "test:benefit",
      order: 1,
      group: "1",
      word: "benefit",
      example: "They benefit from it.",
      cloze: { form: "benefit", start: 5, end: 12 },
    });
    const exercise = create(1, noArabic);

    expect(exercise.kind).toBe("choice_definition");
    expect(exercise.prompt).toBe("Definition of benefit.");
    expect(exercise.answer).toBe("benefit");
  });

  it("uses choice_cloze for touch 2 and hides the form", () => {
    const exercise = create(2);

    expect(exercise.kind).toBe("choice_cloze");
    expect(exercise.prompt).toContain("_");
    expect(exercise.prompt).not.toContain("assumed");
    expect(exercise.answer).toBe("assume");
  });

  it("falls back to choice_definition for touch 2 without a cloze", () => {
    const noCloze = makeWord({
      id: "test:benefit",
      order: 1,
      group: "1",
      word: "benefit",
      arabic: "arb-benefit",
    });
    const exercise = create(2, noCloze);

    expect(exercise.kind).toBe("choice_definition");
    expect(exercise.answer).toBe("benefit");
  });

  it("uses type_definition for touch 3", () => {
    const exercise = create(3);

    expect(exercise).toMatchObject({
      kind: "type_definition",
      prompt: "Definition of assume.",
      answer: "assume",
      hint: "a_____",
    });
  });

  it("uses type_cloze for touch 4 and expects the written form", () => {
    const exercise = create(4);

    expect(exercise).toMatchObject({
      kind: "type_cloze",
      answer: "assumed",
      hint: "a______",
    });
    expect(exercise.prompt).not.toContain("assumed");
  });

  it("falls back to type_definition for touch 4 without a cloze", () => {
    const noCloze = makeWord({
      id: "test:benefit",
      order: 1,
      group: "1",
      word: "benefit",
      arabic: "arb-benefit",
    });
    const exercise = create(4, noCloze);

    expect(exercise.kind).toBe("type_definition");
    expect(exercise.answer).toBe("benefit");
  });

  it("takes three distractors from the same group first", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "2",
      word: "target",
    });
    const sameGroup = [
      makeWord({ id: "test:same-1", order: 2, group: "2", word: "same-one" }),
      makeWord({ id: "test:same-2", order: 3, group: "2", word: "same-two" }),
      makeWord({ id: "test:same-3", order: 4, group: "2", word: "same-three" }),
    ];
    const far = [
      makeWord({ id: "test:far-1", order: 5, group: "1", word: "far-one" }),
      makeWord({ id: "test:far-2", order: 6, group: "3", word: "far-two" }),
    ];
    const localDeck = makeDeck([targetWord, ...sameGroup, ...far], ["1", "2", "3"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "choice_definition") {
      throw new Error("Expected choice_definition.");
    }

    expect(new Set(exercise.options)).toEqual(
      new Set(["target", "same-one", "same-two", "same-three"]),
    );
  });

  it("fills from the nearest groups when the same group is short", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "2",
      word: "target",
    });
    const words = [
      targetWord,
      makeWord({ id: "test:same", order: 2, group: "2", word: "same" }),
      makeWord({ id: "test:left-1", order: 3, group: "1", word: "left-one" }),
      makeWord({ id: "test:left-2", order: 4, group: "1", word: "left-two" }),
      makeWord({ id: "test:right-1", order: 5, group: "3", word: "right-one" }),
      makeWord({ id: "test:right-2", order: 6, group: "3", word: "right-two" }),
    ];
    const localDeck = makeDeck(words, ["1", "2", "3"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "choice_definition") {
      throw new Error("Expected choice_definition.");
    }

    expect(new Set(exercise.options)).toEqual(
      new Set(["target", "same", "left-one", "left-two"]),
    );
  });

  it("never repeats an Arabic option", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "1",
      word: "target",
      arabic: "shared",
    });
    const words = [
      targetWord,
      makeWord({
        id: "test:same-arabic",
        order: 2,
        group: "1",
        word: "same-arabic",
        arabic: "shared",
      }),
      makeWord({
        id: "test:other-1",
        order: 3,
        group: "1",
        word: "other-one",
        arabic: "one",
      }),
      makeWord({
        id: "test:other-2",
        order: 4,
        group: "1",
        word: "other-two",
        arabic: "two",
      }),
      makeWord({
        id: "test:other-3",
        order: 5,
        group: "1",
        word: "other-three",
        arabic: "three",
      }),
    ];
    const localDeck = makeDeck(words, ["1"]);
    const exercise = Array.from({ length: 20 }, (_, index) =>
      createExercise({
        word: targetWord,
        deck: localDeck,
        touch: 1,
        studyDay: "2026-01-01",
        attempt: index + 1,
      }),
    ).find(
      (candidate) =>
        candidate.kind === "choice_meaning" &&
        candidate.direction === "headword_to_arabic",
    );

    if (!exercise || exercise.kind !== "choice_meaning") {
      throw new Error("Expected a headword-to-Arabic choice exercise.");
    }

    expect(new Set(exercise.options).size).toBe(exercise.options.length);
    expect(exercise.options.filter((option) => option === "shared")).toHaveLength(1);
  });

  it("uses every available option when the deck has fewer than three distractors", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "1",
      word: "target",
    });
    const words = [
      targetWord,
      makeWord({ id: "test:other-1", order: 2, group: "1", word: "other-one" }),
      makeWord({ id: "test:other-2", order: 3, group: "1", word: "other-two" }),
    ];
    const localDeck = makeDeck(words, ["1"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "choice_definition") {
      throw new Error("Expected choice_definition.");
    }

    expect(exercise.options).toHaveLength(3);
    expect(new Set(exercise.options).size).toBe(3);
  });

  it("uses two options when only one eligible distractor exists", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "1",
      word: "target",
    });
    const localDeck = makeDeck(
      [
        targetWord,
        makeWord({ id: "test:other", order: 2, group: "1", word: "other" }),
      ],
      ["1"],
    );
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "choice_definition") {
      throw new Error("Expected choice_definition.");
    }

    expect(new Set(exercise.options)).toEqual(new Set(["target", "other"]));
  });

  it("falls back to type_definition when no choice distractor exists", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "1",
      word: "target",
    });
    const localDeck = makeDeck([targetWord], ["1"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "type_definition") {
      throw new Error("Expected type_definition.");
    }

    expect(exercise.prompt).toBe(targetWord.definition);
    expect(exercise.answer).toBe(targetWord.word);
  });

  it("falls back to definition-to-headword typing for a meaning choice with no distractor", () => {
    const targetWord = makeWord({
      id: "test:target",
      order: 1,
      group: "1",
      word: "target",
      arabic: "arb-target",
    });
    const localDeck = makeDeck([targetWord], ["1"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 1,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "type_definition") {
      throw new Error("Expected type_definition.");
    }

    expect(exercise.prompt).toBe(targetWord.definition);
    expect(exercise.prompt).not.toBe(targetWord.arabic);
    expect(exercise.answer).toBe(targetWord.word);
  });

  it("falls back to type_cloze when no cloze choice distractor exists", () => {
    const targetWord = makeWord({
      id: "test:assume",
      order: 1,
      group: "1",
      word: "assume",
      example: "They assumed it.",
      cloze: { form: "assumed", start: 5, end: 12 },
    });
    const localDeck = makeDeck([targetWord], ["1"]);
    const exercise = createExercise({
      word: targetWord,
      deck: localDeck,
      touch: 2,
      studyDay: "2026-01-01",
      attempt: 1,
    });

    if (exercise.kind !== "type_cloze") {
      throw new Error("Expected type_cloze.");
    }

    expect(exercise.prompt).toContain("_");
    expect(exercise.answer).toBe("assumed");
  });

  it("is deterministic for a fixed seed", () => {
    expect(create(1)).toEqual(create(1));
    expect(create(4)).toEqual(create(4));
  });
});
