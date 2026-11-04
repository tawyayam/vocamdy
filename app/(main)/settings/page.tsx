import { createSupabaseServerClient } from "@/db/server";
import { SignOutForm } from "@/features/auth/components/sign-out-form";
import { ThemeControl } from "@/features/theme/components/theme-control";
import { getTheme } from "@/features/theme/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const theme = await getTheme();

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">Settings</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Settings
        </h1>
      </header>
      <ThemeControl theme={theme} />
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-medium text-ink">Account</h2>
        <p className="mt-2 break-words text-sm text-muted">
          {data?.claims?.email ?? "Signed in"}
        </p>
        <div className="mt-5">
          <SignOutForm />
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted">
          Study preferences and backup will appear here soon.
        </p>
      </section>
    </div>
  );
}
