import type { Activity, Progress } from "@/core/types";

export type StudyActionResult =
  | {
      ok: true;
      stale: boolean;
      progress: Progress | null;
      activity: Activity | null;
    }
  | { ok: false; error: string };

export type CompletionActionResult =
  | { ok: true; activity: Activity }
  | { ok: false; error: string };
