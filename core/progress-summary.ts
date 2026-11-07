import type { Group, Progress } from "./types";

export type ProgressDeckWord = {
  id: string;
  group: string;
};

export type ProgressDeck = {
  groups: readonly Group[];
  words: readonly ProgressDeckWord[];
};

export type StatusCounts = {
  new: number;
  learning: number;
  graduated: number;
  introduced: number;
  total: number;
};

export type GroupProgress = {
  id: string;
  label: string;
  introduced: number;
  total: number;
  correct: number;
  wrong: number;
  accuracyPercent: number | null;
};

export type ProgressSummary = {
  counts: StatusCounts;
  groups: GroupProgress[];
  currentGroupLabel: string;
};

function currentGroupLabel(groups: readonly Group[], introduced: number): string {
  let cumulative = 0;

  for (const group of groups) {
    cumulative += group.count;

    if (introduced < cumulative) {
      return group.label;
    }
  }

  return groups.at(-1)?.label ?? "Deck";
}

export function summarizeProgress(
  deck: ProgressDeck,
  progress: readonly Progress[],
): ProgressSummary {
  const progressByWordId = new Map(
    progress.map((item) => [item.wordId, item]),
  );
  const groupStats = new Map(
    deck.groups.map((group) => [
      group.id,
      { introduced: 0, correct: 0, wrong: 0 },
    ]),
  );
  let introduced = 0;
  let learning = 0;
  let graduated = 0;

  for (const word of deck.words) {
    const item = progressByWordId.get(word.id);

    if (!item) {
      continue;
    }

    introduced += 1;

    if (item.stage === 4) {
      graduated += 1;
    } else {
      learning += 1;
    }

    const stats = groupStats.get(word.group);

    if (stats) {
      stats.introduced += 1;
      stats.correct += item.correctCount;
      stats.wrong += item.wrongCount;
    }
  }

  const groups = deck.groups.map((group) => {
    const stats = groupStats.get(group.id) ?? {
      introduced: 0,
      correct: 0,
      wrong: 0,
    };
    const answers = stats.correct + stats.wrong;

    return {
      id: group.id,
      label: group.label,
      introduced: stats.introduced,
      total: group.count,
      correct: stats.correct,
      wrong: stats.wrong,
      accuracyPercent:
        answers === 0 ? null : Math.round((stats.correct / answers) * 100),
    };
  });
  const total = deck.words.length;

  return {
    counts: {
      new: Math.max(0, total - introduced),
      learning,
      graduated,
      introduced,
      total,
    },
    groups,
    currentGroupLabel: currentGroupLabel(deck.groups, introduced),
  };
}
