"use client";

import { useActionState } from "react";
import { signInWithGoogle } from "../actions";
import type { SignInState } from "../state";

type GoogleSignInFormProps = {
  next: string;
  initialError: string | null;
};

export function GoogleSignInForm({
  next,
  initialError,
}: GoogleSignInFormProps) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signInWithGoogle,
    null,
  );
  const error = state?.error ?? initialError;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        {isPending ? "Connecting..." : "Continue with Google"}
      </button>
    </form>
  );
}
