"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { moveChoiceIndex } from "@/core/choice-navigation";

type ChoiceGroupProps = {
  name: string;
  label: string;
  description: string;
  options: readonly number[];
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
};

export function ChoiceGroup({
  name,
  label,
  description,
  options,
  value,
  disabled,
  onChange,
}: ChoiceGroupProps) {
  const legendId = useId();
  const descriptionId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const step =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (step === 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = moveChoiceIndex(index, step, options.length);

    if (nextIndex < 0) {
      return;
    }

    onChange(options[nextIndex]);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <fieldset className="w-full min-w-0">
      <legend id={legendId} className="text-sm font-medium text-ink">
        {label}
      </legend>
      <p id={descriptionId} className="mt-1 text-xs text-muted">
        {description}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        aria-describedby={descriptionId}
        className="mt-2 grid w-full grid-cols-4 gap-3"
      >
        {options.map((option, index) => {
          const checked = option === value;

          return (
            <button
              key={option}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 w-full rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${
                checked
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-paper text-ink hover:border-primary/40"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </fieldset>
  );
}
