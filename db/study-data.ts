import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { studyDaySchema } from "@/core/schemas";
import type { Activity, Progress, Settings } from "@/core/types";
import type { Database } from "./database.types";
import { toActivity, toProgress, toSettings } from "./mappers";
import { DEFAULT_SETTINGS } from "./settings";

type SupabaseServerClient = SupabaseClient<Database, "public">;

const stageSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const settingsRowSchema = z.object({
  active_deck_id: z.string().min(1),
  daily_new: z.number().int().min(1).max(30),
  batch_size: z.number().int().min(3).max(10),
  backlog_cap: z.number().int().min(10).max(100),
});

const progressRowSchema = z.object({
  word_id: z.string().min(1),
  deck_id: z.string().min(1),
  stage: stageSchema,
  due_date: studyDaySchema.nullable(),
  introduced_on: studyDaySchema,
  graduated_on: studyDaySchema.nullable(),
  correct_count: z.number().int().min(0),
  wrong_count: z.number().int().min(0),
  last_answered_on: studyDaySchema.nullable(),
});

const activityRowSchema = z.object({
  study_day: studyDaySchema,
  answers_count: z.number().int().min(0),
  new_words_count: z.number().int().min(0),
  reviews_count: z.number().int().min(0),
  completed: z.enum(["full", "mini"]).nullable(),
});

export const studyDataSchema = z.object({
  settings: settingsRowSchema.nullable().optional(),
  progress: z.array(progressRowSchema),
  activities: z.array(activityRowSchema),
});

type StudyDataRow = z.infer<typeof studyDataSchema>;

export type StudyData = {
  settings: Settings;
  progress: Progress[];
  activities: Activity[];
};

export function toStudyData(row: StudyDataRow): StudyData {
  return {
    settings: row.settings ? toSettings(row.settings) : DEFAULT_SETTINGS,
    progress: row.progress.map(toProgress),
    activities: row.activities.map(toActivity),
  };
}

export async function getStudyData(
  supabase: SupabaseServerClient,
): Promise<StudyData> {
  const { data, error } = await supabase.rpc("get_study_data");

  if (error) {
    throw error;
  }

  return toStudyData(studyDataSchema.parse(data));
}
