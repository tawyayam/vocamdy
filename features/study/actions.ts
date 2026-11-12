"use server";

import { revalidatePath } from "next/cache";
import { getDeck } from "@/content/decks";
import { createActionTiming, type ActionTiming } from "@/core/action-timing";
import { answerInputForServerDay } from "@/core/schemas";
import {
  answerReview,
  introduceWord,
  isReviewDue,
  isStaleAnswer,
} from "@/core/scheduler";
import type { Activity, Completion } from "@/core/types";
import { getActivityForDay, saveActivity } from "@/db/activity";
import { getProgressForWord, saveProgress } from "@/db/progress";
import { createSupabaseServerClient } from "@/db/server";
import { getUserSettings } from "@/db/settings";
import type {
  CompletionActionResult,
  StudyActionResult,
} from "./types";

const AUTH_ERROR = "Please sign in again.";
const DECK_ERROR = "Couldn't load your deck.";
const WORD_ERROR = "That word is not in your deck.";
const SAVE_ERROR = "Couldn't save. Please try again.";

type StudySession = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
};

async function getStudySession(
  timing: ActionTiming,
): Promise<StudySession | null> {
  const supabase = await timing.measure("client", () =>
    createSupabaseServerClient(),
  );
  const { data, error } = await timing.measure("claims", () =>
    supabase.auth.getClaims(),
  );

  if (error) {
    throw error;
  }

  const userId = data?.claims?.sub;

  if (typeof userId !== "string" || !userId) {
    return null;
  }

  return { supabase, userId };
}

function getServerStudyDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function revalidateProgressScreens(): void {
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/words");
}

function createActivity(studyDay: string): Activity {
  return {
    studyDay,
    answersCount: 0,
    newWordsCount: 0,
    reviewsCount: 0,
    completed: null,
  };
}

function recordAnswer(
  current: Activity | null,
  studyDay: string,
  counts: { newWord?: boolean; review?: boolean } = {},
): Activity {
  const activity = current ?? createActivity(studyDay);

  return {
    ...activity,
    answersCount: activity.answersCount + 1,
    newWordsCount: activity.newWordsCount + (counts.newWord ? 1 : 0),
    reviewsCount: activity.reviewsCount + (counts.review ? 1 : 0),
  };
}

function recordCompletion(
  current: Activity | null,
  studyDay: string,
  completion: Completion,
): Activity {
  const activity = current ?? createActivity(studyDay);
  const completed =
    activity.completed === "full" ? activity.completed : completion;

  return { ...activity, completed };
}

async function readActivityForAnswer(
  session: StudySession,
  studyDay: string,
  timing: ActionTiming,
): Promise<Activity | null | undefined> {
  try {
    return await timing.measure("activityRead", () =>
      getActivityForDay(session.supabase, session.userId, studyDay),
    );
  } catch (error) {
    console.error("Could not read daily activity for an answer.", error);
    return undefined;
  }
}

async function saveActivityBestEffort(
  session: StudySession,
  activity: Activity,
  timing: ActionTiming,
): Promise<Activity | null> {
  try {
    await timing.measure("activityWrite", () =>
      saveActivity(session.supabase, session.userId, activity),
    );
    return activity;
  } catch (error) {
    console.error("Could not save daily activity after progress.", error);
    return null;
  }
}

async function getDeckAndWord(
  session: StudySession,
  wordId: string,
  timing: ActionTiming,
): Promise<{ ok: true; deckId: string } | { ok: false; error: string }> {
  const settings = await timing.measure("settings", () =>
    getUserSettings(session.supabase, session.userId),
  );
  const deck = getDeck(settings.activeDeckId);

  if (!deck) {
    return { ok: false, error: DECK_ERROR };
  }

  if (!deck.words.some((word) => word.id === wordId)) {
    return { ok: false, error: WORD_ERROR };
  }

  return { ok: true, deckId: deck.id };
}

export async function submitReviewAnswer(raw: unknown): Promise<StudyActionResult> {
  const timing = createActionTiming("submitReviewAnswer");

  try {
    const session = await getStudySession(timing);

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "review") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const [deckAndWord, stored, currentActivity] = await Promise.all([
      getDeckAndWord(session, input.wordId, timing),
      timing.measure("progressRead", () =>
        getProgressForWord(session.supabase, session.userId, input.wordId),
      ),
      readActivityForAnswer(session, input.studyDay, timing),
    ]);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    if (
      !stored ||
      isStaleAnswer({
        kind: "review",
        expectedStage: input.expectedStage,
        progress: stored,
      }) ||
      !isReviewDue(stored, input.studyDay)
    ) {
      return { ok: true, stale: true, progress: stored, activity: null };
    }

    const progress = answerReview({
      progress: stored,
      correct: input.correct,
      studyDay: input.studyDay,
      firstAttempt: true,
    });
    const activity =
      currentActivity === undefined
        ? null
        : recordAnswer(currentActivity, input.studyDay, { review: true });

    const [, savedActivity] = await Promise.all([
      timing.measure("progressWrite", () =>
        saveProgress(session.supabase, session.userId, progress),
      ),
      activity
        ? saveActivityBestEffort(session, activity, timing)
        : Promise.resolve(null),
    ]);

    return { ok: true, stale: false, progress, activity: savedActivity };
  } catch (error) {
    console.error("Could not save the review answer.", error);
    return { ok: false, error: SAVE_ERROR };
  } finally {
    timing.log();
  }
}

export async function submitIntroducedWord(
  raw: unknown,
): Promise<StudyActionResult> {
  const timing = createActionTiming("submitIntroducedWord");

  try {
    const session = await getStudySession(timing);

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "introduce") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const [deckAndWord, stored, currentActivity] = await Promise.all([
      getDeckAndWord(session, input.wordId, timing),
      timing.measure("progressRead", () =>
        getProgressForWord(session.supabase, session.userId, input.wordId),
      ),
      readActivityForAnswer(session, input.studyDay, timing),
    ]);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    if (isStaleAnswer({ kind: "introduce", progress: stored })) {
      return { ok: true, stale: true, progress: stored, activity: null };
    }

    const progress = introduceWord({
      wordId: input.wordId,
      deckId: deckAndWord.deckId,
      studyDay: input.studyDay,
      wrongCount: input.wrongCount,
    });
    const activity =
      currentActivity === undefined
        ? null
        : recordAnswer(currentActivity, input.studyDay, { newWord: true });

    const [, savedActivity] = await Promise.all([
      timing.measure("progressWrite", () =>
        saveProgress(session.supabase, session.userId, progress),
      ),
      activity
        ? saveActivityBestEffort(session, activity, timing)
        : Promise.resolve(null),
    ]);

    return { ok: true, stale: false, progress, activity: savedActivity };
  } catch (error) {
    console.error("Could not save the introduced word.", error);
    return { ok: false, error: SAVE_ERROR };
  } finally {
    timing.log();
  }
}

export async function submitExtraAttempt(
  raw: unknown,
): Promise<StudyActionResult> {
  const timing = createActionTiming("submitExtraAttempt");

  try {
    const session = await getStudySession(timing);

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "extra") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const [deckAndWord, currentActivity] = await Promise.all([
      getDeckAndWord(session, input.wordId, timing),
      timing.measure("activityRead", () =>
        getActivityForDay(session.supabase, session.userId, input.studyDay),
      ),
    ]);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    const activity = recordAnswer(currentActivity, input.studyDay);

    await timing.measure("activityWrite", () =>
      saveActivity(session.supabase, session.userId, activity),
    );

    return { ok: true, stale: false, progress: null, activity };
  } catch (error) {
    console.error("Could not save the extra attempt.", error);
    return { ok: false, error: SAVE_ERROR };
  } finally {
    timing.log();
  }
}

export async function completeStudyDay(
  raw: unknown,
): Promise<CompletionActionResult> {
  const timing = createActionTiming("completeStudyDay");

  try {
    const session = await getStudySession(timing);

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "completion") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const currentActivity = await timing.measure("activityRead", () =>
      getActivityForDay(session.supabase, session.userId, input.studyDay),
    );
    const activity = recordCompletion(
      currentActivity,
      input.studyDay,
      input.completion,
    );

    await timing.measure("activityWrite", () =>
      saveActivity(session.supabase, session.userId, activity),
    );
    revalidateProgressScreens();

    return { ok: true, activity };
  } catch (error) {
    console.error("Could not save the day completion.", error);
    return { ok: false, error: SAVE_ERROR };
  } finally {
    timing.log();
  }
}
