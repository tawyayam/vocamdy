import type { SupabaseClient } from "@supabase/supabase-js";
import { exportDataSchema, type ExportData } from "@/core/schemas";
import type { Database } from "./database.types";
import { ensureUserSettings } from "./settings";

type SupabaseServerClient = SupabaseClient<Database, "public">;
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
type ProgressRow = Database["public"]["Tables"]["word_progress"]["Row"];
type ActivityRow = Database["public"]["Tables"]["daily_activity"]["Row"];

const PAGE_SIZE = 1000;

async function getSettingsRow(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<SettingsRow> {
  await ensureUserSettings(supabase, userId);

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getProgressRows(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProgressRow[]> {
  const rows: ProgressRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", userId)
      .order("word_id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

async function getActivityRows(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("daily_activity")
      .select("*")
      .eq("user_id", userId)
      .order("study_day")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

export async function getExportSnapshot(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ExportData> {
  const [userSettings, wordProgress, dailyActivity] = await Promise.all([
    getSettingsRow(supabase, userId),
    getProgressRows(supabase, userId),
    getActivityRows(supabase, userId),
  ]);

  return exportDataSchema.parse({
    schema_version: 1,
    exported_at: new Date().toISOString(),
    user_settings: userSettings,
    word_progress: wordProgress,
    daily_activity: dailyActivity,
  });
}
