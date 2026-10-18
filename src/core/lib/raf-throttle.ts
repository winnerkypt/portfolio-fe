export interface RafThrottled<T> {
  call(value: T): void;
  cancel(): void;
}

export function rafThrottle<T>(fn: (value: T) => void): RafThrottled<T> {
  let frame = 0;
  let latest: T;
  return {
    call(value) {
      latest = value;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        fn(latest);
      });
    },
    cancel() {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
