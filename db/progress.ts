import type { SupabaseClient } from "@supabase/supabase-js";
import type { Progress } from "@/core/types";
import type { Database } from "./database.types";
import { toProgress, toProgressRow } from "./mappers";

type SupabaseServerClient = SupabaseClient<Database, "public">;

const PROGRESS_PAGE_SIZE = 1000;

export async function getProgressForDeck(
  supabase: SupabaseServerClient,
  userId: string,
  deckId: string,
): Promise<Progress[]> {
  const progress: Progress[] = [];

  for (let from = 0; ; from += PROGRESS_PAGE_SIZE) {
    // Supabase returns at most 1000 rows per query, so keep paging until a short page.
    const { data, error } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("deck_id", deckId)
      .order("word_id")
      .range(from, from + PROGRESS_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    progress.push(...page.map(toProgress));

    if (page.length < PROGRESS_PAGE_SIZE) {
      return progress;
    }
  }
}

export async function getProgressForWord(
  supabase: SupabaseServerClient,
  userId: string,
  wordId: string,
): Promise<Progress | null> {
  const { data, error } = await supabase
    .from("word_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProgress(data) : null;
}

export async function saveProgress(
  supabase: SupabaseServerClient,
  userId: string,
  progress: Progress,
): Promise<void> {
  const { error } = await supabase
    .from("word_progress")
    .upsert(
      {
        ...toProgressRow(progress, userId),
        // The column default only applies on insert, so upserts must set it.
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,word_id" },
    );

  if (error) {
    throw error;
  }
}
