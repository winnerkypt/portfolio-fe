"use client";

import "@/styles/nav.css";
import { ArrowIcon } from "@/core/components/icons/icons";
import { profile } from "@/core/data/profile";
import { useScrollSpy } from "@/core/hooks/useScrollSpy";

const links = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Work" },
] as const;

const spyIds = [...links.map((link) => link.id), "contact"];

export function Navbar() {
  const { current, scrolled, lock } = useScrollSpy(spyIds);
  const linkProps = (id: string) => ({
    href: `#${id}`,
    "aria-current": current === id ? ("true" as const) : undefined,
    onClick: () => lock(id),
  });

  return (
    <header className={scrolled ? "nav scrolled" : "nav"}>
      <div className="wrap">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <i aria-hidden="true">K</i>
            {profile.name}
          </a>
          <nav aria-label="Primary">
            <ul>
              {links.map((link) => (
                <li key={link.id}>
                  <a {...linkProps(link.id)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a className="btn btn-brand" {...linkProps("contact")}>
            Get in touch
            <ArrowIcon />
          </a>
        </div>
      </div>
    </header>
  );
}
