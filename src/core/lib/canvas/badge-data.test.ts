import { describe, expect, it } from "vitest";
import { contactLines } from "@/core/data/contacts";
import { profile } from "@/core/data/profile";
import { createBadgeData } from "./badge-data";

describe("createBadgeData", () => {
  const data = createBadgeData(profile, contactLines);

  it("takes names and copy from the profile", () => {
    expect(data.fullName).toBe(profile.fullName);
    expect(data.titleLines).toEqual(profile.badge.titleLines);
    expect(data.back.headline).toBe("FULL STACK");
  });

  it("builds contact lines from the contact data", () => {
    expect(data.back.email).toBe("kanyapat.witta@gmail.com");
    expect(data.back.phone).toBe("090-595-3589");
    expect(data.github).toBe("github.com/winnerkypt");
  });

  it("prints the lanyard from the first name and the accent word", () => {
    expect(data.lanyard).toEqual(["KANYAPAT", "PORTFOLIO"]);
  });

  it("seeds the barcode from the full name", () => {
    expect(data.barcodeSeed).toBe("KANYAPAT-WITTAYAMANITKUL");
  });

  it("throws a clear error when a contact line is missing", () => {
    expect(() => createBadgeData(profile, [])).toThrow(/contact line/);
  });
});
