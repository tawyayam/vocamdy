import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type SupabaseServerClient = SupabaseClient<Database, "public">;

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
