"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/core/data/types/project";
import { prefersReducedMotion } from "@/core/lib/motion";
import { scrollEdges } from "@/core/lib/scroll-edges";

interface FileIndexProps {
  readonly projects: readonly Project[];
  readonly activeIndex: number;
  readonly onSelect: (index: number) => void;
}

export function FileIndex({ projects, activeIndex, onSelect }: FileIndexProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelectorAll("button")[activeIndex];
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? "instant" : "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const sync = (): void => {
      const edges = scrollEdges(list.scrollLeft, list.clientWidth, list.scrollWidth);
      list.toggleAttribute("data-fade-start", edges.start);
      list.toggleAttribute("data-fade-end", edges.end);
    };
    sync();
    list.addEventListener("scroll", sync, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    observer?.observe(list);
    return () => {
      list.removeEventListener("scroll", sync);
      observer?.disconnect();
    };
  }, []);

  return (
    <ul className="file-index" aria-label="Projects" ref={listRef}>
      {projects.map((project, i) => (
        <li key={project.id}>
          <button type="button" aria-pressed={i === activeIndex} onClick={() => onSelect(i)}>
            {project.tab}
          </button>
        </li>
      ))}
    </ul>
  );
}
