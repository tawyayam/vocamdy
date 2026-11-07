"use client";

import { useMemo } from "react";
import { buildTodayState } from "@/core/planner";
import { summarizeProgress } from "@/core/progress-summary";
import type { Activity, Progress, Settings } from "@/core/types";
import { buildWeek } from "@/core/week";
import { ProgressCard } from "@/features/study/components/progress-card";
import { TomorrowPreview } from "@/features/study/components/tomorrow-preview";
import { WeekCard } from "@/features/study/components/week-card";
import { toPlannerDeck, type DeckSummary } from "@/features/study/deck-summary";
import { formatStudyDay } from "@/features/study/format";
import { useStudyDay } from "@/features/study/use-study-day";
import { GroupProgressList } from "./group-progress-list";
import { ProgressSkeleton } from "./progress-skeleton";
import { StatusCountsCard } from "./status-counts-card";

type ProgressViewProps = {
  summary: DeckSummary;
  progress: Progress[];
  activities: Activity[];
  settings: Settings;
};

export function ProgressView({
  summary,
  progress,
  activities,
  settings,
}: ProgressViewProps) {
  const studyDay = useStudyDay();
  const plannerDeck = useMemo(() => toPlannerDeck(summary), [summary]);
  const progressSummary = useMemo(
    () => summarizeProgress(summary, progress),
    [progress, summary],
  );
  const activity = useMemo(
    () =>
      studyDay
        ? (activities.find((item) => item.studyDay === studyDay) ?? null)
        : null,
    [activities, studyDay],
  );
  const state = useMemo(
    () =>
      studyDay
        ? buildTodayState({
            deck: plannerDeck,
            progress,
            activity,
            settings,
            studyDay,
          })
        : null,
    [activity, plannerDeck, progress, settings, studyDay],
  );
  const week = useMemo(
    () => (studyDay ? buildWeek(studyDay, activities) : null),
    [activities, studyDay],
  );

  if (!studyDay || !state || !week) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">{formatStudyDay(studyDay)}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Progress
        </h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <StatusCountsCard counts={progressSummary.counts} />
          <ProgressCard
            summary={summary}
            progressSummary={progressSummary}
            state={state}
            settings={settings}
          />
        </div>
        <div className="space-y-4">
          <WeekCard week={week} />
          <TomorrowPreview preview={state.tomorrow} />
        </div>
      </div>
      <GroupProgressList groups={progressSummary.groups} />
    </div>
  );
}
