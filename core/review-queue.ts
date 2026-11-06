import type { Progress, Stage } from "./types";

export type ReviewStage = Exclude<Stage, 4>;

export type ReviewQueueItem = {
  wordId: string;
  stage: ReviewStage;
  attempt: 1 | 2;
};

export type ReviewQueueState = {
  queue: ReviewQueueItem[];
  wrongCounts: Record<string, number>;
};

function toReviewStage(stage: Stage): ReviewStage | null {
  return stage === 4 ? null : stage;
}

export function createReviewQueue(
  reviews: readonly Progress[],
): ReviewQueueState {
  const queue: ReviewQueueItem[] = [];

  for (const review of reviews) {
    const stage = toReviewStage(review.stage);

    if (stage !== null) {
      queue.push({ wordId: review.wordId, stage, attempt: 1 });
    }
  }

  return { queue, wrongCounts: {} };
}

export function currentReviewItem(
  state: ReviewQueueState,
): ReviewQueueItem | null {
  return state.queue[0] ?? null;
}

export function isReviewBlockComplete(state: ReviewQueueState): boolean {
  return state.queue.length === 0;
}

export function getReviewWrongCount(
  state: ReviewQueueState,
  wordId: string,
): number {
  return state.wrongCounts[wordId] ?? 0;
}

export type ReviewRoundProgress = {
  round: "first" | "second";
  completed: number;
  total: number;
};

export function getReviewRoundProgress(
  state: ReviewQueueState,
  originalTotal: number,
  current: ReviewQueueItem | null,
): ReviewRoundProgress {
  const firstRemaining = state.queue.filter(
    (item) => item.attempt === 1,
  ).length;
  const firstCompleted = Math.max(0, originalTotal - firstRemaining);
  const retryTotal = Object.values(state.wrongCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const retryRemaining = state.queue.filter(
    (item) => item.attempt === 2,
  ).length;
  const retryCompleted = Math.max(0, retryTotal - retryRemaining);

  if (current?.attempt === 2) {
    return {
      round: "second",
      completed: retryCompleted,
      total: retryTotal,
    };
  }

  return {
    round: "first",
    completed: firstCompleted,
    total: originalTotal,
  };
}

export function answerReviewQueue(
  state: ReviewQueueState,
  correct: boolean,
): ReviewQueueState {
  const current = currentReviewItem(state);

  if (!current) {
    return state;
  }

  const remaining = state.queue.slice(1);

  if (current.attempt === 1 && !correct) {
    return {
      queue: [...remaining, { ...current, attempt: 2 }],
      wrongCounts: {
        ...state.wrongCounts,
        [current.wordId]: getReviewWrongCount(state, current.wordId) + 1,
      },
    };
  }

  return { ...state, queue: remaining };
}
