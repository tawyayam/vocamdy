"use server";

import { revalidatePath } from "next/cache";
import { getDeck } from "@/content/decks";
import {
  answerInputForServerDay,
  reviewWordIdsSchema,
} from "@/core/schemas";
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
  ReviewWordsResult,
  StudyActionResult,
} from "./types";

const AUTH_ERROR = "Please sign in again.";
const DECK_ERROR = "Couldn't load your deck.";
const WORD_ERROR = "That word is not in your deck.";
const SAVE_ERROR = "Couldn't save. Please try again.";
const LOAD_ERROR = "Couldn't load your reviews. Please try again.";

type StudySession = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
};

async function getStudySession(): Promise<StudySession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

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

async function recordActivityAfterProgress(
  session: StudySession,
  studyDay: string,
  counts: { newWord?: boolean; review?: boolean } = {},
): Promise<Activity | null> {
  try {
    const current = await getActivityForDay(
      session.supabase,
      session.userId,
      studyDay,
    );
    const activity = recordAnswer(current, studyDay, counts);

    await saveActivity(session.supabase, session.userId, activity);
    return activity;
  } catch (error) {
    console.error("Could not save daily activity after progress.", error);
    return null;
  }
}

async function getDeckAndWord(
  session: StudySession,
  wordId: string,
): Promise<{ ok: true; deckId: string } | { ok: false; error: string }> {
  const settings = await getUserSettings(session.supabase, session.userId);
  const deck = getDeck(settings.activeDeckId);

  if (!deck) {
    return { ok: false, error: DECK_ERROR };
  }

  if (!deck.words.some((word) => word.id === wordId)) {
    return { ok: false, error: WORD_ERROR };
  }

  return { ok: true, deckId: deck.id };
}

export async function loadReviewWords(raw: unknown): Promise<ReviewWordsResult> {
  try {
    const session = await getStudySession();

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = reviewWordIdsSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: LOAD_ERROR };
    }

    const settings = await getUserSettings(session.supabase, session.userId);
    const deck = getDeck(settings.activeDeckId);

    if (!deck) {
      return { ok: false, error: DECK_ERROR };
    }

    const wordsById = new Map(deck.words.map((word) => [word.id, word]));
    const words = parsed.data.flatMap((wordId) => {
      const word = wordsById.get(wordId);
      return word ? [word] : [];
    });

    return { ok: true, words };
  } catch (error) {
    console.error("Could not load the review words.", error);
    return { ok: false, error: LOAD_ERROR };
  }
}

export async function submitReviewAnswer(raw: unknown): Promise<StudyActionResult> {
  try {
    const session = await getStudySession();

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "review") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const deckAndWord = await getDeckAndWord(session, input.wordId);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    const stored = await getProgressForWord(
      session.supabase,
      session.userId,
      input.wordId,
    );

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

    await saveProgress(session.supabase, session.userId, progress);
    const activity = await recordActivityAfterProgress(session, input.studyDay, {
      review: true,
    });

    return { ok: true, stale: false, progress, activity };
  } catch (error) {
    console.error("Could not save the review answer.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

export async function submitIntroducedWord(
  raw: unknown,
): Promise<StudyActionResult> {
  try {
    const session = await getStudySession();

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "introduce") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const deckAndWord = await getDeckAndWord(session, input.wordId);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    const stored = await getProgressForWord(
      session.supabase,
      session.userId,
      input.wordId,
    );

    if (isStaleAnswer({ kind: "introduce", progress: stored })) {
      return { ok: true, stale: true, progress: stored, activity: null };
    }

    const progress = introduceWord({
      wordId: input.wordId,
      deckId: deckAndWord.deckId,
      studyDay: input.studyDay,
      wrongCount: input.wrongCount,
    });

    await saveProgress(session.supabase, session.userId, progress);
    const activity = await recordActivityAfterProgress(session, input.studyDay, {
      newWord: true,
    });

    return { ok: true, stale: false, progress, activity };
  } catch (error) {
    console.error("Could not save the introduced word.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

export async function submitExtraAttempt(
  raw: unknown,
): Promise<StudyActionResult> {
  try {
    const session = await getStudySession();

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "extra") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const deckAndWord = await getDeckAndWord(session, input.wordId);

    if (!deckAndWord.ok) {
      return deckAndWord;
    }

    const currentActivity = await getActivityForDay(
      session.supabase,
      session.userId,
      input.studyDay,
    );
    const activity = recordAnswer(currentActivity, input.studyDay);

    await saveActivity(session.supabase, session.userId, activity);

    return { ok: true, stale: false, progress: null, activity };
  } catch (error) {
    console.error("Could not save the extra attempt.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}

export async function completeStudyDay(
  raw: unknown,
): Promise<CompletionActionResult> {
  try {
    const session = await getStudySession();

    if (!session) {
      return { ok: false, error: AUTH_ERROR };
    }

    const parsed = answerInputForServerDay(getServerStudyDay()).safeParse(raw);

    if (!parsed.success || parsed.data.kind !== "completion") {
      return { ok: false, error: SAVE_ERROR };
    }

    const input = parsed.data;
    const currentActivity = await getActivityForDay(
      session.supabase,
      session.userId,
      input.studyDay,
    );
    const activity = recordCompletion(
      currentActivity,
      input.studyDay,
      input.completion,
    );

    await saveActivity(session.supabase, session.userId, activity);
    revalidateProgressScreens();

    return { ok: true, activity };
  } catch (error) {
    console.error("Could not save the day completion.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}
