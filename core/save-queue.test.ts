import { describe, expect, it } from "vitest";
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
} from "./save-queue";

describe("save queue", () => {
  it("starts empty and drained", () => {
    const state = createSaveQueue<string>();

    expect(state).toEqual({ items: [], status: "idle", savedCount: 0 });
    expect(currentSave(state)).toBeNull();
    expect(unsavedSaveCount(state)).toBe(0);
    expect(isSaveQueueDrained(state)).toBe(true);
  });

  it("keeps queued answers in the order they were added", () => {
    let state = createSaveQueue<string>();

    state = enqueueSave(state, "first");
    state = enqueueSave(state, "second");
    state = enqueueSave(state, "third");

    expect(state.items).toEqual(["first", "second", "third"]);
    expect(currentSave(state)).toBe("first");
    expect(unsavedSaveCount(state)).toBe(3);
    expect(isSaveQueueDrained(state)).toBe(false);
  });

  it("marks the first answer as saving", () => {
    const state = startSave(enqueueSave(createSaveQueue<string>(), "first"));

    expect(state.status).toBe("saving");
    expect(currentSave(state)).toBe("first");
  });

  it("removes a saved answer and keeps the rest in order", () => {
    let state = enqueueSave(createSaveQueue<string>(), "first");
    state = enqueueSave(state, "second");
    state = startSave(state);

    state = completeSave(state);

    expect(state.items).toEqual(["second"]);
    expect(state.status).toBe("idle");
    expect(state.savedCount).toBe(1);
    expect(currentSave(state)).toBe("second");
    expect(isSaveQueueDrained(state)).toBe(false);
  });

  it("reports the queue as saved once the last answer completes", () => {
    let state = startSave(enqueueSave(createSaveQueue<string>(), "only"));

    state = completeSave(state);

    expect(state.items).toEqual([]);
    expect(state.status).toBe("saved");
    expect(state.savedCount).toBe(1);
    expect(currentSave(state)).toBeNull();
    expect(isSaveQueueDrained(state)).toBe(true);
  });

  it("keeps a failed answer at the front", () => {
    let state = enqueueSave(createSaveQueue<string>(), "first");
    state = enqueueSave(state, "second");
    state = startSave(state);

    state = failSave(state);

    expect(state.items).toEqual(["first", "second"]);
    expect(state.status).toBe("failed");
    expect(currentSave(state)).toBe("first");
    expect(isSaveQueueDrained(state)).toBe(false);
  });

  it("retries from the oldest answer after a failure", () => {
    let state = enqueueSave(createSaveQueue<string>(), "first");
    state = enqueueSave(state, "second");
    state = failSave(startSave(state));

    state = retrySave(state);
    expect(state.status).toBe("idle");
    expect(currentSave(state)).toBe("first");

    state = completeSave(startSave(state));
    expect(state.savedCount).toBe(1);
    expect(currentSave(state)).toBe("second");

    state = completeSave(startSave(state));
    expect(state.savedCount).toBe(2);
    expect(isSaveQueueDrained(state)).toBe(true);
    expect(state.status).toBe("saved");
  });

  it("keeps a failure when new answers join the queue", () => {
    let state = enqueueSave(createSaveQueue<string>(), "first");
    state = failSave(startSave(state));

    state = enqueueSave(state, "second");

    expect(state.items).toEqual(["first", "second"]);
    expect(state.status).toBe("failed");
  });

  it("ignores completion and retries when the queue is empty", () => {
    const state = createSaveQueue<string>();

    expect(completeSave(state)).toBe(state);
    expect(failSave(state)).toBe(state);
    expect(retrySave(state)).toBe(state);
  });

  it("blocks after five unsent failed answers until a retry succeeds", () => {
    let state = createSaveQueue<string>();

    for (const answer of ["one", "two", "three", "four"]) {
      state = enqueueSave(state, answer);
    }
    state = failSave(startSave(state));

    expect(isSaveQueueBlocked(state)).toBe(false);

    state = enqueueSave(state, "five");
    expect(isSaveQueueBlocked(state)).toBe(true);

    state = retrySave(state);
    expect(isSaveQueueBlocked(state)).toBe(true);

    state = completeSave(startSave(state));
    expect(state.items).toEqual(["two", "three", "four", "five"]);
    expect(isSaveQueueBlocked(state)).toBe(false);
  });
});
