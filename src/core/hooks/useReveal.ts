"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/core/lib/motion";

export interface RevealRule {
  readonly selector: string;
  readonly kind?: "left" | "right" | "pop";
  readonly stagger?: boolean;
}

function mark(rules: readonly RevealRule[]): HTMLElement[] {
  return rules.flatMap(({ selector, kind, stagger }) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el, i) => {
      el.dataset.rv = kind ?? "";
      if (stagger) el.style.setProperty("--rv-i", String(i));
      return el;
    }),
  );
}

export function useReveal(rules: readonly RevealRule[]): void {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const root = document.documentElement;
    const targets = mark(rules);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    const viewportH = window.innerHeight;
    for (const el of targets) {
      const { top, bottom } = el.getBoundingClientRect();
      if (top < viewportH && bottom > 0) el.classList.add("in");
      else io.observe(el);
    }
    root.classList.add("motion");

    return () => {
      io.disconnect();
      root.classList.remove("motion");
      for (const el of targets) {
        delete el.dataset.rv;
        el.style.removeProperty("--rv-i");
        el.classList.remove("in");
      }
    };
  }, [rules]);
}
