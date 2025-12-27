import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Login page
 * Encapsulates all elements and actions related to the login flow
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error-message");
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/login", { waitUntil: "networkidle" });
    await this.page.waitForLoadState("domcontentloaded");
    await this.emailInput.waitFor({ state: "visible" });
    // Wait for React to hydrate - give it a moment to attach event handlers
    await this.page.waitForTimeout(1000);
  }

  /**
   * Fill in the email field
   * @param email - Email address to enter
   */
  async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field
   * @param password - Password to enter
   */
  async fillPassword(password: string) {
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login submit button
   */
  async clickLogin() {
    await this.submitButton.waitFor({ state: "visible" });
    await this.submitButton.click();
    // Wait for form submission to be processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete login flow with credentials
   * @param email - Email address
   * @param password - Password
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Wait for successful navigation after login
   * @param expectedUrl - Expected URL path after login (default: /recipes)
   */
  async waitForSuccessfulLogin(expectedUrl = "/recipes") {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible() {
    return this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorText() {
    return this.errorMessage.textContent();
  }
}
