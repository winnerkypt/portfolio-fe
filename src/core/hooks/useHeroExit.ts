"use client";

import { useEffect } from "react";
import { heroExitProgress } from "@/core/lib/hero-exit";
import { prefersReducedMotion } from "@/core/lib/motion";
import { scrollMotion } from "@/core/lib/scroll-motion";

const FALLBACK_NAV_H = 76;

function navHeight(): number {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"));
  return Number.isFinite(value) ? value : FALLBACK_NAV_H;
}

export function useHeroExit(selector = ".hero"): void {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(selector);
    if (!hero || prefersReducedMotion()) return;

    // Geometry is cached so scroll frames never force a layout read after our own style writes.
    let geometry = { top: 0, height: 0, navH: FALLBACK_NAV_H };
    const measure = (): void => {
      const rect = hero.getBoundingClientRect();
      geometry = { top: rect.top + window.scrollY, height: rect.height, navH: navHeight() };
    };
    let written = "";
    const apply = (scrollY: number): void => {
      const progress = heroExitProgress(scrollY, geometry.top, geometry.height, geometry.navH);
      const next = progress.toFixed(2);
      if (next === written) return;
      written = next;
      hero.style.setProperty("--hero-exit", next);
      if (progress > 0 && progress < 1) hero.setAttribute("data-exiting", "");
      else hero.removeAttribute("data-exiting");
    };
    const onResize = (): void => {
      measure();
      apply(window.scrollY);
    };

    measure();
    const unsubscribe = scrollMotion.subscribe((sample) => apply(sample.scrollY));
    window.addEventListener("resize", onResize, { passive: true });
    apply(window.scrollY);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", onResize);
      hero.style.removeProperty("--hero-exit");
      hero.removeAttribute("data-exiting");
    };
  }, [selector]);
}
