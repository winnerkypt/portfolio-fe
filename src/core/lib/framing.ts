export const WIDE_BREAKPOINT = 900;
export const CAMERA_FOV = 30;

const HALF_FOV_TAN = Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
const WIDE_PIN_OFFSET_PX = 150;
const CARD_UNITS = 3.4;
const STACKED_PIN_PX = 32;
const STACKED_CARD_RATIO = 0.84;
const STACKED_CARD_MAX_PX = 560;
const STACKED_DROP_UNITS = 3.2;

function stackedScale(width: number): number {
  return Math.min(STACKED_CARD_MAX_PX, width * STACKED_CARD_RATIO) / CARD_UNITS;
}

export function stackedStageHeight(width: number): number {
  return STACKED_PIN_PX + STACKED_DROP_UNITS * stackedScale(width);
}

export interface Framing {
  readonly cameraZ: number;
  readonly halfHeight: number;
  readonly halfWidth: number;
  readonly anchorX: number;
  readonly anchorY: number;
}

function stackedFraming(width: number, height: number): Framing {
  const scale = stackedScale(width);
  const halfHeight = height / (2 * scale);
  return {
    cameraZ: halfHeight / HALF_FOV_TAN,
    halfHeight,
    halfWidth: width / (2 * scale),
    anchorX: 0,
    anchorY: halfHeight - STACKED_PIN_PX / scale,
  };
}

export interface FramingMode {
  readonly wide: boolean;
}

// The stylesheet switches layout on viewport width; the container excludes the scrollbar, so ask the same media query.
export function isWideViewport(): boolean {
  if (typeof matchMedia !== "function") return false;
  return matchMedia(`(min-width: ${WIDE_BREAKPOINT}px)`).matches;
}

export function computeFraming(
  width: number,
  height: number,
  mode: FramingMode = { wide: width >= WIDE_BREAKPOINT },
): Framing {
  if (!mode.wide) return stackedFraming(width, height);
  const aspect = width / height;
  const cameraZ = Math.max(8.4, 2.3 / HALF_FOV_TAN);
  const halfHeight = HALF_FOV_TAN * cameraZ;
  const halfWidth = halfHeight * aspect;
  return {
    cameraZ,
    halfHeight,
    halfWidth,
    anchorX: Math.min(1.55, halfWidth - 1.8),
    anchorY: halfHeight - (WIDE_PIN_OFFSET_PX / height) * 2 * halfHeight,
  };
}
