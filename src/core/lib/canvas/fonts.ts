export interface CanvasFonts {
  readonly body: string;
  readonly display: string;
}

export function displayFont(px: number, fonts: CanvasFonts): string {
  return `${px}px ${fonts.display}, Impact, sans-serif`;
}

export function bodyFont(px: number, fonts: CanvasFonts, weight = 400): string {
  return `${weight} ${px}px ${fonts.body}, sans-serif`;
}

export function fontSpecs(fonts: CanvasFonts): readonly string[] {
  return [displayFont(84, fonts), bodyFont(24, fonts, 400), bodyFont(24, fonts, 500), bodyFont(24, fonts, 700)];
}
