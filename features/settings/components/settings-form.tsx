"use client";

import { useActionState, useState } from "react";
import {
  BACKLOG_CAP_OPTIONS,
  BATCH_SIZE_OPTIONS,
  DAILY_NEW_OPTIONS,
  choicesWithStoredValue,
} from "@/core/settings-options";
import type { Settings } from "@/core/types";
import { saveSettings } from "../actions";
import type { SettingsActionResult } from "../state";
import { ChoiceGroup } from "./choice-group";

type SettingsFormProps = {
  settings: Settings;
};

const initialState: SettingsActionResult | null = null;

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialState,
  );
  const [dailyNew, setDailyNew] = useState(settings.dailyNew);
  const [batchSize, setBatchSize] = useState(settings.batchSize);
  const [backlogCap, setBacklogCap] = useState(settings.backlogCap);
  const dailyNewOptions = choicesWithStoredValue(
    DAILY_NEW_OPTIONS,
    settings.dailyNew,
  );
  const batchSizeOptions = choicesWithStoredValue(
    BATCH_SIZE_OPTIONS,
    settings.batchSize,
  );
  const backlogCapOptions = choicesWithStoredValue(
    BACKLOG_CAP_OPTIONS,
    settings.backlogCap,
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium text-ink">Study preferences</h2>
      <p className="mt-1 text-sm text-muted">
        These values apply to your next session.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <ChoiceGroup
          name="dailyNew"
          label="New words a day"
          description="How many new words you learn each day."
          options={dailyNewOptions}
          value={dailyNew}
          disabled={pending}
          onChange={setDailyNew}
        />
        <ChoiceGroup
          name="batchSize"
          label="Words per round"
          description="You read this many new words together, then take a short quiz on them."
          options={batchSizeOptions}
          value={batchSize}
          disabled={pending}
          onChange={setBatchSize}
        />
        <ChoiceGroup
          name="backlogCap"
          label="Pause new words after"
          description="When more than this many reviews are overdue, new words pause until you catch up."
          options={backlogCapOptions}
          value={backlogCap}
          disabled={pending}
          onChange={setBacklogCap}
        />
        {state?.ok ? (
          <p role="status" className="text-sm text-ink">
            Settings saved.
          </p>
        ) : null}
        {state?.ok === false ? (
          <p role="alert" className="text-sm text-warn">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-primary px-4 py-2 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
