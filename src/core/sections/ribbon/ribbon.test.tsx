import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { profile } from "@/core/data/profile";
import { Ribbon } from "./ribbon";

describe("Ribbon", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Ribbon />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("repeats the items twice so the marquee loops seamlessly", () => {
    const { container } = render(<Ribbon />);

    const words = container.querySelectorAll(".ribbon-word");
    expect(words).toHaveLength(profile.ribbon.length * 2);
    expect(words[0]).toHaveTextContent("FULL STACK");
  });
});
