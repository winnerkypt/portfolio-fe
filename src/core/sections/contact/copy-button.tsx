"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/core/lib/clipboard";

const RESET_MS = 1600;

const labels = { idle: "Copy", copied: "Copied", selected: "Selected" } as const;
const announcements = { idle: "", copied: "copied", selected: "selected, press Cmd or Ctrl+C to copy" } as const;

interface CopyButtonProps {
  readonly text: string;
  readonly label?: string;
}

const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function CopyButton({ text, label = "email address" }: CopyButtonProps) {
  // A fresh object per copy (not just the status string) re-arms the reset timer on repeat clicks.
  const [state, setState] = useState<{ readonly status: keyof typeof labels }>({ status: "idle" });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    const timer = setTimeout(() => setState({ status: "idle" }), RESET_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const selectSibling = () => {
    const target = buttonRef.current?.previousElementSibling;
    const selection = window.getSelection();
    if (!target || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const onClick = async () => {
    const status = await copyText(text, { clipboard: navigator.clipboard, select: selectSibling });
    setState({ status });
  };

  const status = announcements[state.status];

  return (
    <>
      <button type="button" className="pc-copy" ref={buttonRef} onClick={onClick} aria-label={`Copy ${label}`}>
        {labels[state.status]}
      </button>
      <span className="sr-only" role="status">
        {status ? `${capitalise(label)} ${status}` : ""}
      </span>
    </>
  );
}
