import { addStudyDays } from "./day";
import type { Progress, Stage } from "./types";

export type IntroduceWordInput = {
  wordId: string;
  deckId: string;
  studyDay: string;
  wrongCount: number;
};

export type TouchOneAnswerInput = IntroduceWordInput & {
  correct: boolean;
};

export type ReviewAnswerInput = {
  progress: Progress;
  correct: boolean;
  studyDay: string;
  firstAttempt: boolean;
};

export function introduceWord(input: IntroduceWordInput): Progress {
  return {
    wordId: input.wordId,
    deckId: input.deckId,
    stage: 1,
    dueDate: addStudyDays(input.studyDay, 1),
    introducedOn: input.studyDay,
    graduatedOn: null,
    correctCount: 1,
    wrongCount: Math.max(0, input.wrongCount),
    lastAnsweredOn: input.studyDay,
  };
}

export function answerTouchOne(input: TouchOneAnswerInput): Progress | null {
  if (!input.correct) {
    return null;
  }

  return introduceWord(input);
}

export function answerReview(input: ReviewAnswerInput): Progress {
  const { progress, correct, studyDay, firstAttempt } = input;

  if (!firstAttempt || progress.stage === 4) {
    return progress;
  }

  if (!correct) {
    return {
      ...progress,
      dueDate: addStudyDays(studyDay, 1),
      graduatedOn: null,
      wrongCount: progress.wrongCount + 1,
      lastAnsweredOn: studyDay,
    };
  }

  const nextStage = (progress.stage + 1) as Stage;

  if (nextStage === 4) {
    return {
      ...progress,
      stage: 4,
      dueDate: null,
      graduatedOn: studyDay,
      correctCount: progress.correctCount + 1,
      lastAnsweredOn: studyDay,
    };
  }

  const interval = nextStage === 2 ? 3 : 7;

  return {
    ...progress,
    stage: nextStage,
    dueDate: addStudyDays(studyDay, interval),
    graduatedOn: null,
    correctCount: progress.correctCount + 1,
    lastAnsweredOn: studyDay,
  };
}
