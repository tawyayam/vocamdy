"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type SessionExitProps = {
  needsConfirmation?: boolean;
};

export function SessionExit({ needsConfirmation = false }: SessionExitProps) {
  const router = useRouter();

  function leaveSession() {
    if (needsConfirmation) {
      const leave = window.confirm(
        "Your latest answer has not been saved. Leave anyway?",
      );

      if (!leave) {
        return;
      }
    }

    router.replace("/");
  }

  return (
    <button
      type="button"
      onClick={leaveSession}
      aria-label="Back to Today"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ChevronLeft aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
