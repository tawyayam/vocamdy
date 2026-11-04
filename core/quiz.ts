export type QuizItem = {
  wordId: string;
  attempt: number;
};

export type QuizState = {
  queue: QuizItem[];
  wrongCounts: Record<string, number>;
  correctWordIds: string[];
};

export function createQuiz(wordIds: readonly string[]): QuizState {
  return {
    queue: [...new Set(wordIds)].map((wordId) => ({ wordId, attempt: 1 })),
    wrongCounts: {},
    correctWordIds: [],
  };
}

export function currentQuizItem(state: QuizState): QuizItem | null {
  return state.queue[0] ?? null;
}

export function getWrongCount(state: QuizState, wordId: string): number {
  return state.wrongCounts[wordId] ?? 0;
}

export function isQuizComplete(state: QuizState): boolean {
  return state.queue.length === 0;
}

export function answerQuiz(state: QuizState, correct: boolean): QuizState {
  const current = currentQuizItem(state);

  if (!current) {
    return state;
  }

  const remaining = state.queue.slice(1);

  if (correct) {
    return {
      ...state,
      queue: remaining,
      correctWordIds: [...state.correctWordIds, current.wordId],
    };
  }

  return {
    ...state,
    queue: [
      ...remaining,
      { wordId: current.wordId, attempt: current.attempt + 1 },
    ],
    wrongCounts: {
      ...state.wrongCounts,
      [current.wordId]: getWrongCount(state, current.wordId) + 1,
    },
  };
}
