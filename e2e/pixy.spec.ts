import { test, expect } from "@playwright/test";

test("loads with an empty white canvas and the two name fields", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "Drawing canvas" })).toBeVisible();
    await expect(page.getByLabel("Drawing", { exact: true })).toHaveValue("My Drawing");
    await expect(page.getByLabel("Student name", { exact: true })).toHaveValue("Norden Heng");
});

test("search filters the shape library", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search shapes…").fill("star");
    await expect(page.getByRole("button", { name: "Add Star to canvas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Square to canvas" })).toHaveCount(0);
});

test("clicking a shape draws pixels onto the canvas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add Circle to canvas" }).click();
    // read the canvas: there should now be non-white pixels
    const hasInk = await page.evaluate(() => {
        const c = document.querySelector("canvas") as HTMLCanvasElement;
        const ctx = c.getContext("2d")!;
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return true;
        }
        return false;
    });
    expect(hasInk).toBe(true);
});

test("export triggers a download when the share sheet is unavailable", async ({ page }) => {
    // force the download path: headless share() hangs, so disable Web Share
    await page.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, "share", { configurable: true, value: undefined });
        Object.defineProperty(Navigator.prototype, "canShare", { configurable: true, value: () => false });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Add Square to canvas" }).click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save to Photos" }).click()]);
    expect(dl.suggestedFilename()).toMatch(/\.png$/);
});
