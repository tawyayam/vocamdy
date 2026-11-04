import { WEEKLY_GOAL, type Week } from "@/core/week";

const WEEKDAYS = [
  { letter: "MO", name: "Monday" },
  { letter: "TU", name: "Tuesday" },
  { letter: "WE", name: "Wednesday" },
  { letter: "TH", name: "Thursday" },
  { letter: "FR", name: "Friday" },
  { letter: "SA", name: "Saturday" },
  { letter: "SU", name: "Sunday" },
] as const;

type WeekCardProps = {
  week: Week;
};

function circleClassName(active: boolean, isToday: boolean): string {
  if (active) {
    return "border border-primary bg-primary text-on-primary";
  }

  if (isToday) {
    return "border-2 border-dashed border-primary bg-transparent text-primary";
  }

  return "border border-border bg-card text-muted";
}

export function WeekCard({ week }: WeekCardProps) {
  const label = week.goalReached
    ? "Weekly goal reached"
    : `${week.activeCount} of ${WEEKLY_GOAL} days this week`;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold text-ink">This week</h2>
        <p className="text-sm text-muted">{label}</p>
      </div>
      <div
        role="list"
        aria-label="Activity this week"
        className="mt-5 flex items-center justify-between gap-2"
      >
        {week.days.map((day, index) => {
          const weekday = WEEKDAYS[index];
          const status = day.active
            ? "active"
            : day.isToday
              ? "today, not active yet"
              : "not active";

          return (
            <div
              key={day.studyDay}
              role="listitem"
              aria-label={`${weekday.name}: ${status}`}
              title={weekday.name}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${circleClassName(day.active, day.isToday)}`}
            >
              {weekday.letter}
            </div>
          );
        })}
      </div>
    </section>
  );
}
