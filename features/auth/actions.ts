"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/core/redirect";
import { createSupabaseServerClient } from "@/db/server";
import type { SignInState, SignOutState } from "./state";

const SIGN_IN_ERROR = "Couldn't start Google sign-in. Please try again.";
const SIGN_OUT_ERROR = "Couldn't sign out. Please try again.";

async function getRequestOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (origin && origin !== "null") {
    return origin;
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

  if (!host) {
    throw new Error("Could not determine the request origin.");
  }

  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

export async function signInWithGoogle(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const next = safeRedirectPath(formData.get("next"));
  let authUrl: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const origin = await getRequestOrigin();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error("Google sign-in failed.", error);
    } else {
      authUrl = data.url;
    }
  } catch (error) {
    console.error("Google sign-in failed.", error);
  }

  if (!authUrl) {
    return { error: SIGN_IN_ERROR };
  }

  redirect(authUrl);
}

export async function signOut(): Promise<SignOutState> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      throw error;
    }

    if (data?.claims) {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }
    }
  } catch (error) {
    console.error("Sign out failed.", error);
    return { error: SIGN_OUT_ERROR };
  }

  redirect("/login");
}
