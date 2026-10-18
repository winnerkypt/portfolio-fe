export interface SpySection {
  readonly id: string;
  readonly top: number;
}

interface SpyInput {
  readonly sections: readonly SpySection[];
  readonly viewportH: number;
  readonly scrollY: number;
  readonly docH: number;
}

const LINE_RATIO = 0.35;
const END_TOLERANCE = 4;

export function computeCurrent({ sections, viewportH, scrollY, docH }: SpyInput): string | null {
  if (viewportH + scrollY >= docH - END_TOLERANCE) return "contact";
  const line = viewportH * LINE_RATIO;
  return sections.reduce<string | null>((current, s) => (s.top <= line ? s.id : current), null);
}
