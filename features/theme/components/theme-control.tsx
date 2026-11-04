"use client";

import { useActionState, useEffect } from "react";
import { setTheme } from "../actions";
import type { Theme, ThemeActionResult } from "../theme";

type ThemeControlProps = {
  theme: Theme;
};

const initialState: ThemeActionResult | null = null;

function buttonClassName(active: boolean): string {
  return `min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
    active
      ? "border-primary bg-primary-soft text-primary"
      : "border-border text-ink hover:border-primary/40"
  }`;
}

export function ThemeControl({ theme }: ThemeControlProps) {
  const [state, formAction, pending] = useActionState(
    setTheme,
    initialState,
  );
  const activeTheme = state?.ok ? state.theme : theme;

  useEffect(() => {
    if (state?.ok) {
      document.documentElement.dataset.theme = state.theme;
    }
  }, [state]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium text-ink">Theme</h2>
      <p className="mt-1 text-sm text-muted">Stored on this device.</p>
      <form action={formAction} className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="submit"
          name="theme"
          value="light"
          aria-pressed={activeTheme === "light"}
          disabled={pending}
          className={buttonClassName(activeTheme === "light")}
        >
          Light
        </button>
        <button
          type="submit"
          name="theme"
          value="dark"
          aria-pressed={activeTheme === "dark"}
          disabled={pending}
          className={buttonClassName(activeTheme === "dark")}
        >
          Dark
        </button>
      </form>
      {state?.ok === false ? (
        <p role="alert" className="mt-3 text-sm text-warn">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
