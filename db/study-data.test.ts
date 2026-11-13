import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";
import { getStudyData } from "./study-data";
import type { Database } from "./database.types";

const settingsRow = {
  active_deck_id: "awl",
  daily_new: 12,
  batch_size: 6,
  backlog_cap: 40,
};

const progressRow = {
  word_id: "awl:context",
  deck_id: "awl",
  stage: 2,
  due_date: "2026-11-09",
  introduced_on: "2026-10-26",
  graduated_on: null,
  correct_count: 2,
  wrong_count: 1,
  last_answered_on: "2026-11-06",
};

const activityRow = {
  study_day: "2026-11-06",
  answers_count: 4,
  new_words_count: 1,
  reviews_count: 3,
  completed: null,
};

function createClient(data: unknown) {
  const rpc = vi.fn().mockResolvedValue({ data, error: null });
  const client = {
    rpc,
  } as unknown as SupabaseClient<Database, "public">;

  return { client, rpc };
}

describe("getStudyData", () => {
  it("maps the RPC result to core types", async () => {
    const { client, rpc } = createClient({
      settings: settingsRow,
      progress: [progressRow],
      activities: [activityRow],
    });

    const result = await getStudyData(client);

    expect(rpc).toHaveBeenCalledWith("get_study_data");
    expect(result.settings).toEqual({
      activeDeckId: "awl",
      dailyNew: 12,
      batchSize: 6,
      backlogCap: 40,
    });
    expect(result.progress).toEqual([
      {
        wordId: "awl:context",
        deckId: "awl",
        stage: 2,
        dueDate: "2026-11-09",
        introducedOn: "2026-10-26",
        graduatedOn: null,
        correctCount: 2,
        wrongCount: 1,
        lastAnsweredOn: "2026-11-06",
      },
    ]);
    expect(result.activities).toEqual([
      {
        studyDay: "2026-11-06",
        answersCount: 4,
        newWordsCount: 1,
        reviewsCount: 3,
        completed: null,
      },
    ]);
  });

  it("uses default settings when no settings row exists", async () => {
    const { client } = createClient({
      settings: null,
      progress: [],
      activities: [],
    });

    const result = await getStudyData(client);

    expect(result.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.progress).toEqual([]);
  });

  it("accepts an empty study history", async () => {
    const { client } = createClient({
      settings: settingsRow,
      progress: [],
      activities: [],
    });

    const result = await getStudyData(client);

    expect(result.progress).toEqual([]);
    expect(result.activities).toEqual([]);
  });

  it("rejects a malformed RPC result", async () => {
    const { client } = createClient({
      settings: settingsRow,
      progress: [{ ...progressRow, stage: 5 }],
      activities: [activityRow],
    });

    await expect(getStudyData(client)).rejects.toThrow();
  });
});
