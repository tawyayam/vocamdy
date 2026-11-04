import type {
  Activity,
  Completion,
  Progress,
  Settings,
  Stage,
} from "@/core/types";
import type { Database } from "./database.types";

type ProgressRow = Database["public"]["Tables"]["word_progress"]["Row"];
type ProgressInsert = Database["public"]["Tables"]["word_progress"]["Insert"];
type ActivityRow = Database["public"]["Tables"]["daily_activity"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["daily_activity"]["Insert"];
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
type SettingsInsert = Database["public"]["Tables"]["user_settings"]["Insert"];

function toStage(value: number): Stage {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }

  throw new Error(`Invalid progress stage: ${value}`);
}

function toCompletion(value: string | null): Completion | null {
  if (value === null || value === "full" || value === "mini") {
    return value;
  }

  throw new Error(`Invalid completion value: ${value}`);
}

export function toProgress(row: ProgressRow): Progress {
  return {
    wordId: row.word_id,
    deckId: row.deck_id,
    stage: toStage(row.stage),
    dueDate: row.due_date,
    introducedOn: row.introduced_on,
    graduatedOn: row.graduated_on,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    lastAnsweredOn: row.last_answered_on,
  };
}

export function toProgressRow(progress: Progress, userId: string): ProgressInsert {
  return {
    user_id: userId,
    word_id: progress.wordId,
    deck_id: progress.deckId,
    stage: progress.stage,
    due_date: progress.dueDate,
    introduced_on: progress.introducedOn,
    graduated_on: progress.graduatedOn,
    correct_count: progress.correctCount,
    wrong_count: progress.wrongCount,
    last_answered_on: progress.lastAnsweredOn,
  };
}

export function toActivity(row: ActivityRow): Activity {
  return {
    studyDay: row.study_day,
    answersCount: row.answers_count,
    newWordsCount: row.new_words_count,
    reviewsCount: row.reviews_count,
    completed: toCompletion(row.completed),
  };
}

export function toActivityRow(activity: Activity, userId: string): ActivityInsert {
  return {
    user_id: userId,
    study_day: activity.studyDay,
    answers_count: activity.answersCount,
    new_words_count: activity.newWordsCount,
    reviews_count: activity.reviewsCount,
    completed: activity.completed,
  };
}

export function toSettings(row: SettingsRow): Settings {
  return {
    activeDeckId: row.active_deck_id,
    dailyNew: row.daily_new,
    batchSize: row.batch_size,
    backlogCap: row.backlog_cap,
  };
}

export function toSettingsRow(settings: Settings, userId: string): SettingsInsert {
  return {
    user_id: userId,
    active_deck_id: settings.activeDeckId,
    daily_new: settings.dailyNew,
    batch_size: settings.batchSize,
    backlog_cap: settings.backlogCap,
  };
}
