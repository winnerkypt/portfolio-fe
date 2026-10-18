"use client";

import "@/styles/parallax.css";
import { useHeroExit } from "@/core/hooks/useHeroExit";
import { useParallax } from "@/core/hooks/useParallax";
import { useRibbonBoost } from "@/core/hooks/useRibbonBoost";

export function ScrollMotion() {
  useHeroExit();
  useRibbonBoost();
  useParallax();
  return null;
}
