import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the headline as the page h1", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "I build web platforms end to end.",
    );
  });

  it("shows the full stack kicker and lede", () => {
    render(<Hero />);

    expect(screen.getByText("Open to Full Stack Engineer roles")).toBeInTheDocument();
    expect(screen.getByText(/Full-stack engineer in Bangkok/)).toBeInTheDocument();
  });

  it("links the call to action buttons to work and contact", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: /See my work/ })).toHaveAttribute("href", "#projects");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "#contact");
  });

  it("exposes the badge scene mount point with the fallback image", () => {
    const { container } = render(<Hero />);

    const stage = container.querySelector('[data-scene="badge"]');
    expect(stage).not.toBeNull();
    expect(stage).toHaveAttribute("role", "img");
    expect(stage?.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("badge.webp"),
    );
  });

  it("loads the LCP fallback image at high priority", () => {
    const { container } = render(<Hero />);

    expect(container.querySelector('[data-scene="badge"] img')).toHaveAttribute("fetchpriority", "high");
  });

  it("hides decorative notes and arrows from assistive tech", () => {
    const { container } = render(<Hero />);

    const note = screen.getByText("NOW BUILDING").closest("div");
    expect(note).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".hint-arrow")).toHaveAttribute("aria-hidden", "true");
  });

  it("places the copy before the badge so the stacked layout reads copy first, then badge", () => {
    const { container } = render(<Hero />);

    const copy = container.querySelector(".hero-copy");
    const stage = container.querySelector('[data-scene="badge"]');
    expect(copy?.compareDocumentPosition(stage as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
