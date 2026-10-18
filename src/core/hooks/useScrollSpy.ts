"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createNavLock, type NavLock } from "@/core/lib/nav-lock";
import { computeCurrent } from "@/core/lib/scroll-spy";

const SCROLLED_AFTER = 8;

interface ScrollSpy {
  readonly current: string | null;
  readonly scrolled: boolean;
  readonly lock: (id: string) => void;
}

function readSections(ids: readonly string[]) {
  return ids.flatMap((id) => {
    const el = document.getElementById(id);
    return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
  });
}

export function useScrollSpy(ids: readonly string[]): ScrollSpy {
  const [current, setCurrent] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const lockRef = useRef<NavLock | null>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLLED_AFTER);
      if (navLock.id() !== null) return;
      setCurrent(
        computeCurrent({
          sections: readSections(ids),
          viewportH: window.innerHeight,
          scrollY: window.scrollY,
          docH: document.documentElement.scrollHeight,
        }),
      );
    };
    const navLock = createNavLock(measure);
    const onScroll = () => {
      navLock.scroll();
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    lockRef.current = navLock;
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      navLock.dispose();
      lockRef.current = null;
    };
  }, [ids]);

  const lock = useCallback((id: string) => {
    lockRef.current?.click(id);
    setCurrent(id);
  }, []);

  return { current, scrolled, lock };
}
