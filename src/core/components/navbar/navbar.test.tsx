import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Navbar } from "./navbar";

describe("Navbar", () => {
  it("links to the three content sections", () => {
    render(<Navbar />);

    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav).toHaveTextContent("About");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("href", "#skills");
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "#projects");
  });

  it("has a logo and a contact call to action", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /Kanyapat/ })).toHaveAttribute("href", "#top");
    expect(screen.getByRole("link", { name: /Get in touch/ })).toHaveAttribute("href", "#contact");
  });

  it("marks the clicked link as current and moves it on the next click", () => {
    render(<Navbar />);
    const skills = screen.getByRole("link", { name: "Skills" });
    const work = screen.getByRole("link", { name: "Work" });

    expect(skills).not.toHaveAttribute("aria-current");
    fireEvent.click(skills);
    expect(skills).toHaveAttribute("aria-current", "true");
    fireEvent.click(work);
    expect(work).toHaveAttribute("aria-current", "true");
    expect(skills).not.toHaveAttribute("aria-current");
  });

  it("marks the contact call to action as current when clicked", () => {
    render(<Navbar />);
    const cta = screen.getByRole("link", { name: /Get in touch/ });

    fireEvent.click(cta);
    expect(cta).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute("aria-current");
  });

  describe("scrolled state", () => {
    afterEach(() => {
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    });

    it("adds the scrolled class past 8px of scroll", async () => {
      const { container } = render(<Navbar />);
      const header = container.querySelector("header") as HTMLElement;

      expect(header).not.toHaveClass("scrolled");
      Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      expect(header).toHaveClass("scrolled");
    });
  });
});
