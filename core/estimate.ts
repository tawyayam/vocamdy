import { addStudyDays } from "./day";

export type EstimateInput = {
  totalWords: number;
  introduced: number;
  dailyNew: number;
  newRemaining: number;
  studyDay: string;
  paused: boolean;
};

export type Estimate = {
  remaining: number;
  finishLearning: string | null;
  graduation: string | null;
};

export function estimateFinish(input: EstimateInput): Estimate {
  const remaining = Math.max(0, input.totalWords - input.introduced);

  if (input.paused || remaining === 0) {
    return { remaining, finishLearning: null, graduation: null };
  }

  const days = Math.ceil(remaining / input.dailyNew);
  const start = input.newRemaining > 0 ? input.studyDay : addStudyDays(input.studyDay, 1);
  const finishLearning = addStudyDays(start, days - 1);

  return {
    remaining,
    finishLearning,
    graduation: addStudyDays(finishLearning, 11),
  };
}
