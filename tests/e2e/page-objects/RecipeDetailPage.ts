import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Recipe Detail Page
 * Encapsulates all elements and actions related to viewing a single recipe
 * Uses data-testid selectors for resilient testing
 */
export class RecipeDetailPage {
  readonly page: Page;

  // Breadcrumb navigation
  readonly breadcrumb: Locator;
  readonly breadcrumbRecipesLink: Locator;

  // Recipe header
  readonly recipeTitle: Locator;
  readonly createdDate: Locator;
  readonly updatedDate: Locator;

  // Action buttons
  readonly modifyWithAIButton: Locator;
  readonly moreActionsButton: Locator;
  readonly deleteMenuItem: Locator;

  // Recipe content sections
  readonly ingredientsSection: Locator;
  readonly ingredientsContent: Locator;
  readonly instructionsSection: Locator;
  readonly instructionsContent: Locator;

  constructor(page: Page) {
    this.page = page;

    // Breadcrumb navigation
    this.breadcrumb = page.getByTestId("recipe-breadcrumb");
    this.breadcrumbRecipesLink = page.getByTestId("breadcrumb-recipes-link");

    // Recipe header
    this.recipeTitle = page.getByTestId("recipe-title");
    this.createdDate = page.getByTestId("recipe-created-date");
    this.updatedDate = page.getByTestId("recipe-updated-date");

    // Action buttons
    this.modifyWithAIButton = page.getByTestId("modify-with-ai-button");
    this.moreActionsButton = page.getByTestId("more-actions-button");
    this.deleteMenuItem = page.getByTestId("delete-recipe-menu-item");

    // Recipe content sections
    this.ingredientsSection = page.getByTestId("recipe-ingredients-section");
    this.ingredientsContent = page.getByTestId("recipe-ingredients-content");
    this.instructionsSection = page.getByTestId("recipe-instructions-section");
    this.instructionsContent = page.getByTestId("recipe-instructions-content");
  }

  /**
   * Navigate to a recipe detail page by ID
   */
  async goto(recipeId: string) {
    await this.page.goto(`/recipes/${recipeId}`);
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.recipeTitle.waitFor({ state: "visible" });
  }

  /**
   * Check if we're on a recipe detail page
   */
  isOnRecipeDetailPage() {
    return this.page.url().match(/\/recipes\/[a-f0-9-]+$/) !== null;
  }

  /**
   * Get the recipe title text
   */
  async getRecipeTitle() {
    return this.recipeTitle.textContent();
  }

  /**
   * Get the created date text
   */
  async getCreatedDate() {
    return this.createdDate.textContent();
  }

  /**
   * Get the ingredients text
   */
  async getIngredients() {
    return this.ingredientsContent.textContent();
  }

  /**
   * Get the instructions text
   */
  async getInstructions() {
    return this.instructionsContent.textContent();
  }

  /**
   * Click the "Modify with AI" button
   */
  async clickModifyWithAI() {
    await this.modifyWithAIButton.click();
  }

  /**
   * Click the "More actions" button (opens dropdown menu)
   */
  async clickMoreActions() {
    await this.moreActionsButton.click();
  }

  /**
   * Click the delete menu item (after opening more actions)
   */
  async clickDelete() {
    await this.clickMoreActions();
    await this.deleteMenuItem.click();
  }

  /**
   * Navigate back to recipes list via breadcrumb
   */
  async clickBreadcrumbRecipes() {
    await this.breadcrumbRecipesLink.click();
  }

  /**
   * Check if the "Modify with AI" button is visible
   */
  async isModifyWithAIVisible() {
    return this.modifyWithAIButton.isVisible();
  }

  /**
   * Check if recipe content is visible
   */
  async isRecipeContentVisible() {
    return (
      (await this.recipeTitle.isVisible()) &&
      (await this.ingredientsSection.isVisible()) &&
      (await this.instructionsSection.isVisible())
    );
  }

  /**
   * Verify all recipe details match expected values
   */
  async verifyRecipeDetails(expectedRecipe: { title: string; ingredients: string; instructions: string }) {
    const title = await this.getRecipeTitle();
    const ingredients = await this.getIngredients();
    const instructions = await this.getInstructions();

    return (
      title === expectedRecipe.title &&
      ingredients?.includes(expectedRecipe.ingredients) &&
      instructions?.includes(expectedRecipe.instructions)
    );
  }

  /**
   * Extract recipe ID from current URL
   */
  getRecipeIdFromUrl(): string | null {
    const match = this.page.url().match(/\/recipes\/([a-f0-9-]+)$/);
    return match ? match[1] : null;
  }
}
