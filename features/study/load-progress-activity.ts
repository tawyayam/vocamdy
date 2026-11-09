import type { Activity, Progress } from "@/core/types";
import { getRecentActivity } from "@/db/activity";
import { getProgressForDeck } from "@/db/progress";
import type { SignedInUser } from "@/features/auth/server";

type ProgressActivityData = {
  progress: Progress[];
  activities: Activity[];
};

export async function loadProgressActivity(
  { supabase, userId }: Pick<SignedInUser, "supabase" | "userId">,
  deckId: string,
): Promise<ProgressActivityData> {
  const [progress, activities] = await Promise.all([
    getProgressForDeck(supabase, userId, deckId),
    getRecentActivity(supabase, userId, 14),
  ]);

  return { progress, activities };
}
