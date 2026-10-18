import { describe, expect, it } from "vitest";
import { computeCurrent } from "./scroll-spy";

const sections = [
  { id: "about", top: 600 },
  { id: "skills", top: 1500 },
  { id: "projects", top: 2400 },
  { id: "contact", top: 3300 },
];
const base = { viewportH: 1000, scrollY: 0, docH: 4300 };

describe("computeCurrent", () => {
  it("is null above the first section", () => {
    expect(computeCurrent({ ...base, sections })).toBeNull();
  });

  it("picks the last section whose top is at or above 35% of the viewport", () => {
    const moved = sections.map((s) => ({ ...s, top: s.top - 1200 }));
    expect(computeCurrent({ ...base, scrollY: 1200, sections: moved })).toBe("skills");
  });

  it("includes the 35% boundary", () => {
    const moved = [{ id: "about", top: 350 }];
    expect(computeCurrent({ ...base, sections: moved })).toBe("about");
    expect(computeCurrent({ ...base, sections: [{ id: "about", top: 351 }] })).toBeNull();
  });

  it("returns contact when the viewport bottom reaches the document end", () => {
    const atEnd = { viewportH: 1000, scrollY: 3300, docH: 4300 };
    expect(computeCurrent({ ...atEnd, sections: sections.map((s) => ({ ...s, top: s.top - 3300 })) })).toBe("contact");
  });

  it("allows a 4px tolerance at the end", () => {
    expect(computeCurrent({ viewportH: 1000, scrollY: 3296, docH: 4300, sections })).toBe("contact");
    expect(computeCurrent({ viewportH: 1000, scrollY: 3295, docH: 4300, sections })).toBeNull();
  });

  it("is null for an empty section list", () => {
    expect(computeCurrent({ ...base, sections: [] })).toBeNull();
  });
});
