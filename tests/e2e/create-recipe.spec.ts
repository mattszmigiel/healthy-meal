import { test, expect } from "@playwright/test";
import { RecipesPage } from "./page-objects/RecipesPage";
import { AddRecipePage } from "./page-objects/AddRecipePage";
import { RecipeDetailPage } from "./page-objects/RecipeDetailPage";

test.describe("Create Recipe Flow", () => {
  let recipesPage: RecipesPage;
  let addRecipePage: AddRecipePage;
  let recipeDetailPage: RecipeDetailPage;

  test.beforeEach(async ({ page }) => {
    recipesPage = new RecipesPage(page);
    addRecipePage = new AddRecipePage(page);
    recipeDetailPage = new RecipeDetailPage(page);
  });

  test.describe.serial("Create recipes sequentially", () => {
    test("should create a new recipe from empty state", async ({ page }) => {
      // Arrange - Define test data
      const testRecipe = {
        title: "Chocolate Chip Cookies",
        ingredients:
          "2 cups all-purpose flour\n1 cup butter\n3/4 cup sugar\n2 eggs\n1 tsp vanilla extract\n1 cup chocolate chips",
        instructions:
          "Preheat oven to 375°F\nCream butter and sugar together\nAdd eggs and vanilla\nMix in flour gradually\nFold in chocolate chips\nDrop spoonfuls onto baking sheet\nBake for 10-12 minutes",
      };

      // Act & Assert
      // 1. Go to recipes page
      await recipesPage.goto();
      await recipesPage.waitForRecipesLoad();

      // 2. Verify empty state is visible
      await expect(recipesPage.emptyState).toBeVisible();
      await expect(recipesPage.emptyStateHeading).toContainText("No recipes yet");
      await expect(recipesPage.emptyStateDescription).toBeVisible();

      // 3. Click add recipe button from empty state
      await recipesPage.clickAddFirstRecipeButton();

      // Verify navigation to add recipe page
      await addRecipePage.waitForPageLoad();
      expect(addRecipePage.isOnAddRecipePage()).toBeTruthy();

      // 4. Fill the recipe form
      await expect(addRecipePage.form).toBeVisible();
      await expect(addRecipePage.formHeading).toContainText("Create Recipe");

      await addRecipePage.fillTitle(testRecipe.title);
      await addRecipePage.fillIngredients(testRecipe.ingredients);
      await addRecipePage.fillInstructions(testRecipe.instructions);

      // Verify form values are filled correctly
      const formValues = await addRecipePage.getFormValues();
      expect(formValues.title).toBe(testRecipe.title);
      expect(formValues.ingredients).toBe(testRecipe.ingredients);
      expect(formValues.instructions).toBe(testRecipe.instructions);

      // Verify save button is enabled
      await expect(addRecipePage.saveButton).toBeEnabled();

      // 5. Save the recipe
      await addRecipePage.clickSave();

      // 6. Verify redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
      await recipeDetailPage.waitForPageLoad();
      await expect(recipeDetailPage.recipeTitle).toContainText(testRecipe.title);
      await expect(recipeDetailPage.ingredientsContent).toContainText(testRecipe.ingredients.split("\n")[0]);
      await expect(recipeDetailPage.instructionsContent).toContainText(testRecipe.instructions.split("\n")[0]);

      // 7. Navigate to recipes list to verify recipe appears
      await recipesPage.goto();
      await recipesPage.waitForRecipesLoad();

      // Verify recipe grid is visible (not empty state)
      await expect(recipesPage.recipeGrid).toBeVisible();
      await expect(recipesPage.emptyState).not.toBeVisible();

      // Verify exactly one recipe card exists
      await expect(recipesPage.recipeCards).toHaveCount(1);

      // Verify the recipe title matches
      await expect(recipesPage.getRecipeCardTitleByIndex(0)).toContainText(testRecipe.title);
    });

    test("should create a new recipe using header add button", async ({ page }) => {
      // Arrange - Define test data
      const testRecipe = {
        title: "Vegetable Stir Fry",
        ingredients: "2 cups mixed vegetables\n2 tbsp soy sauce\n1 tbsp sesame oil\n2 cloves garlic\n1 tsp ginger",
        instructions:
          "Heat oil in wok\nAdd garlic and ginger\nAdd vegetables\nStir fry for 5 minutes\nAdd soy sauce\nServe hot",
      };

      // This test assumes there's already at least one recipe
      // So we'll go to recipes page and use the header button

      // Act & Assert
      // 1. Go to recipes page
      await recipesPage.goto();
      await recipesPage.waitForPageLoad();

      // 2. Click add recipe button from header (available when recipes exist or in empty state)
      // Note: If there are no recipes, use the empty state button instead
      const hasRecipes = await recipesPage.isRecipeGridVisible();
      if (hasRecipes) {
        await recipesPage.clickAddRecipeButton();
      } else {
        await recipesPage.clickAddFirstRecipeButton();
      }

      // 3. Verify navigation to add recipe page
      await addRecipePage.waitForPageLoad();
      expect(addRecipePage.isOnAddRecipePage()).toBeTruthy();

      // 4. Fill the recipe form
      await addRecipePage.fillRecipeForm(testRecipe);
      await expect(addRecipePage.saveButton).toBeEnabled();

      // 5. Save the recipe
      await addRecipePage.clickSave();

      // 6. Verify redirect to recipe detail page
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
      await recipeDetailPage.waitForPageLoad();
      await expect(recipeDetailPage.recipeTitle).toContainText(testRecipe.title);

      // 7. Navigate to recipes list
      await recipesPage.goto();
      await recipesPage.waitForRecipesLoad();

      // Verify recipe grid is visible
      await expect(recipesPage.recipeGrid).toBeVisible();

      // Verify at least one recipe exists
      const recipeCount = await recipesPage.getRecipeCount();
      expect(recipeCount).toBe(2);
    });
  });

  test("should disable save button when form is incomplete", async () => {
    // Act
    await addRecipePage.goto();
    await addRecipePage.waitForPageLoad();

    // Assert - Save button should be disabled when form is empty
    await expect(addRecipePage.saveButton).toBeDisabled();

    // Fill only title
    await addRecipePage.fillTitle("Incomplete Recipe");
    await expect(addRecipePage.saveButton).toBeDisabled();

    // Fill title and ingredients
    await addRecipePage.fillIngredients("Some ingredients");
    await expect(addRecipePage.saveButton).toBeDisabled();

    // Fill all fields
    await addRecipePage.fillInstructions("Some instructions");
    await expect(addRecipePage.saveButton).toBeEnabled();
  });

  test("should navigate back to recipes when cancel is clicked", async ({ page }) => {
    // Arrange
    await recipesPage.goto();
    await recipesPage.waitForRecipesLoad();

    const hasRecipes = await recipesPage.isRecipeGridVisible();
    if (hasRecipes) {
      await recipesPage.clickAddRecipeButton();
    } else {
      await recipesPage.clickAddFirstRecipeButton();
    }

    await addRecipePage.waitForPageLoad();

    // Act - Fill some data and cancel
    await addRecipePage.fillTitle("Test Recipe");

    // Click cancel
    await addRecipePage.clickCancel();

    // Since there's unsaved data, a confirmation dialog might appear
    // We'll handle that by clicking "Discard" if it appears
    const discardButton = page.getByRole("button", { name: "Discard" });
    const isDiscardVisible = await discardButton.isVisible().catch(() => false);

    if (isDiscardVisible) {
      await discardButton.click();
    }

    // Assert - Should navigate back to recipes page
    await page.waitForURL("/recipes");
    expect(recipesPage.isOnRecipesPage()).toBeTruthy();
  });
});
