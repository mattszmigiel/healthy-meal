import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { RecipesPage } from "./page-objects/RecipesPage";
import { ProfilePage } from "./page-objects/ProfilePage";

test.describe("Login Flow", () => {
  test("should successfully login and navigate to recipes page", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const recipesPage = new RecipesPage(page);

    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    // Act - Go to login page
    await loginPage.goto();

    // Act - Set login and password
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);

    // Act - Click login button
    await loginPage.clickLogin();

    // Act - Wait for load of /recipes page
    await loginPage.waitForSuccessfulLogin();

    // Assert - Verify we're on the recipes page
    expect(recipesPage.isOnRecipesPage()).toBe(true);
    await recipesPage.waitForPageLoad();
  });

  test("should display error message for invalid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    // Act - Set login and password
    await loginPage.fillEmail("jan@saj.xs");
    await loginPage.fillPassword("testPassword");

    // Act - Click login button
    await loginPage.clickLogin();

    // Wait for error message to appear
    await loginPage.errorMessage.waitFor({ state: "visible", timeout: 5000 });

    // Assert
    expect(await loginPage.isErrorVisible()).toBe(true);
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain("Invalid email or password");
  });

  test("should display validation errors for empty fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await loginPage.clickLogin();

    // Wait for validation messages
    await page.waitForTimeout(500);

    // Assert - Check that form validation prevents submission
    // The button click should not navigate away from login page
    expect(page.url()).toContain("/login");
  });

  test("should allow navigation to reset password page", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await page.click('a[href="/reset-password"]');

    // Assert
    await page.waitForURL("/reset-password");
    expect(page.url()).toContain("/reset-password");
  });

  test("should allow navigation to registration page", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await page.click('a[href="/register"]');

    // Assert
    await page.waitForURL("/register");
    expect(page.url()).toContain("/register");
  });

  test("should handle returnUrl parameter correctly", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    const returnUrl = "/profile";

    // Act - Navigate to login with returnUrl
    await page.goto(`/login?returnUrl=${returnUrl}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // Wait for React hydration
    await loginPage.login(testEmail, testPassword);

    // Assert - Should redirect to the returnUrl
    await page.waitForURL(returnUrl, { timeout: 10000 });
    await profilePage.waitForPageLoad();
    expect(profilePage.isOnProfilePage()).toBe(true);
  });

  test("should be keyboard accessible", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();

    // Tab through form elements
    await page.keyboard.press("Tab"); // First interactive element
    await page.keyboard.press("Tab"); // Email input
    await page.keyboard.type("test@example.com");
    await page.keyboard.press("Tab"); // Password input
    await page.keyboard.type("password123");
    await page.keyboard.press("Tab"); // Submit button

    // Verify the focused element is the submit button
    const focusedElement = await page.locator(":focus");
    const buttonText = await focusedElement.textContent();

    // Assert
    expect(buttonText).toContain("Log in");
  });
});
