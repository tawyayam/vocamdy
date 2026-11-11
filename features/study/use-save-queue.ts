"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeSave,
  createSaveQueue,
  currentSave,
  enqueueSave,
  failSave,
  isSaveQueueBlocked,
  isSaveQueueDrained,
  retrySave,
  startSave,
  unsavedSaveCount,
  type SaveQueueState,
  type SaveQueueStatus,
} from "@/core/save-queue";
import type { StudyActionResult, StudyActionSuccess } from "./types";

type UseSaveQueueOptions<T> = {
  save: (payload: T) => Promise<StudyActionResult>;
  onSaved: (payload: T, result: StudyActionSuccess) => void;
};

export type SaveQueueController<T> = {
  status: SaveQueueStatus;
  unsavedCount: number;
  isDrained: boolean;
  isBlocked: boolean;
  savedCount: number;
  enqueue: (payload: T) => void;
  retry: () => void;
};

export function useSaveQueue<T>({
  save,
  onSaved,
}: UseSaveQueueOptions<T>) {
  const [state, setState] = useState<SaveQueueState<T>>(createSaveQueue<T>);
  const stateRef = useRef(state);
  const runningRef = useRef(false);
  const saveRef = useRef(save);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    saveRef.current = save;
    onSavedRef.current = onSaved;
  }, [onSaved, save]);

  const update = useCallback((next: SaveQueueState<T>) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const drain = useCallback(async () => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;

    try {
      while (true) {
        const current = currentSave(stateRef.current);

        if (!current || stateRef.current.status === "failed") {
          return;
        }

        update(startSave(stateRef.current));

        let result: StudyActionResult;

        try {
          result = await saveRef.current(current);
        } catch (error) {
          console.error("Could not save a study answer.", error);
          update(failSave(stateRef.current));
          return;
        }

        if (!result.ok) {
          update(failSave(stateRef.current));
          return;
        }

        onSavedRef.current(current, result);
        update(completeSave(stateRef.current));
      }
    } finally {
      runningRef.current = false;
    }
  }, [update]);

  const enqueue = useCallback(
    (payload: T) => {
      update(enqueueSave(stateRef.current, payload));
      void drain();
    },
    [drain, update],
  );

  const retry = useCallback(() => {
    if (!currentSave(stateRef.current)) {
      return;
    }

    update(retrySave(stateRef.current));
    void drain();
  }, [drain, update]);

  return {
    status: state.status,
    unsavedCount: unsavedSaveCount(state),
    isDrained: isSaveQueueDrained(state),
    isBlocked: isSaveQueueBlocked(state),
    savedCount: state.savedCount,
    enqueue,
    retry,
  } satisfies SaveQueueController<T>;
}
