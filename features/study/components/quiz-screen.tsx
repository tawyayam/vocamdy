"use client";

import { Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  ChoiceExercise,
  Deck,
  Exercise,
  Progress,
  Word,
} from "@/core/types";
import { submitExtraAttempt, submitIntroducedWord } from "../actions";
import { PeekSheet } from "./peek-sheet";
import { QuizFeedback, type QuizSaveState } from "./quiz-feedback";
import { SessionExit } from "./session-exit";

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

type Feedback = {
  correct: boolean;
  answer: string;
  formNote: string | null;
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

function isChoiceExercise(exercise: Exercise | null): exercise is ChoiceExercise {
  return (
    exercise?.kind === "choice_meaning" ||
    exercise?.kind === "choice_definition" ||
    exercise?.kind === "choice_cloze"
  );
}

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

function promptLabel(exercise: Exercise): string {
  if (exercise.kind === "choice_meaning") {
    return "Choose the meaning";
  }

  if (exercise.kind === "choice_definition") {
    return "Choose the word";
  }

  if (exercise.kind === "choice_cloze") {
    return "Choose the missing word";
  }

  if (exercise.kind === "type_cloze") {
    return "Complete the sentence";
  }

  return "Type the word";
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
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");
  const [pendingSave, setPendingSave] = useState<SavePayload | null>(null);
  const [peekOpen, setPeekOpen] = useState(false);
  const typedInputRef = useRef<HTMLInputElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const introducedRef = useRef(new Map<string, Progress>());
  const savedCountsRef = useRef({ answers: 0, newWords: 0 });

  const exercise = round.exercise;
  const word = round.word;
  const choiceExercise = isChoiceExercise(exercise) ? exercise : null;
  const typedExercise =
    exercise?.kind === "type_definition" || exercise?.kind === "type_cloze"
      ? exercise
      : null;
  const promptIsArabic =
    exercise?.kind === "choice_meaning" &&
    exercise.direction === "arabic_to_headword";
  const optionsAreArabic =
    exercise?.kind === "choice_meaning" &&
    exercise.direction === "headword_to_arabic";
  const finish = isQuizComplete(round.quiz);
  const progressPercent =
    words.length === 0
      ? 0
      : Math.round((round.quiz.correctWordIds.length / words.length) * 100);
  const needsExitConfirmation =
    saveState === "saving" || saveState === "failed";

  useEffect(() => {
    if (typedExercise) {
      typedInputRef.current?.focus();
    } else {
      firstChoiceRef.current?.focus();
    }
  }, [round.exercise, typedExercise]);

  async function saveAnswer(payload: SavePayload) {
    setSaveState("saving");
    setPendingSave(payload);

    try {
      const result =
        payload.kind === "introduce"
          ? await submitIntroducedWord(payload)
          : await submitExtraAttempt(payload);

      if (!result.ok) {
        setSaveState("failed");
        return;
      }

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

      setSaveState("saved");
      setPendingSave(null);
    } catch (error) {
      console.error("Could not save the quiz answer.", error);
      setSaveState("failed");
    }
  }

  function submitAnswer(value: string | null) {
    if (!exercise || !word || feedback) {
      return;
    }

    let correct = false;
    let formNote: string | null = null;

    if (typedExercise) {
      const result = gradeTypedAnswer(
        value,
        typedExercise.answer,
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
    void saveAnswer(payload);
  }

  function continueQuiz() {
    if (saveState !== "saved") {
      return;
    }

    if (isQuizComplete(round.quiz)) {
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
    setSaveState("idle");
    setPendingSave(null);
    setRound(makeRound(round.quiz, wordsById, deck, studyDay));
  }

  function retrySave() {
    if (pendingSave) {
      void saveAnswer(pendingSave);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (peekOpen) {
        return;
      }

      if (feedback) {
        if (event.key === "Enter" && saveState === "saved") {
          event.preventDefault();
          continueQuiz();
        }

        return;
      }

      if (!choiceExercise) {
        return;
      }

      const index = Number.parseInt(event.key, 10);

      if (
        Number.isInteger(index) &&
        index >= 1 &&
        index <= choiceExercise.options.length
      ) {
        event.preventDefault();
        submitAnswer(choiceExercise.options[index - 1]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!exercise || !word) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-4 py-6">
        <p className="text-sm text-muted">This batch has no quiz questions.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      <header className="flex items-center gap-3">
        <SessionExit needsConfirmation={needsExitConfirmation} />
        <div className="flex-1">
          <p className="text-sm text-muted">New words</p>
          <p className="text-sm text-muted">
            {round.quiz.correctWordIds.length} of {words.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPeekOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          Peek
        </button>
      </header>

      <div
        role="progressbar"
        aria-label="Batch progress"
        aria-valuemin={0}
        aria-valuemax={words.length}
        aria-valuenow={round.quiz.correctWordIds.length}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {promptLabel(exercise)}
        </p>
        <h1
          dir={promptIsArabic ? "rtl" : undefined}
          lang={promptIsArabic ? "ar" : undefined}
          className={
            promptIsArabic
              ? "mt-3 font-arabic text-2xl font-semibold text-ink"
              : "mt-3 font-serif text-2xl font-semibold text-ink"
          }
        >
          {exercise.prompt}
        </h1>

        {choiceExercise ? (
          <div className="mt-5 grid gap-2">
            {choiceExercise.options.map((option, index) => {
              const isSelected = selected === option;
              const isAnswer = feedback?.answer === option;
              let optionClass =
                "border-border bg-paper text-ink hover:border-primary/40";

              if (feedback) {
                if (isAnswer) {
                  optionClass = "border-success/40 bg-success/10 text-ink";
                } else if (isSelected) {
                  optionClass = "border-warn/40 bg-warn/10 text-ink";
                } else {
                  optionClass = "border-border bg-paper text-muted";
                }
              }

              return (
                <button
                  key={option}
                  ref={index === 0 ? firstChoiceRef : undefined}
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => submitAnswer(option)}
                  dir={optionsAreArabic ? "rtl" : undefined}
                  lang={optionsAreArabic ? "ar" : undefined}
                  className={
                    optionsAreArabic
                      ? `flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-right font-arabic text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default ${optionClass}`
                      : `flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default ${optionClass}`
                  }
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs">
                    {index + 1}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        ) : typedExercise ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitAnswer(typed.trim() ? typed : null);
            }}
            className="mt-5"
          >
            <label htmlFor="quiz-answer" className="text-sm text-muted">
              Hint: <span className="font-mono">{typedExercise.hint}</span>
            </label>
            <input
              ref={typedInputRef}
              id="quiz-answer"
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              disabled={feedback !== null}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-paper px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary disabled:cursor-default disabled:text-muted"
            />
            <button
              type="submit"
              disabled={feedback !== null}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Check
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => submitAnswer(null)}
          disabled={feedback !== null}
          className="mt-3 min-h-11 w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          I don&apos;t know
        </button>

        {feedback ? (
          <QuizFeedback
            correct={feedback.correct}
            answer={feedback.answer}
            formNote={feedback.formNote}
            word={word}
            saveState={saveState}
            finish={finish}
            onRetry={retrySave}
            onContinue={continueQuiz}
          />
        ) : null}
      </section>

      <PeekSheet
        words={words}
        open={peekOpen}
        onClose={() => setPeekOpen(false)}
      />
    </div>
  );
}
