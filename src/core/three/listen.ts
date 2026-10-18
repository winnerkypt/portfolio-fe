type Listeners = Readonly<Record<string, (event: PointerEvent) => void>>;

export function listen(element: HTMLElement, listeners: Listeners): () => void {
  const entries = Object.entries(listeners);
  for (const [type, handler] of entries) element.addEventListener(type, handler as EventListener);
  return () => {
    for (const [type, handler] of entries) element.removeEventListener(type, handler as EventListener);
  };
}
