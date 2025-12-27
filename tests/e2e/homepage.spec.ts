import { test, expect } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Assert
    expect(homePage.isOnHomePage()).toBe(true);
  });

  test("should have correct page title", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    const title = await homePage.getPageTitle();

    // Assert
    expect(title).toMatch(/HealthyMeal - Adapt Any Recipe to Your Dietary Needs/i);
  });

  test("should display main navigation", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();

    // Assert
    expect(await homePage.isNavigationVisible()).toBe(true);
    await expect(homePage.logo).toBeVisible();
    await expect(homePage.navLoginLink).toBeVisible();
    await expect(homePage.navSignUpButton).toBeVisible();
  });

  test("should display hero section with CTA buttons", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();

    // Assert
    expect(await homePage.isHeroSectionVisible()).toBe(true);
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.heroDescription).toBeVisible();
    await expect(homePage.heroSignUpButton).toBeVisible();
    await expect(homePage.heroLoginButton).toBeVisible();
  });

  test("should display features section", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();

    // Assert
    expect(await homePage.isFeaturesSectionVisible()).toBe(true);
    await expect(homePage.featuresHeading).toBeVisible();
  });

  test("should navigate to login page from navigation", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await homePage.clickNavLogin();

    // Assert
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("should navigate to register page from navigation", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await homePage.clickNavSignUp();

    // Assert
    await page.waitForURL("/register");
    expect(page.url()).toContain("/register");
  });

  test("should navigate to register page from hero CTA", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await homePage.clickHeroSignUp();

    // Assert
    await page.waitForURL("/register");
    expect(page.url()).toContain("/register");
  });

  test("should navigate to login page from hero CTA", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await homePage.clickHeroLogin();

    // Assert
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });

  test("should be keyboard accessible", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.goto();
    await page.keyboard.press("Tab");

    // Assert - Verify focus is visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act - Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();

    // Assert
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
  });

  test("should be responsive on tablet", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act - Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();

    // Assert
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
  });

  test("should be responsive on desktop", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act - Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await homePage.goto();

    // Assert
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
  });
});
