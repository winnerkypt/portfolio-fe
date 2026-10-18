export type CopyResult = "copied" | "selected";

interface CopyDeps {
  readonly clipboard: Pick<Clipboard, "writeText"> | undefined;
  readonly select: () => void;
}

export async function copyText(text: string, { clipboard, select }: CopyDeps): Promise<CopyResult> {
  try {
    if (!clipboard) throw new Error("Clipboard API unavailable");
    await clipboard.writeText(text);
    return "copied";
  } catch (error) {
    console.warn("clipboard write failed, selecting text instead", error);
    select();
    return "selected";
  }
}
