"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { daysBetweenStudyDays } from "@/core/day";
import { buildTodayState, planMiniSession } from "@/core/planner";
import { summarizeProgress } from "@/core/progress-summary";
import type { Activity, Progress, Settings } from "@/core/types";
import { buildWeek, isActiveDay } from "@/core/week";
import { toPlannerDeck, type DeckSummary } from "../deck-summary";
import { formatStudyDay } from "../format";
import { useStudyDay } from "../use-study-day";
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
  notice: string | null;
};

const NOTICE_MESSAGES: Record<string, string> = {
  paused: "Today is paused. Clear your overdue reviews first.",
  "deck-complete": "You have learned every word in this deck.",
  complete: "You are all done for today.",
  "no-new-words": "No new words are left for today.",
};

function getNoticeMessage(notice: string | null): string | null {
  if (!notice) {
    return null;
  }

  return NOTICE_MESSAGES[notice] ?? null;
}

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
  notice,
}: TodayViewProps) {
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

  const isBrandNew =
    summary.total > 0 && progress.length === 0 && activities.length === 0;

  if (isBrandNew) {
    return (
      <div className="space-y-4">
        <header>
          <p className="text-sm text-muted">{formatStudyDay(studyDay)}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
            Welcome to Vocamdy.
          </h1>
        </header>
        <EmptyState
          icon={Sparkles}
          title="Start your first session"
          description="Learn a small batch of words, then answer a few quick questions."
          action={{ href: "/session", label: "Start first session" }}
        />
      </div>
    );
  }

  const hasAnswers =
    (activity?.answersCount ?? 0) > 0 ||
    state.introducedToday > 0 ||
    (activity?.completed ?? null) !== null;
  const headline = welcomeBack ? "Welcome back." : "Ready for today's words?";
  const noticeMessage = getNoticeMessage(notice);

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
      {noticeMessage ? (
        <p
          role="status"
          className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-ink"
        >
          {noticeMessage}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-4">
          <SessionCard
            state={state}
            deckName={summary.name}
            hasAnswers={hasAnswers}
            miniCount={miniCount}
          />
          <TomorrowPreview preview={state.tomorrow} />
        </div>
        <div className="min-w-0 space-y-4">
          <WeekCard week={week} />
          <ProgressCard
            summary={summary}
            progressSummary={progressSummary}
            state={state}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
