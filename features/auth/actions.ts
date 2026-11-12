"use server";

import { redirect } from "next/navigation";
import { createActionTiming } from "@/core/action-timing";
import { safeRedirectPath } from "@/core/redirect";
import { resolveSiteUrl } from "@/core/site-url";
import { createSupabaseServerClient } from "@/db/server";
import type { SignInState, SignOutState } from "./state";

const SIGN_IN_ERROR = "Couldn't start Google sign-in. Please try again.";
const SIGN_OUT_ERROR = "Couldn't sign out. Please try again.";

export async function signInWithGoogle(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const timing = createActionTiming("signInWithGoogle");
  const next = safeRedirectPath(formData.get("next"));
  const siteUrl = resolveSiteUrl(process.env.SITE_URL, process.env.NODE_ENV);
  let authUrl: string | null = null;

  if (!siteUrl) {
    console.error("Google sign-in requires a valid SITE_URL.");
    timing.log();
    return { error: SIGN_IN_ERROR };
  }

  try {
    const supabase = await timing.measure("client", () =>
      createSupabaseServerClient(),
    );
    const { data, error } = await timing.measure("oauth", () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      }),
    );

    if (error) {
      console.error("Google sign-in failed.", error);
    } else {
      authUrl = data.url;
    }
  } catch (error) {
    console.error("Google sign-in failed.", error);
  } finally {
    timing.log();
  }

  if (!authUrl) {
    return { error: SIGN_IN_ERROR };
  }

  redirect(authUrl);
}

export async function signOut(): Promise<SignOutState> {
  const timing = createActionTiming("signOut");

  try {
    const supabase = await timing.measure("client", () =>
      createSupabaseServerClient(),
    );
    const { data, error } = await timing.measure("claims", () =>
      supabase.auth.getClaims(),
    );

    if (error) {
      throw error;
    }

    if (data?.claims) {
      const { error: signOutError } = await timing.measure("signOut", () =>
        supabase.auth.signOut(),
      );

      if (signOutError) {
        throw signOutError;
      }
    }
  } catch (error) {
    console.error("Sign out failed.", error);
    return { error: SIGN_OUT_ERROR };
  } finally {
    timing.log();
  }

  redirect("/login");
}
