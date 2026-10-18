interface ContainerHandlers {
  readonly onResize: (width: number, height: number) => void;
  readonly onVisibilityChange: (visible: boolean) => void;
}

export function observeContainer(container: HTMLElement, { onResize, onVisibilityChange }: ContainerHandlers): () => void {
  let intersecting = true;
  const report = (): void => onVisibilityChange(intersecting && !document.hidden);

  const resizeObserver = new ResizeObserver(() => onResize(container.clientWidth, container.clientHeight));
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    report();
  });
  intersectionObserver.observe(container);
  document.addEventListener("visibilitychange", report);

  onResize(container.clientWidth, container.clientHeight);

  return () => {
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", report);
  };
}
