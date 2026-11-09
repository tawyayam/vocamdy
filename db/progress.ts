import type { SupabaseClient } from "@supabase/supabase-js";
import type { Progress } from "@/core/types";
import type { Database } from "./database.types";
import { toProgress, toProgressRow } from "./mappers";
import { fetchAllPages } from "./pagination";

type SupabaseServerClient = SupabaseClient<Database, "public">;

export async function getProgressForDeck(
  supabase: SupabaseServerClient,
  userId: string,
  deckId: string,
): Promise<Progress[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("deck_id", deckId)
      .order("word_id")
      .range(from, to),
  );

  return rows.map(toProgress);
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
