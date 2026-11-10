"use client";

import { LogOut } from "lucide-react";
import { useActionState, useId, useRef } from "react";
import { signOut } from "../actions";
import type { SignOutState } from "../state";

type SignOutFormProps = {
  className?: string;
  iconOnly?: boolean;
  showIcon?: boolean;
  confirm?: boolean;
};

export function SignOutForm({
  className,
  iconOnly = false,
  showIcon = false,
  confirm = false,
}: SignOutFormProps) {
  const [state, formAction, isPending] = useActionState<SignOutState>(
    signOut,
    null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const label = isPending ? "Signing out..." : "Sign out";
  const buttonClass = iconOnly
    ? `flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${className ?? ""}`
    : `min-h-11 rounded-xl border border-border bg-card px-4 py-2 font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${showIcon ? "inline-flex items-center justify-center gap-2" : ""} ${className ?? ""}`;

  function openConfirmation() {
    dialogRef.current?.showModal();
  }

  function closeConfirmation() {
    dialogRef.current?.close();
  }

  return (
    <form action={formAction} className="space-y-3">
      {confirm ? (
        <button
          type="button"
          onClick={openConfirmation}
          aria-label={iconOnly ? "Sign out" : undefined}
          aria-haspopup="dialog"
          className={buttonClass}
        >
          {showIcon || iconOnly ? (
            <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          ) : null}
          {iconOnly ? null : label}
        </button>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          aria-label={iconOnly ? "Sign out" : undefined}
          className={buttonClass}
        >
          {showIcon || iconOnly ? (
            <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          ) : null}
          {iconOnly ? null : label}
        </button>
      )}

      {confirm ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-5 text-ink shadow-xl backdrop:bg-ink/40"
        >
          <h2 id={titleId} className="font-serif text-2xl font-semibold">
            Sign out?
          </h2>
          <p id={descriptionId} className="mt-2 text-sm text-muted">
            You will need to sign in again to keep practising.
          </p>
          {state?.error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
            >
              {state.error}
            </p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={closeConfirmation}
              className="min-h-11 flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {label}
            </button>
          </div>
        </dialog>
      ) : state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
