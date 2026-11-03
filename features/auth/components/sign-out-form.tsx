"use client";

import { useActionState } from "react";
import { signOut } from "../actions";
import type { SignOutState } from "../state";

export function SignOutForm() {
  const [state, formAction, isPending] = useActionState<SignOutState>(
    signOut,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl border border-border bg-card px-4 py-2 font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </form>
  );
}
