export interface Disposers {
  add(dispose: () => void): void;
  run(): void;
}

export function createDisposers(): Disposers {
  const stack: (() => void)[] = [];
  return {
    add(dispose) {
      stack.push(dispose);
    },
    run() {
      const failures: unknown[] = [];
      for (const dispose of stack.splice(0).reverse()) {
        try {
          dispose();
        } catch (error) {
          failures.push(error);
        }
      }
      if (failures.length) throw failures[0];
    },
  };
}

export function buildGuarded<T>(build: (disposers: Disposers) => T): T {
  const disposers = createDisposers();
  try {
    return build(disposers);
  } catch (error) {
    try {
      disposers.run();
    } catch (cleanup) {
      throw new AggregateError([error, cleanup], "Scene construction failed and cleanup failed");
    }
    throw error;
  }
}
