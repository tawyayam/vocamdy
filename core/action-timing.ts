type TimingEntry = {
  name: string;
  ms: number;
};

export type ActionTiming = {
  measure<T>(name: string, run: () => Promise<T>): Promise<T>;
  log(): void;
};

const noTiming: ActionTiming = {
  measure<T>(_name: string, run: () => Promise<T>) {
    return run();
  },
  log() {},
};

export function createActionTiming(action: string): ActionTiming {
  if (process.env.DEBUG_TIMING !== "1") {
    return noTiming;
  }

  const startedAt = performance.now();
  const entries: TimingEntry[] = [];

  return {
    async measure<T>(name: string, run: () => Promise<T>) {
      const entryStartedAt = performance.now();

      try {
        return await run();
      } finally {
        entries.push({
          name,
          ms: Math.round(performance.now() - entryStartedAt),
        });
      }
    },
    log() {
      const total = Math.round(performance.now() - startedAt);
      const details = entries
        .map(({ name, ms }) => `${name}=${ms}ms`)
        .join(" ");

      console.log(
        `[timing] ${action} total=${total}ms${details ? ` ${details}` : ""}`,
      );
    },
  };
}
