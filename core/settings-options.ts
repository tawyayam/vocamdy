export const DAILY_NEW_OPTIONS = [5, 10, 15, 20] as const;
export const BATCH_SIZE_OPTIONS = [3, 5, 8, 10] as const;
export const BACKLOG_CAP_OPTIONS = [20, 30, 50, 100] as const;

export function choicesWithStoredValue(
  options: readonly number[],
  stored: number,
): number[] {
  if (options.includes(stored)) {
    return [...options];
  }

  return [...options, stored].sort((left, right) => left - right);
}
