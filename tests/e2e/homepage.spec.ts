import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify page loaded successfully
    expect(page.url()).toContain("localhost:3000");
  });

  test("should have correct page title", async ({ page }) => {
    await page.goto("/");

    // Check if the page has a title
    await expect(page).toHaveTitle(/Healthy Meal/i);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    // Check for navigation element
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("should be keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");

    // Verify focus is visible
    const focusedElement = await page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
