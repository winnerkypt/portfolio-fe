export function heroExitProgress(scrollY: number, heroTop: number, heroHeight: number, navH: number): number {
  const span = heroHeight - navH;
  if (!(span > 0)) return 0;
  const progress = (scrollY - heroTop) / span;
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}
