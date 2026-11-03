import { typedHint } from "./grading";
import type {
  ChoiceExercise,
  Deck,
  Exercise,
  MeaningDirection,
  Stage,
  TypedExercise,
  Word,
} from "./types";

export type CreateExerciseInput = {
  word: Word;
  deck: Deck;
  touch: Stage;
  studyDay: string;
  attempt: number;
};

const DISTRACTOR_COUNT = 3;

function hashSeed(value: string): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function buildSeed(wordId: string, studyDay: string, touch: Stage, attempt: number): number {
  return hashSeed(`${wordId}|${studyDay}|${touch}|${attempt}`);
}

function normalizeOption(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function orderedGroupIds(deck: Deck, targetGroup: string): string[] {
  const groupIds = deck.groups.map((group) => group.id);
  const targetIndex = groupIds.indexOf(targetGroup);

  if (targetIndex === -1) {
    return [targetGroup, ...groupIds];
  }

  return groupIds
    .map((id, index) => ({ id, index }))
    .sort((first, second) => {
      const distance = Math.abs(first.index - targetIndex) - Math.abs(second.index - targetIndex);
      return distance !== 0 ? distance : first.index - second.index;
    })
    .map((group) => group.id);
}

function candidateTiers(
  deck: Deck,
  target: Word,
  needArabic: boolean,
  targetArabic: string | null,
): Word[][] {
  const eligible = deck.words
    .filter((word) => word.id !== target.id)
    .filter((word) => {
      if (needArabic && !word.arabic) {
        return false;
      }

      if (word.arabic && targetArabic) {
        return normalizeOption(word.arabic) !== targetArabic;
      }

      return true;
    })
    .sort((first, second) => first.order - second.order);

  return orderedGroupIds(deck, target.group).map((groupId) =>
    eligible.filter((word) => word.group === groupId),
  );
}

function pickDistractors(
  deck: Deck,
  target: Word,
  needArabic: boolean,
  random: () => number,
): Word[] {
  const targetArabic = target.arabic ? normalizeOption(target.arabic) : null;
  const usedOptions = new Set<string>();
  const distractors: Word[] = [];

  for (const tier of candidateTiers(deck, target, needArabic, targetArabic)) {
    for (const word of shuffle(tier, random)) {
      if (distractors.length === DISTRACTOR_COUNT) {
        return distractors;
      }

      const option = needArabic ? word.arabic : word.word;

      if (!option) {
        continue;
      }

      const normalized = normalizeOption(option);

      if (usedOptions.has(normalized)) {
        continue;
      }

      usedOptions.add(normalized);
      distractors.push(word);
    }
  }

  return distractors;
}

function blankExample(word: Word): string | null {
  if (!word.example || !word.cloze) {
    return null;
  }

  const blank = "_".repeat(Math.max(1, word.cloze.form.length));
  return `${word.example.slice(0, word.cloze.start)}${blank}${word.example.slice(word.cloze.end)}`;
}

function makeChoice(
  word: Word,
  touch: Stage,
  kind: ChoiceExercise["kind"],
  prompt: string,
  answer: string,
  options: string[],
  random: () => number,
  direction?: MeaningDirection,
): ChoiceExercise {
  const uniqueOptions = [...new Set([answer, ...options])];

  return {
    wordId: word.id,
    touch,
    kind,
    prompt,
    answer,
    options: shuffle(uniqueOptions, random),
    ...(direction ? { direction } : {}),
  };
}

function makeTyped(
  word: Word,
  touch: Stage,
  kind: TypedExercise["kind"],
  prompt: string,
  answer: string,
): TypedExercise {
  return {
    wordId: word.id,
    touch,
    kind,
    prompt,
    answer,
    hint: typedHint(answer),
  };
}

function typedFallback(
  word: Word,
  touch: Stage,
  kind: ChoiceExercise["kind"],
  clozePrompt?: string,
): TypedExercise {
  if (kind === "choice_cloze" && clozePrompt && word.cloze) {
    return makeTyped(word, touch, "type_cloze", clozePrompt, word.cloze.form);
  }

  return makeTyped(word, touch, "type_definition", word.definition, word.word);
}

function choiceDefinition(
  word: Word,
  deck: Deck,
  touch: Stage,
  random: () => number,
): Exercise {
  const distractors = pickDistractors(deck, word, false, random);

  if (distractors.length === 0) {
    return typedFallback(word, touch, "choice_definition");
  }

  return makeChoice(
    word,
    touch,
    "choice_definition",
    word.definition,
    word.word,
    distractors.map((distractor) => distractor.word),
    random,
  );
}

function touchOneExercise(
  word: Word,
  deck: Deck,
  random: () => number,
): Exercise {
  if (!word.arabic) {
    return choiceDefinition(word, deck, 1, random);
  }

  const direction: MeaningDirection =
    random() < 0.5 ? "headword_to_arabic" : "arabic_to_headword";
  const distractors = pickDistractors(deck, word, true, random);

  if (distractors.length === 0) {
    return typedFallback(word, 1, "choice_meaning");
  }

  if (direction === "headword_to_arabic") {
    return makeChoice(
      word,
      1,
      "choice_meaning",
      word.word,
      word.arabic,
      distractors.flatMap((distractor) => (distractor.arabic ? [distractor.arabic] : [])),
      random,
      direction,
    );
  }

  return makeChoice(
    word,
    1,
    "choice_meaning",
    word.arabic,
    word.word,
    distractors.map((distractor) => distractor.word),
    random,
    direction,
  );
}

export function createExercise(input: CreateExerciseInput): Exercise {
  const { word, deck, touch, studyDay, attempt } = input;
  const random = createRandom(buildSeed(word.id, studyDay, touch, attempt));

  if (touch === 1) {
    return touchOneExercise(word, deck, random);
  }

  if (touch === 2) {
    const prompt = blankExample(word);

    if (!prompt) {
      return choiceDefinition(word, deck, 2, random);
    }

    const distractors = pickDistractors(deck, word, false, random);

    if (distractors.length === 0) {
      return typedFallback(word, 2, "choice_cloze", prompt);
    }

    return makeChoice(
      word,
      2,
      "choice_cloze",
      prompt,
      word.word,
      distractors.map((distractor) => distractor.word),
      random,
    );
  }

  if (touch === 3) {
    return makeTyped(word, 3, "type_definition", word.definition, word.word);
  }

  const prompt = blankExample(word);

  if (!prompt || !word.cloze) {
    return makeTyped(word, 4, "type_definition", word.definition, word.word);
  }

  return makeTyped(word, 4, "type_cloze", prompt, word.cloze.form);
}
