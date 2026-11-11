"use client";

import { CircleAlert } from "lucide-react";
import type { SaveQueueStatus } from "@/core/save-queue";
import { countLabel } from "../format";

type SaveStatusProps = {
  status: SaveQueueStatus;
};

export function SaveStatus({ status }: SaveStatusProps) {
  if (status === "idle") {
    return null;
  }

  const label =
    status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Not saved";

  return (
    <span
      role="status"
      aria-live="polite"
      className={
        status === "failed"
          ? "text-xs font-medium text-warn"
          : "text-xs font-medium text-muted"
      }
    >
      {label}
    </span>
  );
}

type SaveFailureBannerProps = {
  unsavedCount: number;
  onRetry: () => void;
};

export function SaveFailureBanner({
  unsavedCount,
  onRetry,
}: SaveFailureBannerProps) {
  return (
    <div role="alert" className="mt-3">
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-warn/40 bg-warn/5 px-4 py-2 text-sm font-medium text-warn transition-colors hover:border-warn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warn"
      >
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {countLabel(unsavedCount, "answer")} not saved. Tap to retry
      </button>
    </div>
  );
}
