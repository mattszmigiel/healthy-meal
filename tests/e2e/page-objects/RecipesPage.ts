import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Recipes page
 * Encapsulates all elements and actions related to the recipes listing page
 */
export class RecipesPage {
  readonly page: Page;
  readonly pageHeading: Locator;

  // Header elements
  readonly addRecipeButton: Locator;

  // Empty state elements
  readonly emptyState: Locator;
  readonly emptyStateHeading: Locator;
  readonly emptyStateDescription: Locator;
  readonly addFirstRecipeButton: Locator;

  // Recipe grid elements
  readonly recipeGrid: Locator;
  readonly recipeCards: Locator;
  readonly recipeCardTitles: Locator;
  readonly recipeCardDates: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.locator("h1");

    // Header elements
    this.addRecipeButton = page.getByTestId("add-recipe-button");

    // Empty state elements
    this.emptyState = page.getByTestId("recipe-list-empty-state");
    this.emptyStateHeading = page.getByTestId("empty-state-heading");
    this.emptyStateDescription = page.getByTestId("empty-state-description");
    this.addFirstRecipeButton = page.getByTestId("add-first-recipe-button");

    // Recipe grid elements
    this.recipeGrid = page.getByTestId("recipe-grid");
    this.recipeCards = page.getByTestId("recipe-card");
    this.recipeCardTitles = page.getByTestId("recipe-card-title");
    this.recipeCardDates = page.getByTestId("recipe-card-date");
  }

  /**
   * Navigate to the recipes page
   */
  async goto() {
    await this.page.goto("/recipes");
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Verify the page URL is correct
   */
  isOnRecipesPage() {
    return this.page.url().includes("/recipes");
  }

  /**
   * Get the current URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible() {
    return this.emptyState.isVisible();
  }

  /**
   * Check if recipe grid is visible
   */
  async isRecipeGridVisible() {
    return this.recipeGrid.isVisible();
  }

  /**
   * Get the count of recipe cards
   */
  async getRecipeCount() {
    return this.recipeCards.count();
  }

  /**
   * Click the "Add Recipe" button in the header
   */
  async clickAddRecipeButton() {
    await this.addRecipeButton.click();
  }

  /**
   * Click the "Add Your First Recipe" button in empty state
   */
  async clickAddFirstRecipeButton() {
    await this.addFirstRecipeButton.click();
  }

  /**
   * Get recipe card by index (0-based)
   */
  getRecipeCardByIndex(index: number) {
    return this.recipeCards.nth(index);
  }

  /**
   * Get recipe card title by index (0-based)
   */
  getRecipeCardTitleByIndex(index: number) {
    return this.recipeCardTitles.nth(index);
  }

  /**
   * Click on a recipe card by index (0-based)
   */
  async clickRecipeCardByIndex(index: number) {
    await this.getRecipeCardByIndex(index).click();
  }

  /**
   * Wait for recipes to load (either empty state or recipe grid)
   */
  async waitForRecipesLoad() {
    await this.page.waitForLoadState("networkidle");
    // Wait for either empty state or recipe grid to be visible
    await Promise.race([this.emptyState.waitFor({ state: "visible" }), this.recipeGrid.waitFor({ state: "visible" })]);
  }
}
