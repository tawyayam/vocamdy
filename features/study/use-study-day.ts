"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudyDay } from "@/core/day";

const STUDY_DAY_CUTOFF_HOUR = 4;

function msUntilNextCutoff(now: Date): number {
  const nextCutoff = new Date(now);
  nextCutoff.setHours(STUDY_DAY_CUTOFF_HOUR, 0, 0, 0);

  if (nextCutoff <= now) {
    nextCutoff.setDate(nextCutoff.getDate() + 1);
  }

  return nextCutoff.getTime() - now.getTime();
}

export function useStudyDay(): string | null {
  const router = useRouter();
  const [studyDay, setStudyDay] = useState<string | null>(null);
  const studyDayRef = useRef<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const update = () => {
      if (cancelled) {
        return;
      }

      const nextStudyDay = getStudyDay(new Date());
      const previousStudyDay = studyDayRef.current;

      if (previousStudyDay === nextStudyDay) {
        return;
      }

      studyDayRef.current = nextStudyDay;
      setStudyDay(nextStudyDay);

      if (previousStudyDay !== null) {
        router.refresh();
      }
    };

    const scheduleCutoff = () => {
      timer = window.setTimeout(() => {
        update();
        scheduleCutoff();
      }, msUntilNextCutoff(new Date()));
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };

    update();
    scheduleCutoff();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return studyDay;
}
