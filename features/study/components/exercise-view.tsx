"use client";

import { Eye } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  choiceIndexForNumberKey,
  moveChoiceIndex,
} from "@/core/choice-navigation";
import type { SaveQueueStatus } from "@/core/save-queue";
import type { ChoiceExercise, Exercise, Word } from "@/core/types";
import { PeekSheet } from "./peek-sheet";
import { QuizFeedback } from "./quiz-feedback";
import { SaveFailureBanner, SaveStatus } from "./save-status";
import { SessionExit } from "./session-exit";

export type ExerciseFeedback = {
  correct: boolean;
  answer: string;
  formNote: string | null;
};

type ExerciseViewProps = {
  exercise: Exercise;
  word: Word;
  title: string;
  counter: string;
  progressPercent: number;
  selected: string | null;
  typed: string;
  feedback: ExerciseFeedback | null;
  saveStatus: SaveQueueStatus;
  unsavedCount: number;
  isDrained: boolean;
  isBlocked: boolean;
  finish: boolean;
  finishLabel?: string;
  needsExitConfirmation: boolean;
  peekWords?: Word[];
  onTypedChange: (value: string) => void;
  onSubmit: (value: string | null) => void;
  onContinue: () => void;
  onRetry: () => void;
};

function isChoiceExercise(exercise: Exercise | null): exercise is ChoiceExercise {
  return (
    exercise?.kind === "choice_meaning" ||
    exercise?.kind === "choice_definition" ||
    exercise?.kind === "choice_cloze"
  );
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

export function ExerciseView({
  exercise,
  word,
  title,
  counter,
  progressPercent,
  selected,
  typed,
  feedback,
  saveStatus,
  unsavedCount,
  isDrained,
  isBlocked,
  finish,
  finishLabel,
  needsExitConfirmation,
  peekWords,
  onTypedChange,
  onSubmit,
  onContinue,
  onRetry,
}: ExerciseViewProps) {
  const [peekOpen, setPeekOpen] = useState(false);
  const typedInputRef = useRef<HTMLInputElement>(null);
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const choiceExercise = isChoiceExercise(exercise) ? exercise : null;
  const typedExercise =
    exercise.kind === "type_definition" || exercise.kind === "type_cloze"
      ? exercise
      : null;
  const promptIsArabic =
    exercise.kind === "choice_meaning" &&
    exercise.direction === "arabic_to_headword";
  const optionsAreArabic =
    exercise.kind === "choice_meaning" &&
    exercise.direction === "headword_to_arabic";

  useEffect(() => {
    if (typedExercise) {
      typedInputRef.current?.focus();
    } else {
      choiceRefs.current[0]?.focus();
    }
  }, [exercise, typedExercise]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (peekOpen) {
        return;
      }

      if (feedback) {
        const target = event.target;
        const onControl =
          target instanceof HTMLElement &&
          target.closest("button, a, input, textarea, select") !== null;

        if (event.key === "Enter" && !onControl) {
          event.preventDefault();
          onContinue();
        }

        return;
      }

      if (!choiceExercise) {
        return;
      }

      const index = choiceIndexForNumberKey(
        event.key,
        choiceExercise.options.length,
      );

      if (index !== null) {
        event.preventDefault();
        onSubmit(choiceExercise.options[index]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleChoiceKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (
      !choiceExercise ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) {
      return;
    }

    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = moveChoiceIndex(
      index,
      step,
      choiceExercise.options.length,
    );

    if (nextIndex >= 0) {
      choiceRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      <header className="flex items-center gap-3">
        <SessionExit needsConfirmation={needsExitConfirmation} />
        <div className="flex-1">
          <p className="text-sm text-muted">{title}</p>
          <p className="text-sm text-muted">{counter}</p>
        </div>
        <SaveStatus status={saveStatus} />
        {peekWords ? (
          <button
            type="button"
            onClick={() => setPeekOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Eye aria-hidden="true" className="h-4 w-4" />
            Peek
          </button>
        ) : null}
      </header>

      <div
        role="progressbar"
        aria-label="Exercise progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {saveStatus === "failed" ? (
        <SaveFailureBanner unsavedCount={unsavedCount} onRetry={onRetry} />
      ) : null}

      <section className="mt-5 min-w-0 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {promptLabel(exercise)}
        </p>
        <h1
          dir={promptIsArabic ? "rtl" : undefined}
          lang={promptIsArabic ? "ar" : undefined}
          className={
            promptIsArabic
              ? "mt-3 break-words font-arabic text-2xl font-semibold text-ink"
              : "mt-3 break-words font-serif text-2xl font-semibold text-ink"
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
                  ref={(element) => {
                    choiceRefs.current[index] = element;
                  }}
                  type="button"
                  disabled={feedback !== null}
                  onClick={() => onSubmit(option)}
                  onKeyDown={(event) => handleChoiceKeyDown(event, index)}
                  dir={optionsAreArabic ? "rtl" : undefined}
                  lang={optionsAreArabic ? "ar" : undefined}
                  className={
                    optionsAreArabic
                      ? `flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-right font-arabic text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${optionClass}`
                      : `flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${optionClass}`
                  }
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words">{option}</span>
                </button>
              );
            })}
          </div>
        ) : typedExercise ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(typed.trim() ? typed : null);
            }}
            className="mt-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <label htmlFor="exercise-answer" className="text-sm text-muted">
                Your answer
              </label>
              <p id="exercise-hint" className="text-sm text-muted">
                Hint: <span className="font-mono">{typedExercise.hint}</span>
              </p>
            </div>
            <input
              ref={typedInputRef}
              id="exercise-answer"
              type="text"
              value={typed}
              onChange={(event) => onTypedChange(event.target.value)}
              disabled={feedback !== null}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="exercise-hint"
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-paper px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:text-muted"
            />
            <button
              type="submit"
              disabled={feedback !== null}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Check
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={() => onSubmit(null)}
          disabled={feedback !== null}
          className="mt-3 min-h-11 w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          I don&apos;t know
        </button>

        {feedback ? (
          <QuizFeedback
            correct={feedback.correct}
            answer={feedback.answer}
            formNote={feedback.formNote}
            word={word}
            saveStatus={saveStatus}
            finish={finish}
            finishLabel={finishLabel}
            isDrained={isDrained}
            isBlocked={isBlocked}
            onContinue={onContinue}
          />
        ) : null}
      </section>

      {peekWords ? (
        <PeekSheet
          words={peekWords}
          open={peekOpen}
          onClose={() => setPeekOpen(false)}
        />
      ) : null}
    </div>
  );
}
