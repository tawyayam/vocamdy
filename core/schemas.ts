import { z } from "zod";
import { daysBetweenStudyDays } from "./day";

const STUDY_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAY_DISTANCE = 2;

export const studyDaySchema = z
  .string()
  .regex(STUDY_DAY_PATTERN, "Study day must use YYYY-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Study day must be a real date.");

const reviewStageSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const reviewAnswerSchema = z.object({
  kind: z.literal("review"),
  studyDay: studyDaySchema,
  wordId: z.string().trim().min(1),
  expectedStage: reviewStageSchema,
  correct: z.boolean(),
});

export const introducedWordSchema = z.object({
  kind: z.literal("introduce"),
  studyDay: studyDaySchema,
  wordId: z.string().trim().min(1),
  wrongCount: z.number().int().min(0).max(50),
});

export const extraAttemptSchema = z.object({
  kind: z.literal("extra"),
  studyDay: studyDaySchema,
  wordId: z.string().trim().min(1),
});

export const completionSchema = z.object({
  kind: z.literal("completion"),
  studyDay: studyDaySchema,
  completion: z.enum(["full", "mini"]),
});

export const reviewWordIdsSchema = z
  .array(z.string().trim().min(1))
  .max(1000);

export const answerInputSchema = z.discriminatedUnion("kind", [
  reviewAnswerSchema,
  introducedWordSchema,
  extraAttemptSchema,
  completionSchema,
]);

export type ReviewAnswerPayload = z.infer<typeof reviewAnswerSchema>;
export type IntroducedWordPayload = z.infer<typeof introducedWordSchema>;
export type ExtraAttemptPayload = z.infer<typeof extraAttemptSchema>;
export type CompletionPayload = z.infer<typeof completionSchema>;
export type AnswerInput = z.infer<typeof answerInputSchema>;

export function answerInputForServerDay(serverStudyDay: string) {
  return answerInputSchema.refine(
    (value) =>
      Math.abs(daysBetweenStudyDays(serverStudyDay, value.studyDay)) <=
      MAX_DAY_DISTANCE,
    {
      message: "Study day is too far from the server date.",
      path: ["studyDay"],
    },
  );
}

export const themeSchema = z.enum(["light", "dark"]);

export type Theme = z.infer<typeof themeSchema>;

export const settingsInputSchema = z.object({
  activeDeckId: z.string().trim().min(1),
  dailyNew: z.number().int().min(1).max(30),
  batchSize: z.number().int().min(3).max(10),
  backlogCap: z.number().int().min(10).max(100),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

const exportStageSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const exportSettingsSchema = z.object({
  user_id: z.string().min(1),
  active_deck_id: z.string().min(1),
  daily_new: z.number().int().min(1).max(30),
  batch_size: z.number().int().min(3).max(10),
  backlog_cap: z.number().int().min(10).max(100),
  updated_at: z.string().min(1),
});

const exportProgressSchema = z.object({
  user_id: z.string().min(1),
  word_id: z.string().min(1),
  deck_id: z.string().min(1),
  stage: exportStageSchema,
  due_date: studyDaySchema.nullable(),
  introduced_on: studyDaySchema,
  graduated_on: studyDaySchema.nullable(),
  correct_count: z.number().int().min(0),
  wrong_count: z.number().int().min(0),
  last_answered_on: studyDaySchema.nullable(),
  updated_at: z.string().min(1),
});

const exportActivitySchema = z.object({
  user_id: z.string().min(1),
  study_day: studyDaySchema,
  answers_count: z.number().int().min(0),
  new_words_count: z.number().int().min(0),
  reviews_count: z.number().int().min(0),
  completed: z.enum(["full", "mini"]).nullable(),
  updated_at: z.string().min(1),
});

export const exportDataSchema = z.object({
  schema_version: z.literal(1),
  exported_at: z.string().min(1),
  user_settings: exportSettingsSchema,
  word_progress: z.array(exportProgressSchema),
  daily_activity: z.array(exportActivitySchema),
});

export type ExportData = z.infer<typeof exportDataSchema>;
