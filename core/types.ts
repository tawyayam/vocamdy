export type Cloze = {
  form: string;
  start: number;
  end: number;
};

export type Word = {
  id: string;
  deck: string;
  order: number;
  group: string;
  word: string;
  pos?: string;
  definition: string;
  example?: string;
  arabic?: string;
  cloze: Cloze | null;
};

export type Group = {
  id: string;
  label: string;
  count: number;
};

export type Deck = {
  id: string;
  name: string;
  groups: Group[];
  words: Word[];
};

export type DeckConfig = {
  id: string;
  name: string;
  file: string;
  groupLabel?: string;
  columns: {
    word: string;
    definition: string;
    group?: string;
    pos?: string;
    example?: string;
    arabic?: string;
    blankForm?: string;
  };
};

export type Stage = 1 | 2 | 3 | 4;

export type Completion = "full" | "mini";

export type Progress = {
  wordId: string;
  deckId: string;
  stage: Stage;
  dueDate: string | null;
  introducedOn: string;
  graduatedOn: string | null;
  correctCount: number;
  wrongCount: number;
  lastAnsweredOn: string | null;
};

export type Activity = {
  studyDay: string;
  answersCount: number;
  newWordsCount: number;
  reviewsCount: number;
  completed: Completion | null;
};

export type Settings = {
  activeDeckId: string;
  dailyNew: number;
  batchSize: number;
  backlogCap: number;
};

export type ExerciseKind =
  | "choice_meaning"
  | "choice_definition"
  | "choice_cloze"
  | "type_definition"
  | "type_cloze";

export type MeaningDirection = "headword_to_arabic" | "arabic_to_headword";

type ExerciseBase = {
  wordId: string;
  touch: Stage;
  prompt: string;
  answer: string;
};

export type ChoiceExercise = ExerciseBase & {
  kind: "choice_meaning" | "choice_definition" | "choice_cloze";
  options: string[];
  direction?: MeaningDirection;
};

export type TypedExercise = ExerciseBase & {
  kind: "type_definition" | "type_cloze";
  hint: string;
};

export type Exercise = ChoiceExercise | TypedExercise;

export type TodayStatus = "start" | "continue" | "complete" | "paused" | "deck-complete";

export type TomorrowPreview = {
  newWords: number;
  reviews: number;
};

export type TodayState = {
  studyDay: string;
  status: TodayStatus;
  dueReviews: Progress[];
  overdueCount: number;
  introducedToday: number;
  newRemaining: number;
  newWords: Word[];
  tomorrow: TomorrowPreview;
  isComplete: boolean;
};
