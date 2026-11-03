import { addStudyDays, startOfStudyWeek } from "./day";
import type { Activity } from "./types";

export const WEEKLY_GOAL = 5;

export type WeekDay = {
  studyDay: string;
  active: boolean;
  isToday: boolean;
};

export type Week = {
  days: WeekDay[];
  activeCount: number;
  goalReached: boolean;
};

export function isActiveDay(activity: Activity | null): boolean {
  if (!activity) {
    return false;
  }

  return activity.completed !== null || activity.answersCount >= 10;
}

export function buildWeek(studyDay: string, activities: readonly Activity[]): Week {
  const weekStart = startOfStudyWeek(studyDay);
  const activityByDay = new Map(activities.map((activity) => [activity.studyDay, activity]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addStudyDays(weekStart, index);
    const activity = activityByDay.get(day) ?? null;

    return {
      studyDay: day,
      active: isActiveDay(activity),
      isToday: day === studyDay,
    };
  });
  const activeCount = days.filter((day) => day.active).length;

  return {
    days,
    activeCount,
    goalReached: activeCount >= WEEKLY_GOAL,
  };
}
