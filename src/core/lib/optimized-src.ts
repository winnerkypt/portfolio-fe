import { getImageProps } from "next/image";

interface OptimizedSrcOptions {
  readonly width: number;
  readonly height: number;
  readonly quality: number;
}

// getImageProps().src is the 2x candidate, so `width` is the 1x display width.
export function optimizedSrc(src: string, { width, height, quality }: OptimizedSrcOptions): string {
  return getImageProps({ src, alt: "", width, height, quality }).props.src;
}
