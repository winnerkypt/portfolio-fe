const TOLERANCE_PX = 1;

export interface ScrollEdges {
  readonly start: boolean;
  readonly end: boolean;
}

export function scrollEdges(scrollLeft: number, clientWidth: number, scrollWidth: number): ScrollEdges {
  return {
    start: scrollLeft > TOLERANCE_PX,
    end: scrollLeft + clientWidth < scrollWidth - TOLERANCE_PX,
  };
}
