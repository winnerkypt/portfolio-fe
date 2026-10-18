import "@testing-library/jest-dom/vitest";
import "vitest-canvas-mock";
import { vi } from "vitest";

vi.mock("@/core/libs/fonts", () => ({
  fontFamilies: { body: "Body", display: "Display", thai: "Thai" },
  fontClassNames: "",
}));
