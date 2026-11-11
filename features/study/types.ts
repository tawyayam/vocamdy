import type { Activity, Progress } from "@/core/types";

export type StudyActionSuccess = {
  ok: true;
  stale: boolean;
  progress: Progress | null;
  activity: Activity | null;
};

export type StudyActionResult =
  | StudyActionSuccess
  | { ok: false; error: string };

export type CompletionActionResult =
  | { ok: true; activity: Activity }
  | { ok: false; error: string };
