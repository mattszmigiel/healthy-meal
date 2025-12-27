import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Profile page
 * Encapsulates all elements and actions related to the user profile page
 */
export class ProfilePage {
  readonly page: Page;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator("h1", { hasText: "Profile" });
  }

  /**
   * Navigate to the profile page
   */
  async goto() {
    await this.page.goto("/profile", { waitUntil: "networkidle" });
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for React to hydrate
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.pageHeading.waitFor({ state: "visible" });
  }

  /**
   * Verify the page URL is correct
   */
  isOnProfilePage() {
    return this.page.url().includes("/profile");
  }

  /**
   * Get the current URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Check if the profile heading is visible
   */
  async isProfileHeadingVisible() {
    return this.pageHeading.isVisible();
  }
}
