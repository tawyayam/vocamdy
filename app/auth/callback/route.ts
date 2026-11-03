import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/core/redirect";
import { createSupabaseServerClient } from "@/db/server";
import { ensureUserSettings } from "@/db/settings";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Could not exchange the auth code.", error);
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  try {
    await ensureUserSettings(supabase, data.user.id);
  } catch (settingsError) {
    console.error("Could not create the user settings.", settingsError);
    return NextResponse.redirect(new URL("/login?error=setup", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
