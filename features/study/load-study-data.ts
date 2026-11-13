import { getDeck } from "@/content/decks";
import { getStudyData } from "@/db/study-data";
import { requireUser } from "@/features/auth/server";

export async function loadStudyData() {
  const { supabase } = await requireUser();
  const { settings, progress, activities } = await getStudyData(supabase);
  const deck = getDeck(settings.activeDeckId);

  return { settings, progress, activities, deck };
}
