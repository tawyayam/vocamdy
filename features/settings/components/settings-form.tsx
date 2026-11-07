"use client";

import { useActionState } from "react";
import type { Settings } from "@/core/types";
import { saveSettings } from "../actions";
import type { SettingsActionResult } from "../state";

type SettingsFormProps = {
  settings: Settings;
};

type NumberFieldProps = {
  id: string;
  name: string;
  label: string;
  description: string;
  min: number;
  max: number;
  defaultValue: number;
  disabled: boolean;
};

const initialState: SettingsActionResult | null = null;

function NumberField({
  id,
  name,
  label,
  description,
  min,
  max,
  defaultValue,
  disabled,
}: NumberFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        defaultValue={defaultValue}
        disabled={disabled}
        required
        className="mt-2 h-11 w-full rounded-xl border border-border bg-paper px-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-60"
      />
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialState,
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium text-ink">Study preferences</h2>
      <p className="mt-1 text-sm text-muted">
        These values apply to your next session.
      </p>
      <form action={formAction} className="mt-4 space-y-4">
        <NumberField
          id="daily-new"
          name="dailyNew"
          label="New words a day"
          description="How many new words Today plans each day (1 to 30)."
          min={1}
          max={30}
          defaultValue={settings.dailyNew}
          disabled={pending}
        />
        <NumberField
          id="batch-size"
          name="batchSize"
          label="Batch size"
          description="How many new words are shown together (3 to 10)."
          min={3}
          max={10}
          defaultValue={settings.batchSize}
          disabled={pending}
        />
        <NumberField
          id="backlog-cap"
          name="backlogCap"
          label="Backlog limit"
          description="Pause new words when overdue reviews reach this count (10 to 100)."
          min={10}
          max={100}
          defaultValue={settings.backlogCap}
          disabled={pending}
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
          className="min-h-11 rounded-xl bg-primary px-4 py-2 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
