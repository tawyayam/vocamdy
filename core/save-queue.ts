export type SaveQueueStatus = "idle" | "saving" | "saved" | "failed";

export const SAVE_QUEUE_BACKLOG_LIMIT = 5;

export type SaveQueueState<T> = {
  items: T[];
  status: SaveQueueStatus;
  savedCount: number;
};

export function createSaveQueue<T>(): SaveQueueState<T> {
  return { items: [], status: "idle", savedCount: 0 };
}

export function enqueueSave<T>(
  state: SaveQueueState<T>,
  payload: T,
): SaveQueueState<T> {
  return {
    ...state,
    items: [...state.items, payload],
    status:
      state.status === "failed"
        ? "failed"
        : state.status === "saved"
          ? "idle"
          : state.status,
  };
}

export function currentSave<T>(state: SaveQueueState<T>): T | null {
  return state.items[0] ?? null;
}

export function startSave<T>(state: SaveQueueState<T>): SaveQueueState<T> {
  if (!state.items[0] || state.status === "saving" || state.status === "failed") {
    return state;
  }

  return { ...state, status: "saving" };
}

export function completeSave<T>(state: SaveQueueState<T>): SaveQueueState<T> {
  if (!state.items[0]) {
    return state;
  }

  const items = state.items.slice(1);

  return {
    ...state,
    items,
    savedCount: state.savedCount + 1,
    status: items.length === 0 ? "saved" : "idle",
  };
}

export function failSave<T>(state: SaveQueueState<T>): SaveQueueState<T> {
  if (!state.items[0]) {
    return state;
  }

  return { ...state, status: "failed" };
}

export function retrySave<T>(state: SaveQueueState<T>): SaveQueueState<T> {
  if (!state.items[0] || state.status !== "failed") {
    return state;
  }

  return { ...state, status: "idle" };
}

export function unsavedSaveCount<T>(state: SaveQueueState<T>): number {
  return state.items.length;
}

export function isSaveQueueDrained<T>(state: SaveQueueState<T>): boolean {
  return state.items.length === 0;
}

export function isSaveQueueBlocked<T>(state: SaveQueueState<T>): boolean {
  return state.items.length >= SAVE_QUEUE_BACKLOG_LIMIT;
}
