import { CalendarDays } from "lucide-react";
import type { TomorrowPreview as TomorrowPreviewType } from "@/core/types";
import { countLabel } from "../format";

type TomorrowPreviewProps = {
  preview: TomorrowPreviewType;
};

export function TomorrowPreview({ preview }: TomorrowPreviewProps) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <CalendarDays
        aria-hidden="true"
        className="h-6 w-6 shrink-0 text-primary"
        strokeWidth={1.8}
      />
      <div>
        <h2 className="font-medium text-ink">Tomorrow</h2>
        <p className="mt-1 text-sm text-muted">
          {countLabel(preview.newWords, "new word")} +{" "}
          {countLabel(preview.reviews, "review")}
        </p>
      </div>
    </section>
  );
}
