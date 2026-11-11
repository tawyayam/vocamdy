"use client";

import { useMemo, useRef, useState } from "react";
import { createExercise } from "@/core/exercises";
import { gradeTypedAnswer, isAnswerCorrect } from "@/core/grading";
import {
  answerQuiz,
  createQuiz,
  currentQuizItem,
  getWrongCount,
  isQuizComplete,
  type QuizState,
} from "@/core/quiz";
import type { Deck, Exercise, Progress, Word } from "@/core/types";
import { submitExtraAttempt, submitIntroducedWord } from "../actions";
import { useSaveQueue } from "../use-save-queue";
import { ExerciseView, type ExerciseFeedback } from "./exercise-view";
import { SessionEmpty } from "./session-empty";

export type QuizFinishedResult = {
  wrongCounts: Record<string, number>;
  introduced: Progress[];
  answers: number;
  newWords: number;
};

type QuizScreenProps = {
  words: Word[];
  deck: Deck;
  studyDay: string;
  onFinished: (result: QuizFinishedResult) => void;
};

type Round = {
  quiz: QuizState;
  word: Word | null;
  exercise: Exercise | null;
};

type SavePayload =
  | {
      kind: "introduce";
      studyDay: string;
      wordId: string;
      wrongCount: number;
    }
  | {
      kind: "extra";
      studyDay: string;
      wordId: string;
    };

const MAX_WRONG_COUNT = 50;

function makeRound(
  quiz: QuizState,
  wordsById: Map<string, Word>,
  deck: Deck,
  studyDay: string,
): Round {
  const item = currentQuizItem(quiz);

  if (!item) {
    return { quiz, word: null, exercise: null };
  }

  const word = wordsById.get(item.wordId);

  if (!word) {
    return { quiz, word: null, exercise: null };
  }

  return {
    quiz,
    word,
    exercise: createExercise({
      word,
      deck,
      touch: 1,
      studyDay,
      attempt: item.attempt,
    }),
  };
}

export function QuizScreen({
  words,
  deck,
  studyDay,
  onFinished,
}: QuizScreenProps) {
  const wordsById = useMemo(
    () => new Map(words.map((word) => [word.id, word])),
    [words],
  );
  const [round, setRound] = useState<Round>(() =>
    makeRound(
      createQuiz(words.map((word) => word.id)),
      wordsById,
      deck,
      studyDay,
    ),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
  const introducedRef = useRef(new Map<string, Progress>());
  const savedCountsRef = useRef({ answers: 0, newWords: 0 });
  const saveQueue = useSaveQueue<SavePayload>({
    save: (payload) =>
      payload.kind === "introduce"
        ? submitIntroducedWord(payload)
        : submitExtraAttempt(payload),
    onSaved: (payload, result) => {
      if (!result.stale) {
        savedCountsRef.current = {
          answers: savedCountsRef.current.answers + 1,
          newWords:
            savedCountsRef.current.newWords +
            (payload.kind === "introduce" ? 1 : 0),
        };
      }

      if (result.progress) {
        introducedRef.current.set(result.progress.wordId, result.progress);
      }
    },
  });

  const exercise = round.exercise;
  const word = round.word;
  const finish = isQuizComplete(round.quiz);
  const progressPercent =
    words.length === 0
      ? 0
      : Math.round((round.quiz.correctWordIds.length / words.length) * 100);
  const needsExitConfirmation = !saveQueue.isDrained;

  function submitAnswer(value: string | null) {
    if (!exercise || !word || feedback) {
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

    const payload: SavePayload = correct
      ? {
          kind: "introduce",
          studyDay,
          wordId: word.id,
          wrongCount: Math.min(
            getWrongCount(round.quiz, word.id),
            MAX_WRONG_COUNT,
          ),
        }
      : { kind: "extra", studyDay, wordId: word.id };

    setSelected(value);
    setTyped(value ?? "");
    setFeedback({ correct, answer: exercise.answer, formNote });
    setRound({ ...round, quiz: answerQuiz(round.quiz, correct) });
    saveQueue.enqueue(payload);
  }

  function continueQuiz() {
    if (saveQueue.isBlocked) {
      return;
    }

    if (isQuizComplete(round.quiz)) {
      if (!saveQueue.isDrained) {
        return;
      }

      onFinished({
        wrongCounts: round.quiz.wrongCounts,
        introduced: [...introducedRef.current.values()],
        answers: savedCountsRef.current.answers,
        newWords: savedCountsRef.current.newWords,
      });
      return;
    }

    setSelected(null);
    setTyped("");
    setFeedback(null);
    setRound(makeRound(round.quiz, wordsById, deck, studyDay));
  }

  if (!exercise || !word) {
    return (
      <SessionEmpty
        title="No questions in this batch"
        description="Return to Today and start another session."
      />
    );
  }

  return (
    <ExerciseView
      exercise={exercise}
      word={word}
      title="New words"
      counter={`${round.quiz.correctWordIds.length} of ${words.length}`}
      progressPercent={progressPercent}
      selected={selected}
      typed={typed}
      feedback={feedback}
      saveStatus={saveQueue.status}
      unsavedCount={saveQueue.unsavedCount}
      isDrained={saveQueue.isDrained}
      isBlocked={saveQueue.isBlocked}
      finish={finish}
      needsExitConfirmation={needsExitConfirmation}
      peekWords={words}
      onTypedChange={setTyped}
      onSubmit={submitAnswer}
      onContinue={continueQuiz}
      onRetry={saveQueue.retry}
    />
  );
}
