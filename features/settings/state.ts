import type { Settings } from "@/core/types";

export type SettingsActionResult =
  | { ok: true; settings: Settings }
  | { ok: false; error: string };
