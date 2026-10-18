import { expect, test } from "@playwright/test";

test("home page renders the headline h1", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toHaveText("I build web platforms end to end.");
});

test("home page contains all four section landmarks", async ({ page }) => {
  await page.goto("/");

  for (const id of ["about", "skills", "projects", "contact"]) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
});

test("badge and drawer scene mount points exist", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-scene="badge"]')).toHaveCount(1);
  await expect(page.locator('[data-scene="drawer"]')).toHaveCount(1);
});

test("no section is wider than the viewport, even without the clip safety net", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: "html, body { overflow-x: visible !important; }" });

  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});
