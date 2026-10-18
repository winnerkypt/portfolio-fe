import { describe, expect, it } from "vitest";
import { contactLines } from "./contacts";
import { profile } from "./profile";
import { projects } from "./projects";
import { skillGroups, toolbox } from "./skills";

describe("projects", () => {
  it("keeps the five projects in their original order", () => {
    expect(projects.map((p) => p.tab)).toEqual(["EDU CU", "Reborna", "Troika", "Systems", "KSec"]);
  });

  it("gives every project the fields the case spread needs", () => {
    for (const p of projects) {
      expect(p.desc).not.toBe("");
      expect(p.tags.length).toBeGreaterThan(0);
      expect(p.year).toBeGreaterThan(2000);
      expect(p.image).toMatch(/^\/images\/projects\/.+\.png$/);
      expect(p.link).toMatch(/^https:\/\//);
    }
  });
});

describe("contactLines", () => {
  it("uses mailto, tel and https hrefs", () => {
    const hrefs = Object.fromEntries(contactLines.map((c) => [c.id, c.href]));
    expect(hrefs.email).toMatch(/^mailto:/);
    expect(hrefs.phone).toMatch(/^tel:/);
    expect(hrefs.github).toMatch(/^https:\/\/github\.com\//);
    expect(hrefs.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
  });
});

describe("skills and profile", () => {
  it("defines frontend and backend groups plus a toolbox", () => {
    expect(skillGroups.map((g) => g.id)).toEqual(["frontend", "backend"]);
    expect(toolbox.items.length).toBeGreaterThan(0);
  });

  it("positions the profile as full stack", () => {
    expect(profile.role).toBe("Full Stack Engineer");
    expect(profile.kicker).toBe("Open to Full Stack Engineer roles");
  });
});
