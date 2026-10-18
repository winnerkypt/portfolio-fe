import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ hero: vi.fn(), ribbon: vi.fn(), parallax: vi.fn() }));

vi.mock("@/core/hooks/useHeroExit", () => ({ useHeroExit: mocks.hero }));
vi.mock("@/core/hooks/useRibbonBoost", () => ({ useRibbonBoost: mocks.ribbon }));
vi.mock("@/core/hooks/useParallax", () => ({ useParallax: mocks.parallax }));

import { ScrollMotion } from "./scroll-motion";

describe("ScrollMotion", () => {
  it("wires the hero exit, ribbon boost and parallax hooks and renders nothing", () => {
    const { container } = render(<ScrollMotion />);

    expect(mocks.hero).toHaveBeenCalled();
    expect(mocks.ribbon).toHaveBeenCalled();
    expect(mocks.parallax).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
