"use client";

import "@/styles/motion.css";
import { useReveal, type RevealRule } from "@/core/hooks/useReveal";

const rules: readonly RevealRule[] = [
  { selector: ".sec-head" },
  { selector: ".portrait-wrap", kind: "left" },
  { selector: ".about-text > *", stagger: true },
  { selector: "#skills .stack-card", kind: "pop", stagger: true },
  { selector: "#skills .toolbox" },
  { selector: ".files-stage", kind: "pop" },
  { selector: ".work-foot" },
  { selector: ".case-spread" },
  { selector: ".postcard", kind: "pop" },
];

export function MotionReveal() {
  useReveal(rules);
  return null;
}
