import { getDeck } from "@/content/decks";
import type { Activity, Group, Progress, Settings, Word } from "@/core/types";
import { getRecentActivity } from "@/db/activity";
import { getProgressForDeck } from "@/db/progress";
import { createSupabaseServerClient } from "@/db/server";
import { getUserSettings } from "@/db/settings";

export type SessionPoolWord = {
  id: string;
  order: number;
  group: string;
  word: string;
  arabic?: string;
};

export type SessionData = {
  deck: {
    id: string;
    name: string;
    groups: Group[];
  };
  pool: SessionPoolWord[];
  candidates: Word[];
  progress: Progress[];
  activities: Activity[];
  settings: Settings;
};

export type SessionDataResult =
  | { status: "ready"; data: SessionData }
  | { status: "unauthenticated" }
  | { status: "deck-missing" };

function toPoolWord(word: Word): SessionPoolWord {
  return {
    id: word.id,
    order: word.order,
    group: word.group,
    word: word.word,
    ...(word.arabic ? { arabic: word.arabic } : {}),
  };
}

export async function loadSessionData(): Promise<SessionDataResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Could not read the signed-in user.", error);
    return { status: "unauthenticated" };
  }

  const userId = data?.claims?.sub;

  if (typeof userId !== "string" || !userId) {
    return { status: "unauthenticated" };
  }

  const settings = await getUserSettings(supabase, userId);
  const deck = getDeck(settings.activeDeckId);

  if (!deck) {
    return { status: "deck-missing" };
  }

  const [progress, activities] = await Promise.all([
    getProgressForDeck(supabase, userId, deck.id),
    getRecentActivity(supabase, userId),
  ]);
  const introduced = new Set(progress.map((item) => item.wordId));
  const unintroduced = deck.words
    .filter((word) => !introduced.has(word.id))
    .sort((first, second) => first.order - second.order);

  return {
    status: "ready",
    data: {
      deck: {
        id: deck.id,
        name: deck.name,
        groups: deck.groups,
      },
      pool: deck.words.map(toPoolWord),
      candidates: unintroduced.slice(0, settings.dailyNew + settings.batchSize),
      progress,
      activities,
      settings,
    },
  };
}
