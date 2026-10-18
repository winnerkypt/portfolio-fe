import { describe, expect, it } from "vitest";
import { profileImage } from "@/core/data/profile-image";
import { metadata } from "./layout";

describe("metadata", () => {
  it("shares the optimised portrait for open graph and twitter cards", () => {
    expect(metadata.openGraph?.images).toEqual([{ url: profileImage.src, width: profileImage.width, height: profileImage.height }]);
    expect(metadata.twitter?.images).toEqual([profileImage.src]);
  });
});
