import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@/core/types";
import { saveActivity } from "./activity";
import type { Database } from "./database.types";

const activity: Activity = {
  studyDay: "2026-11-05",
  answersCount: 3,
  newWordsCount: 0,
  reviewsCount: 2,
  completed: null,
};

function createClient() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const client = {
    from: vi.fn(() => ({ upsert })),
  } as unknown as SupabaseClient<Database, "public">;

  return { client, upsert };
}

describe("saveActivity", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets updated_at to the current time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:34:56.000Z"));
    const { client, upsert } = createClient();

    await saveActivity(client, "user-id", activity);

    const [row, options] = upsert.mock.calls[0] as [
      Record<string, unknown>,
      { onConflict: string },
    ];

    expect(row.updated_at).toBe("2026-11-05T12:34:56.000Z");
    expect(options).toEqual({ onConflict: "user_id,study_day" });
  });
});
