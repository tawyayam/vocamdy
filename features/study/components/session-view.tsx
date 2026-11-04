"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudyDay } from "@/core/day";
import { buildTodayState, planNewBatch } from "@/core/planner";
import type { Deck, Progress, TodayState, Word } from "@/core/types";
import { completeStudyDay } from "../actions";
import type { SessionData } from "../session-data";
import { BatchSummaryScreen } from "./batch-summary-screen";
import {
  CompletionScreen,
  type CompletionSaveState,
} from "./completion-screen";
import { LearnScreen } from "./learn-screen";
import { QuizScreen, type QuizFinishedResult } from "./quiz-screen";
import { SessionSkeleton } from "./session-skeleton";

type SessionViewProps = {
  data: SessionData;
};

type Phase = "learn" | "quiz" | "summary" | "completion";

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
  if (state.status === "paused") {
    return "paused";
  }

  if (state.status === "deck-complete") {
    return "deck-complete";
  }

  if (state.status === "complete") {
    return "complete";
  }

  if (state.newRemaining === 0 || batchCount === 0) {
    return "no-new-words";
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

async function saveCompletion(studyDay: string): Promise<CompletionSaveState> {
  try {
    const result = await completeStudyDay({
      kind: "completion",
      studyDay,
      completion: "full",
    });

    return result.ok ? "saved" : "failed";
  } catch (error) {
    console.error("Could not save the day completion.", error);
    return "failed";
  }
}

export function SessionView({ data }: SessionViewProps) {
  const router = useRouter();
  const [initialData] = useState(data);
  const [studyDay, setStudyDay] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("learn");
  const [progress, setProgress] = useState<Progress[]>(
    () => initialData.progress,
  );
  const [batchWords, setBatchWords] = useState<Word[] | null>(null);
  const [batchIsLastForDay, setBatchIsLastForDay] = useState(false);
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});
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
  const initialBatch = initialBatchPlan?.words ?? null;
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
    if (!state) {
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
    state,
  ]);
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
    state?.status !== "paused" && nextExtraBatch.length > 0;

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

    setCompletionSaveState("saving");
    const promise = saveCompletion(studyDay).then((nextState) => {
      if (nextState === "saved") {
        completionSavedRef.current = true;
      }

      setCompletionSaveState(nextState);
      completionPromiseRef.current = null;
      return nextState;
    });

    completionPromiseRef.current = promise;
    return promise;
  }, [studyDay]);

  useEffect(() => {
    if (phase !== "completion" || completionSaveState === "failed") {
      return;
    }

    void requestCompletion();
  }, [completionSaveState, phase, requestCompletion]);

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

    if (activeBatchIsLastForDay) {
      void requestCompletion();
    }

    setPhase("summary");
  }

  function continueAfterSummary() {
    if (!state) {
      return;
    }

    const next = planNewBatch({
      candidates: candidatesRemaining,
      introducedToday: state.introducedToday,
      dailyNew: initialData.settings.dailyNew,
      batchSize: initialData.settings.batchSize,
    });

    if (next.words.length > 0) {
      setBatchWords(next.words);
      setBatchIsLastForDay(next.isLastForDay);
      setWrongCounts({});
      setPhase("learn");
      return;
    }

    setPhase("completion");
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
    if (activeBatchIsLastForDay) {
      const nextState = await requestCompletion();

      if (nextState !== "saved") {
        setPhase("completion");
        return;
      }
    }

    router.replace("/");
  }

  if (!studyDay || !state || !initialBatch || notice) {
    return <SessionSkeleton />;
  }

  if (phase === "completion") {
    return (
      <CompletionScreen
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

  if (phase === "learn") {
    return <LearnScreen words={activeBatch} onStart={startQuiz} />;
  }

  if (phase === "summary") {
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
