import { test as setup, expect } from "@playwright/test";
import path from "path";
import { LoginPage } from "./page-objects/LoginPage";
import { RecipesPage } from "./page-objects/RecipesPage";

const authFile = path.join(process.cwd(), "playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
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

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
