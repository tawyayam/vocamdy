"use server";

import { revalidatePath } from "next/cache";
import { settingsInputSchema } from "@/core/schemas";
import { createSupabaseServerClient } from "@/db/server";
import { getUserSettings, saveUserSettings } from "@/db/settings";
import type { SettingsActionResult } from "./state";

const SAVE_ERROR = "Couldn't save your settings.";

function numberField(formData: FormData, name: string): number {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

export async function saveSettings(
  _previous: SettingsActionResult | null,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      throw error;
    }

    const userId = data?.claims?.sub;

    if (typeof userId !== "string" || !userId) {
      return { ok: false, error: SAVE_ERROR };
    }

    const current = await getUserSettings(supabase, userId);
    const parsed = settingsInputSchema.safeParse({
      activeDeckId: current.activeDeckId,
      dailyNew: numberField(formData, "dailyNew"),
      batchSize: numberField(formData, "batchSize"),
      backlogCap: numberField(formData, "backlogCap"),
    });

    if (!parsed.success) {
      return { ok: false, error: SAVE_ERROR };
    }

    await saveUserSettings(supabase, userId, parsed.data);
    revalidatePath("/");
    revalidatePath("/progress");

    return { ok: true, settings: parsed.data };
  } catch (error) {
    console.error("Could not save settings.", error);
    return { ok: false, error: SAVE_ERROR };
  }
}
