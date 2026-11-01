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
