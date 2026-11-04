import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity } from "@/core/types";
import type { Database } from "./database.types";
import { toActivity, toActivityRow } from "./mappers";

type SupabaseServerClient = SupabaseClient<Database, "public">;

export async function getActivityForDay(
  supabase: SupabaseServerClient,
  userId: string,
  studyDay: string,
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", userId)
    .eq("study_day", studyDay)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toActivity(data) : null;
}

export async function getRecentActivity(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 14,
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", userId)
    .order("study_day", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(toActivity);
}

export async function saveActivity(
  supabase: SupabaseServerClient,
  userId: string,
  activity: Activity,
): Promise<void> {
  const { error } = await supabase
    .from("daily_activity")
    .upsert(toActivityRow(activity, userId), {
      onConflict: "user_id,study_day",
    });

  if (error) {
    throw error;
  }
}
