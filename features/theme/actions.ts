"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { themeSchema } from "@/core/schemas";
import { createSupabaseServerClient } from "@/db/server";
import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  type ThemeActionResult,
} from "./theme";

const SAVE_ERROR = "Couldn't save the theme.";

export async function setTheme(
  _previous: ThemeActionResult | null,
  formData: FormData,
): Promise<ThemeActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      throw error;
    }

    if (!data?.claims) {
      return { ok: false, error: SAVE_ERROR };
    }

    const parsed = themeSchema.safeParse(formData.get("theme"));

    if (!parsed.success) {
      return { ok: false, error: SAVE_ERROR };
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: THEME_COOKIE_NAME,
      value: parsed.data,
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
    });

    revalidatePath("/", "layout");
    return { ok: true, theme: parsed.data };
  } catch (error) {
    console.error("Could not save the theme.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}
