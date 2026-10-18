import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { contactLines } from "@/core/data/contacts";
import { Contact } from "./contact";

describe("Contact", () => {
  it("is the #contact landmark with the postcard heading", () => {
    const { container } = render(<Contact />);

    expect(container.querySelector("section#contact")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/LET'S\s*TALK/);
  });

  it("links email, phone, GitHub and LinkedIn with the right schemes", () => {
    render(<Contact />);

    expect(screen.getByRole("link", { name: /kanyapat\.witta@gmail\.com/ })).toHaveAttribute(
      "href",
      "mailto:kanyapat.witta@gmail.com",
    );
    expect(screen.getByRole("link", { name: /090-595-3589/ })).toHaveAttribute("href", "tel:0905953589");
    expect(screen.getByRole("link", { name: /winnerkypt/ })).toHaveAttribute(
      "href",
      "https://github.com/winnerkypt",
    );
    expect(screen.getByRole("link", { name: /Kanyapat Wittayamanitkul/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/www\.linkedin\.com\//),
    );
  });

  it("opens external links with noopener", () => {
    render(<Contact />);

    for (const line of contactLines.filter((l) => l.external)) {
      const link = screen.getByRole("link", { name: new RegExp(line.text) });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("renders the live copy button and decorative stamp and postmark", () => {
    const { container } = render(<Contact />);

    expect(screen.getByRole("button", { name: "Copy email address" })).toBeInTheDocument();
    expect(container.querySelector(".stamp")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".postmark")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("BANGKOK")).toBeInTheDocument();
  });

  it("puts the board grid on its own decorative layer and drifts the stickers", () => {
    const { container } = render(<Contact />);

    const layer = container.querySelector(".pb-grid [data-parallax]");
    expect(layer).not.toBeNull();
    expect(container.querySelector(".pb-grid")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".postcard")).not.toHaveAttribute("data-parallax");
    expect(container.querySelectorAll(".postcard [data-parallax]").length).toBeGreaterThanOrEqual(3);
  });
});
