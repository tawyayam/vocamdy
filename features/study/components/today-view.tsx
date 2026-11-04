"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { daysBetweenStudyDays, getStudyDay } from "@/core/day";
import { buildTodayState, planMiniSession } from "@/core/planner";
import type { Activity, Progress, Settings } from "@/core/types";
import { buildWeek, isActiveDay } from "@/core/week";
import { toPlannerDeck, type DeckSummary } from "../deck-summary";
import { formatStudyDay } from "../format";
import { ProgressCard } from "./progress-card";
import { SessionCard } from "./session-card";
import { TodaySkeleton } from "./today-skeleton";
import { TomorrowPreview } from "./tomorrow-preview";
import { WeekCard } from "./week-card";

type TodayViewProps = {
  summary: DeckSummary;
  progress: Progress[];
  activities: Activity[];
  settings: Settings;
};

function findLastActiveDay(
  activities: Activity[],
  studyDay: string,
): string | null {
  return activities.reduce<string | null>((latest, activity) => {
    if (!isActiveDay(activity) || activity.studyDay >= studyDay) {
      return latest;
    }

    if (latest === null || activity.studyDay > latest) {
      return activity.studyDay;
    }

    return latest;
  }, null);
}

export function TodayView({
  summary,
  progress,
  activities,
  settings,
}: TodayViewProps) {
  const router = useRouter();
  const [studyDay, setStudyDay] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setStudyDay(getStudyDay(new Date()));
      router.refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };

    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  const plannerDeck = useMemo(() => toPlannerDeck(summary), [summary]);
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
  const miniCount = useMemo(() => {
    if (!state) {
      return 0;
    }

    const mini = planMiniSession(state, settings.batchSize);
    return mini.reviews.length + mini.newWords.length;
  }, [settings.batchSize, state]);
  const welcomeBack = useMemo(() => {
    if (!studyDay) {
      return false;
    }

    const lastActiveDay = findLastActiveDay(activities, studyDay);
    return lastActiveDay
      ? daysBetweenStudyDays(lastActiveDay, studyDay) >= 2
      : false;
  }, [activities, studyDay]);

  if (!studyDay || !state || !week) {
    return <TodaySkeleton />;
  }

  const hasAnswers =
    (activity?.answersCount ?? 0) > 0 ||
    (activity?.completed ?? null) !== null;
  const headline = welcomeBack ? "Welcome back." : "Ready for today's words?";

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">{formatStudyDay(studyDay)}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          {headline}
        </h1>
        {welcomeBack ? (
          <p className="mt-2 text-muted">Let&apos;s pick up where you stopped.</p>
        ) : null}
      </header>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <SessionCard
            state={state}
            deckName={summary.name}
            hasAnswers={hasAnswers}
            miniCount={miniCount}
          />
          <TomorrowPreview preview={state.tomorrow} />
        </div>
        <div className="space-y-4">
          <WeekCard week={week} />
          <ProgressCard
            summary={summary}
            introduced={progress.length}
            state={state}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
