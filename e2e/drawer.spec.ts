import { expect, test, type Page } from "@playwright/test";
import { projects } from "../src/core/data/projects";
import { folderScreenPoint } from "./support/folder-point";

const stage = '[data-scene="drawer"]';
const SCENE_TIMEOUT = 45_000;

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } });

async function openDrawer(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  await page.goto("/");
  await page.locator(stage).scrollIntoViewIfNeeded();
  const canvas = page.locator(`${stage} canvas`);
  await expect(canvas).toHaveCount(1, { timeout: SCENE_TIMEOUT });
  await expect(page.locator(stage)).toHaveAttribute("data-ready", "true");
  await expect(page.locator(stage)).toHaveAttribute("data-scene-index", "0");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");
  return box;
}

test.describe("drawer scene", () => {
  test.setTimeout(90_000);

  test("mounts a canvas over the fallback image", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop chromium only");
    await openDrawer(page);

    await expect(page.locator(`${stage} img`)).toHaveCSS("opacity", "0");
  });

  test("clicking the third folder opens its case", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop chromium only");
    const box = await openDrawer(page);

    const { x, y } = folderScreenPoint(box, 2, 0, projects.length);
    await page.mouse.click(x, y);

    await expect(page.locator(stage)).toHaveAttribute("data-scene-index", "2");
    await expect(page.locator(stage)).toHaveAttribute("data-index", "2");
    await expect(page.getByRole("heading", { level: 3, name: "Troika Syndicate" })).toBeVisible();
  });

  test("the Systems tab drives the scene's own selection", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop chromium only");
    await openDrawer(page);

    await page.getByRole("list", { name: "Projects" }).getByRole("button", { name: "Systems" }).click();

    await expect(page.locator(stage)).toHaveAttribute("data-scene-index", "3");
    await expect(page.locator(stage)).toHaveAttribute("data-index", "3");
  });

  test("tapping a folder on a touch screen selects it", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch project only");
    const box = await openDrawer(page);

    const { x, y } = folderScreenPoint(box, 1, 0, projects.length);
    await page.touchscreen.tap(x, y);

    await expect(page.locator(stage)).toHaveAttribute("data-scene-index", "1");
    await expect(page.locator(stage)).toHaveAttribute("data-index", "1");
  });
});
