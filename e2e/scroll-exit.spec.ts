import { expect, test } from "@playwright/test";

const copy = ".hero-copy h1";

async function scrollTo(page: import("@playwright/test").Page, y: number): Promise<void> {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

test.describe("hero scroll-out", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("fades and lifts the copy while leaving, and restores it at the top", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(copy)).toHaveCSS("opacity", "1");

    await scrollTo(page, 400);

    await expect.poll(() => page.locator(copy).evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(1);
    await expect.poll(() => page.locator(copy).evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");

    await scrollTo(page, 0);

    await expect(page.locator(copy)).toHaveCSS("opacity", "1");
  });

  test("tilts the pinned note further as the hero leaves", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const rotation = () => page.locator(".pin-note").evaluate((el) => {
      const [a, b] = getComputedStyle(el).transform.replace(/matrix\(|\)/g, "").split(",").map(Number);
      return (Math.atan2(b, a) * 180) / Math.PI;
    });
    const rest = await rotation();

    await scrollTo(page, 400);

    await expect.poll(rotation).toBeLessThan(rest - 2);
  });

  test("keeps the copy fully visible and still when reduced motion is requested", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", baseURL, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await scrollTo(page, 400);
    await page.waitForTimeout(300);

    await expect(page.locator(copy)).toHaveCSS("opacity", "1");
    expect(await page.locator(".hero").evaluate((el) => el.style.getPropertyValue("--hero-exit"))).toBe("");
    expect(await page.locator(".ribbon").evaluate((el) => el.style.getPropertyValue("--ribbon-skew"))).toBe("");
    await context.close();
  });
});
