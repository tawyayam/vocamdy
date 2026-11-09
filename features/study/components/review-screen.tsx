"use client";

import { useMemo, useRef, useState } from "react";
import { createExercise } from "@/core/exercises";
import { gradeTypedAnswer, isAnswerCorrect } from "@/core/grading";
import {
  answerReviewQueue,
  createReviewQueue,
  currentReviewItem,
  getReviewRoundProgress,
  isReviewBlockComplete,
  type ReviewQueueItem,
  type ReviewQueueState,
  type ReviewStage,
} from "@/core/review-queue";
import type { Deck, Exercise, Progress, Stage, Word } from "@/core/types";
import { submitExtraAttempt, submitReviewAnswer } from "../actions";
import { ExerciseView, type ExerciseFeedback } from "./exercise-view";
import type { QuizSaveState } from "./quiz-feedback";
import { SessionEmpty } from "./session-empty";

export type ReviewFinishedResult = {
  wrongCounts: Record<string, number>;
  progress: Progress[];
  answers: number;
};

type ReviewScreenProps = {
  reviews: Progress[];
  words: Word[];
  deck: Deck;
  studyDay: string;
  onFinished: (result: ReviewFinishedResult) => void;
};

type Round = {
  queue: ReviewQueueState;
  item: ReviewQueueItem | null;
  word: Word | null;
  exercise: Exercise | null;
};

type SavePayload =
  | {
      kind: "review";
      studyDay: string;
      wordId: string;
      expectedStage: ReviewStage;
      correct: boolean;
    }
  | {
      kind: "extra";
      studyDay: string;
      wordId: string;
    };

function makeRound(
  queue: ReviewQueueState,
  wordsById: Map<string, Word>,
  deck: Deck,
  studyDay: string,
): Round {
  const item = currentReviewItem(queue);

  if (!item) {
    return { queue, item: null, word: null, exercise: null };
  }

  const word = wordsById.get(item.wordId);

  if (!word) {
    return { queue, item: null, word: null, exercise: null };
  }

  return {
    queue,
    item,
    word,
    exercise: createExercise({
      word,
      deck,
      touch: (item.stage + 1) as Stage,
      studyDay,
      attempt: item.attempt,
    }),
  };
}

export function ReviewScreen({
  reviews,
  words,
  deck,
  studyDay,
  onFinished,
}: ReviewScreenProps) {
  const wordsById = useMemo(
    () => new Map(words.map((word) => [word.id, word])),
    [words],
  );
  const [round, setRound] = useState<Round>(() =>
    makeRound(
      createReviewQueue(
        reviews.filter((review) => wordsById.has(review.wordId)),
      ),
      wordsById,
      deck,
      studyDay,
    ),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");
  const [pendingSave, setPendingSave] = useState<SavePayload | null>(null);
  const progressRef = useRef(new Map<string, Progress>());
  const savedCountsRef = useRef({ answers: 0 });

  const exercise = round.exercise;
  const word = round.word;
  const roundProgress = getReviewRoundProgress(
    round.queue,
    reviews.length,
    round.item,
  );
  const secondTry = roundProgress.round === "second";
  const counter = `${roundProgress.completed} of ${roundProgress.total}`;
  const progressPercent =
    roundProgress.total === 0
      ? 0
      : Math.round((roundProgress.completed / roundProgress.total) * 100);
  const finish = isReviewBlockComplete(round.queue);
  const needsExitConfirmation =
    saveState === "saving" || saveState === "failed";

  async function saveAnswer(payload: SavePayload) {
    setSaveState("saving");
    setPendingSave(payload);

    try {
      const result =
        payload.kind === "review"
          ? await submitReviewAnswer(payload)
          : await submitExtraAttempt(payload);

      if (!result.ok) {
        setSaveState("failed");
        return;
      }

      if (!result.stale) {
        savedCountsRef.current = {
          answers: savedCountsRef.current.answers + 1,
        };
      }

      if (result.progress) {
        progressRef.current.set(result.progress.wordId, result.progress);
      }

      setSaveState("saved");
      setPendingSave(null);
    } catch (error) {
      console.error("Could not save the review answer.", error);
      setSaveState("failed");
    }
  }

  function submitAnswer(value: string | null) {
    if (!exercise || !word || !round.item || feedback) {
      return;
    }

    let correct = false;
    let formNote: string | null = null;

    if (exercise.kind === "type_definition" || exercise.kind === "type_cloze") {
      const result = gradeTypedAnswer(
        value,
        exercise.answer,
        word.word,
        word.cloze?.form,
      );
      correct = result.correct;
      formNote = result.formNote;
    } else {
      correct = value !== null && isAnswerCorrect(value, exercise.answer);
    }

    const payload: SavePayload =
      round.item.attempt === 2
        ? { kind: "extra", studyDay, wordId: word.id }
        : {
            kind: "review",
            studyDay,
            wordId: word.id,
            expectedStage: round.item.stage,
            correct,
          };

    setSelected(value);
    setTyped(value ?? "");
    setFeedback({ correct, answer: exercise.answer, formNote });
    setRound({
      ...round,
      queue: answerReviewQueue(round.queue, correct),
    });
    void saveAnswer(payload);
  }

  function continueReview() {
    if (saveState !== "saved") {
      return;
    }

    if (isReviewBlockComplete(round.queue)) {
      onFinished({
        wrongCounts: round.queue.wrongCounts,
        progress: [...progressRef.current.values()],
        answers: savedCountsRef.current.answers,
      });
      return;
    }

    setSelected(null);
    setTyped("");
    setFeedback(null);
    setSaveState("idle");
    setPendingSave(null);
    setRound(makeRound(round.queue, wordsById, deck, studyDay));
  }

  function retrySave() {
    if (pendingSave) {
      void saveAnswer(pendingSave);
    }
  }

  if (!exercise || !word) {
    return (
      <SessionEmpty
        title="No question in this review"
        description="Return to Today and start another session."
      />
    );
  }

  return (
    <ExerciseView
      exercise={exercise}
      word={word}
      title={secondTry ? "Second try" : "Review"}
      counter={counter}
      progressPercent={progressPercent}
      selected={selected}
      typed={typed}
      feedback={feedback}
      saveState={saveState}
      finish={finish}
      finishLabel="Finish review"
      needsExitConfirmation={needsExitConfirmation}
      onTypedChange={setTyped}
      onSubmit={submitAnswer}
      onContinue={continueReview}
      onRetry={retrySave}
    />
  );
}
