"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudyDay } from "@/core/day";
import {
  buildTodayState,
  planAfterReviewBlock,
  planMiniSession,
  planNewBatch,
} from "@/core/planner";
import type { Completion, Deck, Progress, TodayState, Word } from "@/core/types";
import { completeStudyDay } from "../actions";
import type { SessionData } from "../session-data";
import { BatchSummaryScreen } from "./batch-summary-screen";
import {
  CompletionScreen,
  type CompletionSaveState,
} from "./completion-screen";
import { LearnScreen } from "./learn-screen";
import { QuizScreen, type QuizFinishedResult } from "./quiz-screen";
import {
  ReviewScreen,
  type ReviewFinishedResult,
} from "./review-screen";
import { ReviewSummaryScreen } from "./review-summary-screen";
import { SessionEmpty } from "./session-empty";
import { SessionSkeleton } from "./session-skeleton";

export type SessionMode = "full" | "mini";

type SessionViewProps = {
  data: SessionData;
  mode: SessionMode;
};

type Phase =
  | "review"
  | "review-summary"
  | "learn"
  | "quiz"
  | "summary"
  | "completion";

function poolWordToWord(
  poolWord: SessionData["pool"][number],
  deckId: string,
): Word {
  return {
    id: poolWord.id,
    deck: deckId,
    order: poolWord.order,
    group: poolWord.group,
    word: poolWord.word,
    definition: "",
    ...(poolWord.arabic ? { arabic: poolWord.arabic } : {}),
    cloze: null,
  };
}

function buildExerciseDeck(data: SessionData): Deck {
  const candidateIds = new Set(data.candidates.map((word) => word.id));
  const lightWords = data.pool
    .filter((word) => !candidateIds.has(word.id))
    .map((word) => poolWordToWord(word, data.deck.id));

  return {
    id: data.deck.id,
    name: data.deck.name,
    groups: data.deck.groups,
    words: [...data.candidates, ...lightWords],
  };
}

function getSessionNotice(
  state: TodayState,
  batchCount: number,
): string | null {
  if (state.status === "deck-complete") {
    return "deck-complete";
  }

  if (state.status === "complete") {
    return "complete";
  }

  if (batchCount === 0 && state.dueReviews.length === 0) {
    return "complete";
  }

  return null;
}

function mergeProgress(
  current: Progress[],
  introduced: Progress[],
): Progress[] {
  if (introduced.length === 0) {
    return current;
  }

  const byWordId = new Map(current.map((item) => [item.wordId, item]));

  for (const item of introduced) {
    byWordId.set(item.wordId, item);
  }

  return [...byWordId.values()];
}

async function saveCompletion(
  studyDay: string,
  completion: Completion,
): Promise<CompletionSaveState> {
  try {
    const result = await completeStudyDay({
      kind: "completion",
      studyDay,
      completion,
    });

    return result.ok ? "saved" : "failed";
  } catch (error) {
    console.error("Could not save the day completion.", error);
    return "failed";
  }
}

export function SessionView({ data, mode }: SessionViewProps) {
  const router = useRouter();
  const [initialData] = useState(data);
  const [studyDay, setStudyDay] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [progress, setProgress] = useState<Progress[]>(
    () => initialData.progress,
  );
  const [batchWords, setBatchWords] = useState<Word[] | null>(null);
  const [batchIsLastForDay, setBatchIsLastForDay] = useState(false);
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});
  const reviewWords = initialData.reviewWords;
  const [reviewResult, setReviewResult] =
    useState<ReviewFinishedResult | null>(null);
  const [sessionCounts, setSessionCounts] = useState({
    answers: 0,
    newWords: 0,
  });
  const [completionSaveState, setCompletionSaveState] =
    useState<CompletionSaveState>("idle");
  const completionSavedRef = useRef(false);
  const completionPromiseRef = useRef<Promise<CompletionSaveState> | null>(
    null,
  );

  useEffect(() => {
    const update = () => setStudyDay(getStudyDay(new Date()));
    update();
  }, []);

  const exerciseDeck = useMemo(() => buildExerciseDeck(initialData), [initialData]);
  const initialState = useMemo(
    () =>
      studyDay
        ? buildTodayState({
            deck: exerciseDeck,
            progress: initialData.progress,
            activity: null,
            settings: initialData.settings,
            studyDay,
          })
        : null,
    [exerciseDeck, initialData.progress, initialData.settings, studyDay],
  );
  const initialMini = useMemo(
    () =>
      initialState
        ? planMiniSession(initialState, initialData.settings.batchSize)
        : null,
    [initialData.settings.batchSize, initialState],
  );
  const initialReviews = useMemo(
    () =>
      mode === "mini"
        ? (initialMini?.reviews ?? [])
        : (initialState?.dueReviews ?? []),
    [initialMini, initialState, mode],
  );
  const initialBatchPlan = useMemo(() => {
    if (!initialState) {
      return null;
    }

    return planNewBatch({
      candidates: initialData.candidates,
      introducedToday: initialState.introducedToday,
      dailyNew: initialData.settings.dailyNew,
      batchSize: initialData.settings.batchSize,
    });
  }, [
    initialData.candidates,
    initialData.settings.batchSize,
    initialData.settings.dailyNew,
    initialState,
  ]);
  const miniBatch = initialMini?.newWords ?? [];
  const initialBatch =
    mode === "mini"
      ? miniBatch.length > 0
        ? miniBatch
        : null
      : (initialBatchPlan?.words ?? null);
  const notice = initialState
    ? getSessionNotice(initialState, initialBatch?.length ?? 0)
    : null;
  const progressIds = useMemo(
    () => new Set(progress.map((item) => item.wordId)),
    [progress],
  );
  const candidatesRemaining = useMemo(
    () =>
      initialData.candidates.filter((word) => !progressIds.has(word.id)),
    [initialData.candidates, progressIds],
  );
  const state = useMemo(
    () =>
      studyDay
        ? buildTodayState({
            deck: exerciseDeck,
            progress,
            activity: null,
            settings: initialData.settings,
            studyDay,
          })
        : null,
    [exerciseDeck, initialData.settings, progress, studyDay],
  );
  const initialActivity = useMemo(
    () =>
      studyDay
        ? (initialData.activities.find(
            (item) => item.studyDay === studyDay,
          ) ?? null)
        : null,
    [initialData.activities, studyDay],
  );
  const nextExtraBatch = useMemo(() => {
    if (mode === "mini" || !state) {
      return [];
    }

    return planNewBatch({
      candidates: candidatesRemaining,
      introducedToday: state.introducedToday,
      dailyNew: initialData.settings.dailyNew,
      batchSize: initialData.settings.batchSize,
      mode: "extra",
    }).words;
  }, [
    candidatesRemaining,
    initialData.settings.batchSize,
    initialData.settings.dailyNew,
    mode,
    state,
  ]);
  const nextRequiredPlan = useMemo(() => {
    if (mode === "mini" || !state) {
      return null;
    }

    return planAfterReviewBlock({
      state,
      candidates: candidatesRemaining,
      dailyNew: initialData.settings.dailyNew,
      batchSize: initialData.settings.batchSize,
    });
  }, [
    candidatesRemaining,
    initialData.settings.batchSize,
    initialData.settings.dailyNew,
    mode,
    state,
  ]);
  const nextRequiredBatch = nextRequiredPlan?.nextBatch.words ?? [];
  const reviewCompletesDay = nextRequiredPlan?.completesDay ?? false;
  const reviewWordIds = useMemo(
    () => new Set(reviewWords.map((word) => word.id)),
    [reviewWords],
  );
  const validReviews = useMemo(
    () => initialReviews.filter((review) => reviewWordIds.has(review.wordId)),
    [initialReviews, reviewWordIds],
  );
  const validReviewWordIds = useMemo(
    () => new Set(validReviews.map((review) => review.wordId)),
    [validReviews],
  );
  const reviewSummaryWords = useMemo(
    () => reviewWords.filter((word) => validReviewWordIds.has(word.id)),
    [reviewWords, validReviewWordIds],
  );
  const activeBatch = batchWords ?? initialBatch;
  const activeBatchIsLastForDay =
    batchWords === null
      ? (initialBatchPlan?.isLastForDay ?? false)
      : batchIsLastForDay;
  const answersToday =
    (initialActivity?.answersCount ?? 0) + sessionCounts.answers;
  const newWordsToday = Math.max(
    state?.introducedToday ?? 0,
    (initialActivity?.newWordsCount ?? 0) + sessionCounts.newWords,
  );
  const canLearnMore =
    mode === "full" &&
    state?.status !== "paused" &&
    nextExtraBatch.length > 0;
  const skipReview = initialReviews.length === 0;
  const activePhase: Phase =
    phase === "review" && skipReview ? "learn" : phase;

  useEffect(() => {
    if (notice) {
      router.replace(`/?notice=${notice}`);
    }
  }, [notice, router]);

  const requestCompletion = useCallback((): Promise<CompletionSaveState> => {
    if (!studyDay) {
      return Promise.resolve("failed");
    }

    if (completionSavedRef.current) {
      setCompletionSaveState("saved");
      return Promise.resolve("saved");
    }

    if (completionPromiseRef.current) {
      return completionPromiseRef.current;
    }

    if (
      mode === "full" &&
      (!state ||
        state.dueReviews.length > 0 ||
        (state.newRemaining > 0 && !activeBatchIsLastForDay))
    ) {
      setCompletionSaveState("failed");
      return Promise.resolve("failed");
    }

    setCompletionSaveState("saving");
    const promise = saveCompletion(studyDay, mode).then((nextState) => {
      if (nextState === "saved") {
        completionSavedRef.current = true;
      }

      setCompletionSaveState(nextState);
      completionPromiseRef.current = null;
      return nextState;
    });

    completionPromiseRef.current = promise;
    return promise;
  }, [activeBatchIsLastForDay, mode, state, studyDay]);

  function finishReview(result: ReviewFinishedResult) {
    setProgress((current) => mergeProgress(current, result.progress));
    setSessionCounts((current) => ({
      ...current,
      answers: current.answers + result.answers,
    }));
    setReviewResult(result);
    setPhase("review-summary");
  }

  function continueAfterReview() {
    if (mode === "mini") {
      if (initialBatch) {
        setBatchWords(initialBatch);
        setBatchIsLastForDay(true);
        setWrongCounts({});
        setPhase("learn");
        return;
      }

      setPhase("completion");
      void requestCompletion();
      return;
    }

    const next = nextRequiredPlan?.nextBatch;

    if (next && next.words.length > 0) {
      setBatchWords(next.words);
      setBatchIsLastForDay(next.isLastForDay);
      setWrongCounts({});
      setPhase("learn");
      return;
    }

    setPhase("completion");

    if (reviewCompletesDay) {
      void requestCompletion();
    }
  }

  function startQuiz() {
    if (!activeBatch) {
      return;
    }

    setBatchWords(activeBatch);
    setBatchIsLastForDay(activeBatchIsLastForDay);
    setWrongCounts({});
    setPhase("quiz");
  }

  function finishQuiz(result: QuizFinishedResult) {
    setProgress((current) => mergeProgress(current, result.introduced));
    setSessionCounts((current) => ({
      answers: current.answers + result.answers,
      newWords: current.newWords + result.newWords,
    }));
    setWrongCounts(result.wrongCounts);

    if (mode === "mini" || activeBatchIsLastForDay) {
      void requestCompletion();
    }

    setPhase("summary");
  }

  function continueAfterSummary() {
    if (mode === "mini") {
      setPhase("completion");
      void requestCompletion();
      return;
    }

    const next = nextRequiredPlan?.nextBatch;

    if (next && next.words.length > 0) {
      setBatchWords(next.words);
      setBatchIsLastForDay(next.isLastForDay);
      setWrongCounts({});
      setPhase("learn");
      return;
    }

    setPhase("completion");
    void requestCompletion();
  }

  function learnMore() {
    if (nextExtraBatch.length === 0) {
      return;
    }

    setBatchWords(nextExtraBatch);
    setBatchIsLastForDay(false);
    setWrongCounts({});
    setPhase("learn");
  }

  function retryCompletion() {
    void requestCompletion();
  }

  async function stopForToday() {
    if (mode === "mini" || activeBatchIsLastForDay) {
      const nextState = await requestCompletion();

      if (nextState !== "saved") {
        setPhase("completion");
        return;
      }
    }

    router.replace("/");
  }

  async function stopAfterReview() {
    if (mode === "mini") {
      if (initialBatch) {
        router.replace("/");
        return;
      }

      const nextState = await requestCompletion();

      if (nextState !== "saved") {
        setPhase("completion");
        return;
      }

      router.replace("/");
      return;
    }

    if (reviewCompletesDay) {
      const nextState = await requestCompletion();

      if (nextState !== "saved") {
        setPhase("completion");
        return;
      }
    }

    router.replace("/");
  }

  if (!studyDay || !state || !initialState || notice) {
    return <SessionSkeleton />;
  }

  if (activePhase === "review") {
    if (validReviews.length === 0) {
      return (
        <SessionEmpty
          title="Couldn't load your reviews"
          description="Return to Today and start another session."
        />
      );
    }

    return (
      <ReviewScreen
        reviews={validReviews}
        words={reviewWords}
        deck={exerciseDeck}
        studyDay={studyDay}
        onFinished={finishReview}
      />
    );
  }

  if (activePhase === "review-summary") {
    if (!reviewResult) {
      return <SessionSkeleton />;
    }

    return (
      <ReviewSummaryScreen
        words={reviewSummaryWords}
        wrongCounts={reviewResult.wrongCounts}
        continueLabel={
          mode === "mini"
            ? initialBatch
              ? "Continue to new words"
              : "Finish"
            : nextRequiredBatch.length > 0
              ? "Continue to new words"
              : "Finish"
        }
        onStop={() => void stopAfterReview()}
        onContinue={continueAfterReview}
      />
    );
  }

  if (activePhase === "completion") {
    return (
      <CompletionScreen
        completion={mode}
        introducedToday={newWordsToday}
        answersToday={answersToday}
        tomorrow={state.tomorrow}
        learnMoreCount={nextExtraBatch.length}
        canLearnMore={canLearnMore}
        saveState={completionSaveState}
        onRetry={retryCompletion}
        onLearnMore={learnMore}
        onBack={() => router.replace("/")}
      />
    );
  }

  if (!activeBatch || activeBatch.length === 0) {
    return <SessionSkeleton />;
  }

  if (activePhase === "learn") {
    return <LearnScreen words={activeBatch} onStart={startQuiz} />;
  }

  if (activePhase === "summary") {
    return (
      <BatchSummaryScreen
        words={activeBatch}
        wrongCounts={wrongCounts}
        onStop={() => void stopForToday()}
        onContinue={continueAfterSummary}
      />
    );
  }

  return (
    <QuizScreen
      words={activeBatch}
      deck={exerciseDeck}
      studyDay={studyDay}
      onFinished={finishQuiz}
    />
  );
}
