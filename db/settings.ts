import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings } from "@/core/types";
import type { Database } from "./database.types";
import { toSettings } from "./mappers";

type SupabaseServerClient = SupabaseClient<Database, "public">;

const DEFAULT_SETTINGS: Settings = {
  activeDeckId: "awl",
  dailyNew: 10,
  batchSize: 5,
  backlogCap: 30,
};

export async function ensureUserSettings(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  if (error) {
    throw error;
  }
}

export async function getUserSettings(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Settings> {
  await ensureUserSettings(supabase, userId);

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toSettings(data) : DEFAULT_SETTINGS;
}
