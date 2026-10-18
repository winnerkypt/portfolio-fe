import { describe, expect, it } from "vitest";
import { hostOf } from "./host-of";

describe("hostOf", () => {
  it("strips the www prefix", () => {
    expect(hostOf("https://www.edu.chula.ac.th/th")).toBe("edu.chula.ac.th");
  });

  it("keeps hosts without www untouched", () => {
    expect(hostOf("https://troikasyndicate.com/")).toBe("troikasyndicate.com");
  });

  it("drops paths, queries and ports", () => {
    expect(hostOf("https://lin.ee:443/TEpzE7o?x=1")).toBe("lin.ee");
  });

  it("returns an empty string for invalid urls", () => {
    expect(hostOf("not a url")).toBe("");
  });
});
