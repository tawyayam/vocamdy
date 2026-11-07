import { getDeck } from "@/content/decks";
import { getUserSettings } from "@/db/settings";
import { requireUser } from "@/features/auth/server";

export async function loadActiveDeck() {
  const { supabase, userId } = await requireUser();
  const settings = await getUserSettings(supabase, userId);
  const deck = getDeck(settings.activeDeckId);

  return { supabase, userId, settings, deck };
}
