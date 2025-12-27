import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Add Recipe page
 * Encapsulates all elements and actions related to creating a new recipe
 */
export class AddRecipePage {
  readonly page: Page;

  // Form elements
  readonly form: Locator;
  readonly formHeading: Locator;

  // Input fields
  readonly titleInput: Locator;
  readonly ingredientsInput: Locator;
  readonly instructionsInput: Locator;

  // Action buttons
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements
    this.form = page.getByTestId("add-recipe-form");
    this.formHeading = page.getByTestId("form-heading");

    // Input fields
    this.titleInput = page.getByTestId("recipe-title-input");
    this.ingredientsInput = page.getByTestId("recipe-ingredients-input");
    this.instructionsInput = page.getByTestId("recipe-instructions-input");

    // Action buttons
    this.saveButton = page.getByTestId("save-recipe-button");
    this.cancelButton = page.getByTestId("cancel-button");
  }

  /**
   * Navigate to the add recipe page
   */
  async goto() {
    await this.page.goto("/recipes/new");
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.form.waitFor({ state: "visible" });
  }

  /**
   * Verify the page URL is correct
   */
  isOnAddRecipePage() {
    return this.page.url().includes("/recipes/new");
  }

  /**
   * Fill the recipe title
   */
  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  /**
   * Fill the recipe ingredients
   */
  async fillIngredients(ingredients: string) {
    await this.ingredientsInput.fill(ingredients);
  }

  /**
   * Fill the recipe instructions
   */
  async fillInstructions(instructions: string) {
    await this.instructionsInput.fill(instructions);
  }

  /**
   * Fill the entire recipe form
   */
  async fillRecipeForm(recipe: { title: string; ingredients: string; instructions: string }) {
    await this.fillTitle(recipe.title);
    await this.fillIngredients(recipe.ingredients);
    await this.fillInstructions(recipe.instructions);
  }

  /**
   * Click the save button
   */
  async clickSave() {
    await this.saveButton.click();
  }

  /**
   * Click the cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Check if the save button is enabled
   */
  async isSaveButtonEnabled() {
    return this.saveButton.isEnabled();
  }

  /**
   * Check if the save button is disabled
   */
  async isSaveButtonDisabled() {
    return this.saveButton.isDisabled();
  }

  /**
   * Check if the form is visible
   */
  async isFormVisible() {
    return this.form.isVisible();
  }

  /**
   * Get the current values from the form
   */
  async getFormValues() {
    return {
      title: await this.titleInput.inputValue(),
      ingredients: await this.ingredientsInput.inputValue(),
      instructions: await this.instructionsInput.inputValue(),
    };
  }

  /**
   * Wait for navigation after save (typically back to recipes page)
   */
  async waitForNavigationAfterSave() {
    await this.page.waitForURL("/recipes");
  }

  /**
   * Complete action: Create a new recipe and wait for redirect
   */
  async createRecipe(recipe: { title: string; ingredients: string; instructions: string }) {
    await this.fillRecipeForm(recipe);
    await this.clickSave();
    await this.waitForNavigationAfterSave();
  }
}
