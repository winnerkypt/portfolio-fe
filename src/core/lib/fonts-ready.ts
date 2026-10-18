export async function awaitFonts(specs: readonly string[], timeoutMs = 3000): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return false;
  const fonts = document.fonts;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const loaded = Promise.all(specs.map((spec) => fonts.load(spec))).then(
    () => true,
    () => false,
  );
  try {
    return await Promise.race([loaded, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
