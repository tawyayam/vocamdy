import { themeSchema, type Theme } from "@/core/schemas";

export const THEME_COOKIE_NAME = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type { Theme };

export type ThemeActionResult =
  | { ok: true; theme: Theme }
  | { ok: false; error: string };

export function parseTheme(value: unknown): Theme {
  const parsed = themeSchema.safeParse(value);
  return parsed.success ? parsed.data : "light";
}
