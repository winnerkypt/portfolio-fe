import { expect, test, type Page } from "@playwright/test";

async function scrollTo(page: Page, selector: string, offset = 0): Promise<void> {
  await page.evaluate(
    ([sel, extra]) => {
      const top = document.querySelector(sel as string)!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (extra as number), behavior: "instant" });
    },
    [selector, offset],
  );
}

const readPy = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).style.getPropertyValue("--py"));

test.describe("parallax", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("shifts the portrait relative to the text once About is scrolled into view", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await scrollTo(page, "#about", -120);

    await expect.poll(() => readPy(page, ".portrait")).not.toBe("");
    const portrait = await page.locator(".portrait").evaluate((el) => getComputedStyle(el).translate);
    const text = await page.locator(".about-text .big").evaluate((el) => getComputedStyle(el).translate);
    expect(portrait).not.toBe(text);
    expect(Math.abs(Number(await readPy(page, ".portrait")))).toBeLessThanOrEqual(40);
  });

  test("keeps tape on the photo and layers moving at different rates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await scrollTo(page, "#about", -250);

    await expect.poll(() => readPy(page, ".portrait-circle")).not.toBe("");
    const circle = Number(await readPy(page, ".portrait-circle"));
    const photo = Number(await readPy(page, ".portrait"));
    expect(circle).not.toBe(photo);
    const tape = await page.locator("#about .tape").boundingBox();
    const portrait = await page.locator(".portrait").boundingBox();
    expect(tape && portrait && tape.y < portrait.y + 24 && tape.y + tape.height > portrait.y - 24).toBe(true);
  });

  test("never leaves the spread or the tab strip behind", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await scrollTo(page, ".case-spread", -150);

    await expect.poll(() => readPy(page, ".cs-print")).not.toBe("");
    expect(await readPy(page, ".case-spread")).toBe("");
    expect(await readPy(page, ".file-index")).toBe("");
    expect(await readPy(page, '[data-scene="drawer"]')).toBe("");
  });

  test("adds no horizontal overflow at any parallax position", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    for (const sel of ["#about", "#skills", "#contact"]) {
      await scrollTo(page, sel, 150);
      await page.waitForTimeout(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("writes no --py under reduced motion", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", baseURL, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await scrollTo(page, "#about", -120);
    await page.waitForTimeout(200);

    expect(await readPy(page, ".portrait")).toBe("");
    expect(await page.locator(".portrait").evaluate((el) => getComputedStyle(el).translate)).toBe("none");
    await context.close();
  });
});
