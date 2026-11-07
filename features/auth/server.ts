import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/db/server";

export type SignedInUser = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  email: string | null;
};

export async function requireUser(): Promise<SignedInUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Could not read the signed-in user.", error);
    redirect("/login");
  }

  const userId = data?.claims?.sub;

  if (typeof userId !== "string" || !userId) {
    redirect("/login");
  }

  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  return { supabase, userId, email };
}
