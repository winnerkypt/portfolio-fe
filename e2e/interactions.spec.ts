import { expect, test } from "@playwright/test";

test("nav Skills click highlights Skills and scrolls to it", async ({ page, isMobile }) => {
  test.skip(isMobile, "primary links are hidden on small screens");
  await page.goto("/");

  const skills = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Skills" });
  await skills.click();

  await expect(skills).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() => page.evaluate(() => document.getElementById("skills")?.getBoundingClientRect().top ?? 9999))
    .toBeLessThan(200);
  await expect(skills).toHaveAttribute("aria-current", "true");
});

test("scrolling to the page end highlights Get in touch", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));

  await expect(page.getByRole("link", { name: /Get in touch/ })).toHaveAttribute("aria-current", "true");
});

test("scrolled class appears on the nav after scrolling", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header.nav")).not.toHaveClass(/scrolled/);

  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));

  await expect(page.locator("header.nav")).toHaveClass(/scrolled/);
});

test("clicking the Troika tab updates the case spread", async ({ page }) => {
  await page.goto("/");

  const tab = page.getByRole("list", { name: "Projects" }).getByRole("button", { name: "Troika" });
  await tab.click();

  await expect(tab).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".case-spread h3")).toHaveText("Troika Syndicate");
  await expect(page.locator(".case-spread")).toContainText("03 / 05");
});

test("next on the last project wraps to the first", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "KSec" }).click();
  await expect(page.locator(".case-spread h3")).toHaveText("KSec Product Landing Page");
  await page.getByRole("button", { name: "Next project" }).click();

  await expect(page.locator(".case-spread h3")).toHaveText("EDU CU");
});

test("Copy shows Copied then resets", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const copy = page.getByRole("button", { name: "Copy email address" });
  await copy.click();

  await expect(page.locator(".pc-copy")).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("kanyapat.witta@gmail.com");
  await expect(page.locator(".pc-copy")).toHaveText("Copy", { timeout: 4000 });
});

test("content is fully visible when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/motion/);
  await expect(page.locator(".postcard")).toHaveCSS("opacity", "1");
});

test.describe("touch screens", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "mobile project only");
  });

  test("tapping Copy copies the address and reports it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page.getByRole("button", { name: "Copy email address" }).tap();

    await expect(page.locator(".pc-copy")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("kanyapat.witta@gmail.com");
  });

  test("tapping Get in touch in the nav scrolls to the contact section", async ({ page }) => {
    await page.goto("/");

    const cta = page.locator("header.nav").getByRole("link", { name: /Get in touch/ });
    await cta.tap();

    await expect(cta).toHaveAttribute("aria-current", "true");
    await expect
      .poll(() => page.evaluate(() => document.getElementById("contact")?.getBoundingClientRect().top ?? 9999))
      .toBeLessThan(400);
  });
});
