import { expect, test, type Page } from "@playwright/test";

interface Rect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

async function rectOf(page: Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate((el) => {
    const { top, bottom, left, right } = el.getBoundingClientRect();
    return { top, bottom, left, right };
  });
}

const heroViewports = [
  { width: 924, height: 773 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
];

test.describe("hero layout", () => {
  for (const viewport of heroViewports) {
    test(`${viewport.width}x${viewport.height}: the badge clears the ribbon and the copy`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const stage = await rectOf(page, '[data-scene="badge"]');
      const card = await rectOf(page, ".badge-fallback");
      const ribbon = await rectOf(page, ".ribbon");
      const copy = await rectOf(page, ".hero-copy");

      expect(card.bottom).toBeLessThan(ribbon.top);
      if (viewport.width < 900) {
        expect(stage.bottom).toBeLessThan(ribbon.top);
        expect(copy.bottom).toBeLessThanOrEqual(stage.top);
      } else {
        expect(copy.right).toBeLessThan(card.left);
      }
    });
  }
});

test("contact: the email text never overlaps its Copy button and rows are tappable at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const links = page.locator(".pc-lines a");
  await links.first().scrollIntoViewIfNeeded();

  for (const link of await links.all()) {
    await expect.poll(async () => (await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  const email = await rectOf(page, '.pc-lines a[href^="mailto:"]');
  const copy = await rectOf(page, ".pc-copy");
  const apart = email.bottom <= copy.top || copy.bottom <= email.top || email.right <= copy.left || copy.right <= email.left;

  expect(apart).toBe(true);
});
