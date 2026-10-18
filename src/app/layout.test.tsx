import { describe, expect, it } from "vitest";
import { profileImage } from "@/core/data/profile-image";
import { metadata } from "./layout";

describe("metadata", () => {
  it("shares the optimised portrait for open graph and twitter cards", () => {
    expect(metadata.openGraph?.images).toEqual([{ url: profileImage.src, width: profileImage.width, height: profileImage.height }]);
    expect(metadata.twitter?.images).toEqual([profileImage.src]);
  });

  it("resolves canonical and share URLs against the live production domain", () => {
    expect(String(metadata.metadataBase)).toBe("https://kanyapat-w.vercel.app/");
    expect(metadata.openGraph && "url" in metadata.openGraph ? String(metadata.openGraph.url) : "").toBe("https://kanyapat-w.vercel.app");
  });
});
