const CUTOFF_HOUR = 4;
const STUDY_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parseStudyDay(studyDay: string): Date {
  if (!STUDY_DAY_PATTERN.test(studyDay)) {
    throw new Error(`Invalid study day: ${studyDay}`);
  }

  const date = new Date(`${studyDay}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatUtcDate(date) !== studyDay) {
    throw new Error(`Invalid study day: ${studyDay}`);
  }

  return date;
}

export function getStudyDay(now: Date): string {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  if (now.getHours() < CUTOFF_HOUR) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return formatUtcDate(date);
}

export function addStudyDays(studyDay: string, days: number): string {
  const date = parseStudyDay(studyDay);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

export function compareStudyDays(first: string, second: string): number {
  return parseStudyDay(first).getTime() - parseStudyDay(second).getTime();
}

export function daysBetweenStudyDays(from: string, to: string): number {
  return Math.round((parseStudyDay(to).getTime() - parseStudyDay(from).getTime()) / MS_PER_DAY);
}

export function startOfStudyWeek(studyDay: string): string {
  const date = parseStudyDay(studyDay);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return formatUtcDate(date);
}
