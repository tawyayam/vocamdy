"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudyDay } from "@/core/day";

export function useStudyDay(): string | null {
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

  return studyDay;
}
