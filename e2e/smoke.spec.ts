import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("English locale home responds", async ({ page }) => {
    const res = await page.goto("/en", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("co-founders listing loads", async ({ page }) => {
    await page.goto("/en/cofounders", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    const res = await page.goto("/en/sign-in", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("readiness: GET /api/health", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.database).toBe(true);
  });

  test("security headers on locale home", async ({ request }) => {
    const res = await request.get("/en");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
