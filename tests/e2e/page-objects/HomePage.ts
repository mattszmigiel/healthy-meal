import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Homepage (Landing Page)
 * Encapsulates all elements and actions related to the homepage
 */
export class HomePage {
  readonly page: Page;

  // Navigation elements
  readonly logo: Locator;
  readonly navLoginLink: Locator;
  readonly navSignUpButton: Locator;
  readonly navigation: Locator;

  // Hero section elements
  readonly heroHeading: Locator;
  readonly heroDescription: Locator;
  readonly heroSignUpButton: Locator;
  readonly heroLoginButton: Locator;

  // Features section elements
  readonly featuresHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.logo = page.locator('header a[href="/"]', { hasText: "HealthyMeal" });
    this.navLoginLink = page.locator('nav a[href="/login"]');
    this.navSignUpButton = page.locator('nav a[href="/register"]');
    this.navigation = page.locator("nav");

    // Hero section
    this.heroHeading = page.locator("h1", { hasText: "Adapt Any Recipe to Your Dietary Needs with AI" });
    this.heroDescription = page.locator("p", {
      hasText: "Set your dietary preferences, save your favorite recipes",
    });
    this.heroSignUpButton = page.locator('main a[href="/register"]').first();
    this.heroLoginButton = page.locator('main a[href="/login"]').first();

    // Features section
    this.featuresHeading = page.locator("h2", { hasText: "How It Works" });
  }

  /**
   * Navigate to the homepage
   */
  async goto() {
    await this.page.goto("/", { waitUntil: "networkidle" });
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.heroHeading.waitFor({ state: "visible" });
  }

  /**
   * Verify the page URL is correct
   */
  isOnHomePage() {
    const url = this.page.url();
    return url === "http://localhost:3000/" || url.endsWith("/");
  }

  /**
   * Click the login link in navigation
   */
  async clickNavLogin() {
    await this.navLoginLink.click();
  }

  /**
   * Click the sign up button in navigation
   */
  async clickNavSignUp() {
    await this.navSignUpButton.click();
  }

  /**
   * Click the sign up button in hero section
   */
  async clickHeroSignUp() {
    await this.heroSignUpButton.click();
  }

  /**
   * Click the login button in hero section
   */
  async clickHeroLogin() {
    await this.heroLoginButton.click();
  }

  /**
   * Check if navigation is visible
   */
  async isNavigationVisible() {
    return this.navigation.isVisible();
  }

  /**
   * Check if hero section is visible
   */
  async isHeroSectionVisible() {
    return this.heroHeading.isVisible();
  }

  /**
   * Check if features section is visible
   */
  async isFeaturesSectionVisible() {
    return this.featuresHeading.isVisible();
  }

  /**
   * Get the page title
   */
  async getPageTitle() {
    return this.page.title();
  }
}
