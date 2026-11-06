import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/core/types";
import type { Database } from "./database.types";
import { saveProgress } from "./progress";

const progress: Progress = {
  wordId: "awl:context",
  deckId: "awl",
  stage: 2,
  dueDate: "2026-11-09",
  introducedOn: "2026-10-26",
  graduatedOn: null,
  correctCount: 2,
  wrongCount: 1,
  lastAnsweredOn: "2026-11-06",
};

function createClient() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const client = {
    from: vi.fn(() => ({ upsert })),
  } as unknown as SupabaseClient<Database, "public">;

  return { client, upsert };
}

describe("saveProgress", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets updated_at to the current time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T12:34:56.000Z"));
    const { client, upsert } = createClient();

    await saveProgress(client, "user-id", progress);

    const [row, options] = upsert.mock.calls[0] as [
      Record<string, unknown>,
      { onConflict: string },
    ];

    expect(row.updated_at).toBe("2026-11-06T12:34:56.000Z");
    expect(options).toEqual({ onConflict: "user_id,word_id" });
  });
});
