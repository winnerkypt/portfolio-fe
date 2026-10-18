import { describe, expect, it } from "vitest";
import { scrollEdges } from "./scroll-edges";

describe("scrollEdges", () => {
  it("reports no hidden content when everything fits", () => {
    expect(scrollEdges(0, 300, 300)).toEqual({ start: false, end: false });
  });

  it("reports hidden content only at the end at scroll start", () => {
    expect(scrollEdges(0, 300, 520)).toEqual({ start: false, end: true });
  });

  it("reports hidden content on both sides mid-scroll", () => {
    expect(scrollEdges(100, 300, 520)).toEqual({ start: true, end: true });
  });

  it("reports hidden content only at the start when scrolled to the end, tolerating sub-pixel rounding", () => {
    expect(scrollEdges(219.6, 300, 520)).toEqual({ start: true, end: false });
  });
});
