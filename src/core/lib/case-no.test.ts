import { describe, expect, it } from "vitest";
import { formatCaseNo } from "./case-no";

describe("formatCaseNo", () => {
  it("formats a zero-based index as a padded 1-based pair", () => {
    expect(formatCaseNo(0, 5)).toBe("01 / 05");
    expect(formatCaseNo(4, 5)).toBe("05 / 05");
  });

  it("does not truncate two-digit values", () => {
    expect(formatCaseNo(11, 12)).toBe("12 / 12");
  });
});
