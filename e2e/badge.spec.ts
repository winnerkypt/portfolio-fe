import { expect, test } from "@playwright/test";

const stage = '[data-scene="badge"]';

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } });

test.describe("badge scene", () => {
  test.setTimeout(90_000);

  test("mounts a canvas and fades the fallback image out", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(`${stage} canvas`)).toHaveCount(1, { timeout: 45_000 });
    await expect(page.locator(stage)).toHaveAttribute("data-ready", "true");
    await expect(page.locator(`${stage} .badge-fallback`)).toHaveCSS("opacity", "0");
    await expect(page.locator(`${stage} canvas`)).toHaveCSS("opacity", "1");
  });

  test("dragging the badge raises no console errors", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse drag is desktop only");
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    const canvas = page.locator(`${stage} canvas`);
    await expect(canvas).toHaveCount(1, { timeout: 45_000 });

    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no box");
    const card = { x: box.x + box.width * 0.62, y: box.y + box.height * 0.6 };
    await page.mouse.move(card.x, card.y);
    await page.mouse.down();
    await page.mouse.move(card.x - 160, card.y + 40, { steps: 12 });
    await page.mouse.move(card.x + 120, card.y - 20, { steps: 12 });
    await page.mouse.up();

    await expect(page.locator(stage)).toHaveAttribute("data-ready", "true");
    await expect(canvas).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("tapping the card flips it", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse tap is desktop only");
    await page.goto("/");
    const canvas = page.locator(`${stage} canvas`);
    await expect(canvas).toHaveCount(1, { timeout: 45_000 });
    await expect(page.locator(stage)).toHaveAttribute("data-flipped", "false");

    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no box");
    await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.6);

    await expect(page.locator(stage)).toHaveAttribute("data-flipped", "true");
  });

  test("keeps the static fallback image when reduced motion is requested", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", baseURL });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator(`${stage} canvas`)).toHaveCount(0);
    await expect(page.locator(`${stage} .badge-fallback`)).toBeVisible();
    await expect(page.locator(`${stage} .badge-fallback`)).toHaveCSS("opacity", "1");
    await context.close();
  });
});
