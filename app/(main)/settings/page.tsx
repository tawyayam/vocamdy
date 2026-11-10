import { Download } from "lucide-react";
import { getUserSettings } from "@/db/settings";
import { requireUser } from "@/features/auth/server";
import { SignOutForm } from "@/features/auth/components/sign-out-form";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { ThemeControl } from "@/features/theme/components/theme-control";
import { getTheme } from "@/features/theme/server";

export default async function SettingsPage() {
  const { supabase, userId, email } = await requireUser();
  const [settings, theme] = await Promise.all([
    getUserSettings(supabase, userId),
    getTheme(),
  ]);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">Settings</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Settings
        </h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-4">
          <SettingsForm settings={settings} />
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium text-ink">Export</h2>
            <p className="mt-1 text-sm text-muted">
              Download a JSON snapshot of your settings, progress and activity.
            </p>
            <a
              href="/api/export"
              download
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Download
                aria-hidden="true"
                className="h-4 w-4"
                strokeWidth={1.8}
              />
              Export progress
            </a>
          </section>
        </div>
        <div className="min-w-0 space-y-4">
          <ThemeControl theme={theme} />
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium text-ink">Account</h2>
            <p className="mt-2 break-words text-sm text-muted">
              {email ?? "Signed in"}
            </p>
            <div className="mt-5">
              <SignOutForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
