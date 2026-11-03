import { addStudyDays, compareStudyDays } from "./day";
import type {
  Activity,
  Deck,
  Progress,
  Settings,
  TodayState,
  TodayStatus,
  TomorrowPreview,
  Word,
} from "./types";

export type PlannerInput = {
  deck: Deck;
  progress: Progress[];
  activity: Activity | null;
  settings: Settings;
  studyDay: string;
};

export type MiniSession = {
  reviews: Progress[];
  newWords: Word[];
};

const MINI_REVIEW_LIMIT = 10;

type DueProgress = Progress & { dueDate: string };

function sortDueReviews(
  progress: Progress[],
  studyDay: string,
  wordOrder: Map<string, number>,
): DueProgress[] {
  return progress
    .filter(
      (item): item is DueProgress =>
        item.stage < 4 && item.dueDate !== null && item.dueDate <= studyDay,
    )
    .sort((first, second) => {
      const byDueDate = compareStudyDays(first.dueDate, second.dueDate);

      if (byDueDate !== 0) {
        return byDueDate;
      }

      if (first.stage !== second.stage) {
        return second.stage - first.stage;
      }

      return (wordOrder.get(first.wordId) ?? 0) - (wordOrder.get(second.wordId) ?? 0);
    });
}

function buildTomorrowPreview(
  deck: Deck,
  progress: Progress[],
  settings: Settings,
  studyDay: string,
  unintroducedCount: number,
  newRemaining: number,
): TomorrowPreview {
  const tomorrow = addStudyDays(studyDay, 1);
  const reviewsTomorrow = progress.filter(
    (item) => item.stage < 4 && item.dueDate === tomorrow,
  ).length;
  const leftAfterToday = Math.max(0, unintroducedCount - newRemaining);
  const newWords = Math.min(settings.dailyNew, leftAfterToday);

  return {
    newWords,
    reviews: reviewsTomorrow + newRemaining,
  };
}

export function buildTodayState(input: PlannerInput): TodayState {
  const { deck, progress, activity, settings, studyDay } = input;
  const progressByWordId = new Map(progress.map((item) => [item.wordId, item]));
  const wordOrder = new Map(deck.words.map((word) => [word.id, word.order]));
  const dueReviews = sortDueReviews(progress, studyDay, wordOrder);
  const overdueCount = dueReviews.filter((item) => item.dueDate < studyDay).length;
  const paused = overdueCount > settings.backlogCap;
  const introducedToday = progress.filter((item) => item.introducedOn === studyDay).length;
  const unintroducedWords = deck.words
    .filter((word) => !progressByWordId.has(word.id))
    .sort((first, second) => first.order - second.order);
  const newRemaining = paused
    ? 0
    : Math.min(
        Math.max(0, settings.dailyNew - introducedToday),
        unintroducedWords.length,
      );
  const newWords = unintroducedWords.slice(0, newRemaining);
  const isComplete = dueReviews.length === 0 && newRemaining === 0;
  const deckComplete = deck.words.every(
    (word) => progressByWordId.get(word.id)?.stage === 4,
  );
  const hasAnswers =
    (activity?.answersCount ?? 0) > 0 ||
    activity?.completed === "mini" ||
    activity?.completed === "full";

  let status: TodayStatus = "start";

  if (paused) {
    status = "paused";
  } else if (deckComplete) {
    status = "deck-complete";
  } else if (isComplete) {
    status = "complete";
  } else if (hasAnswers) {
    status = "continue";
  }

  return {
    studyDay,
    status,
    dueReviews,
    overdueCount,
    introducedToday,
    newRemaining,
    newWords,
    tomorrow: buildTomorrowPreview(
      deck,
      progress,
      settings,
      studyDay,
      unintroducedWords.length,
      newRemaining,
    ),
    isComplete,
  };
}

export function planMiniSession(state: TodayState, batchSize: number): MiniSession {
  const reviews = state.dueReviews.slice(0, MINI_REVIEW_LIMIT);
  const newWords =
    state.status === "paused" || reviews.length === MINI_REVIEW_LIMIT
      ? []
      : state.newWords.slice(0, batchSize);

  return { reviews, newWords };
}

export function splitIntoBatches<T>(items: readonly T[], batchSize: number): T[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("Batch size must be a positive integer.");
  }

  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
}
