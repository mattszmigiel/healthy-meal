import { describe, it, expect } from "vitest";
import { buildRecipeModificationPrompt, RECIPE_MODIFICATION_SYSTEM_PROMPT } from "../ai-preview.prompt";
import type { RecipeEntity, DietaryPreferencesEntity } from "@/types";

describe("buildRecipeModificationPrompt", () => {
  // ============================================================================
  // Test Data Factories
  // ============================================================================

  const createMockRecipe = (overrides?: Partial<RecipeEntity>): RecipeEntity => ({
    id: "recipe-123",
    title: "Classic Lasagna",
    ingredients: "Ground beef\nPasta sheets\nMozzarella cheese\nTomato sauce",
    instructions: "1. Brown the beef\n2. Layer ingredients\n3. Bake at 350°F",
    owner_id: "user-123",
    is_ai_generated: false,
    parent_recipe_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const createMockPreferences = (overrides?: Partial<DietaryPreferencesEntity>): DietaryPreferencesEntity => ({
    user_id: "user-123",
    diet_type: null,
    allergies: null,
    disliked_ingredients: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  // ============================================================================
  // Prompt Structure Tests
  // ============================================================================

  describe("prompt structure", () => {
    it("should include recipe title in the prompt", () => {
      // Arrange
      const recipe = createMockRecipe({ title: "Spicy Chicken Curry" });
      const preferences = createMockPreferences({ diet_type: "vegetarian" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Title: Spicy Chicken Curry");
    });

    it("should include recipe ingredients in the prompt", () => {
      // Arrange
      const recipe = createMockRecipe({
        ingredients: "Chicken breast\nCoconut milk\nCurry paste",
      });
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Ingredients:");
      expect(prompt).toContain("Chicken breast\nCoconut milk\nCurry paste");
    });

    it("should include recipe instructions in the prompt", () => {
      // Arrange
      const recipe = createMockRecipe({
        instructions: "1. Marinate chicken\n2. Cook in pan\n3. Add sauce",
      });
      const preferences = createMockPreferences({ diet_type: "vegetarian" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Instructions:");
      expect(prompt).toContain("1. Marinate chicken\n2. Cook in pan\n3. Add sauce");
    });

    it("should include JSON response structure specification", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"ingredients"');
      expect(prompt).toContain('"instructions"');
      expect(prompt).toContain('"explanation"');
    });

    it("should include language preservation instruction", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Always respond in the language of the original recipe");
      expect(prompt).toContain("do not translate it");
    });
  });

  // ============================================================================
  // Dietary Preferences Tests
  // ============================================================================

  describe("dietary preferences formatting", () => {
    it("should include diet_type when specified", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Diet type: vegan");
    });

    it("should include allergies when specified", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        allergies: ["peanuts", "shellfish", "tree nuts"],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Allergies: peanuts, shellfish, tree nuts");
    });

    it("should include disliked_ingredients when specified", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        disliked_ingredients: ["cilantro", "mushrooms"],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Disliked ingredients: cilantro, mushrooms");
    });

    it("should include all preference types when all are specified", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: "vegetarian",
        allergies: ["dairy", "eggs"],
        disliked_ingredients: ["eggplant"],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Diet type: vegetarian");
      expect(prompt).toContain("Allergies: dairy, eggs");
      expect(prompt).toContain("Disliked ingredients: eggplant");
    });

    it("should handle empty allergies array", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: "vegan",
        allergies: [],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).not.toContain("Allergies:");
      expect(prompt).toContain("Diet type: vegan");
    });

    it("should handle empty disliked_ingredients array", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: "paleo",
        disliked_ingredients: [],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).not.toContain("Disliked ingredients:");
      expect(prompt).toContain("Diet type: paleo");
    });

    it("should handle null preference values gracefully", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: null,
        allergies: null,
        disliked_ingredients: null,
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert - should still contain recipe info but no preferences section
      expect(prompt).toContain("Title: Classic Lasagna");
      expect(prompt).not.toContain("Diet type:");
      expect(prompt).not.toContain("Allergies:");
      expect(prompt).not.toContain("Disliked ingredients:");
    });
  });

  // ============================================================================
  // Prompt Guidelines Tests
  // ============================================================================

  describe("prompt guidelines", () => {
    it("should include instruction to make realistic substitutions", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Make realistic and practical substitutions");
    });

    it("should include instruction to maintain recipe essence", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Maintain the essence and appeal of the original dish");
    });

    it("should include instruction to provide clear explanations", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Provide clear explanations for all changes");
    });

    it("should include instruction to address all dietary preferences", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("If multiple dietary preferences apply, address all of them");
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe("edge cases", () => {
    it("should handle recipe with special characters in title", () => {
      // Arrange
      const recipe = createMockRecipe({
        title: 'Mom\'s "Famous" Lasagna & Pasta',
      });
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain('Title: Mom\'s "Famous" Lasagna & Pasta');
    });

    it("should handle very long ingredients list", () => {
      // Arrange
      const longIngredients = Array(50)
        .fill(0)
        .map((_, i) => `Ingredient ${i + 1}`)
        .join("\n");
      const recipe = createMockRecipe({ ingredients: longIngredients });
      const preferences = createMockPreferences({ diet_type: "vegan" });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain(longIngredients);
      expect(prompt.split("\n").length).toBeGreaterThan(50);
    });

    it("should handle preference with single item in array", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        allergies: ["peanuts"],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Allergies: peanuts");
    });

    it("should handle multiple diet types by using the specified one", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: "keto",
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toContain("Diet type: keto");
    });
  });

  // ============================================================================
  // Snapshot Tests
  // ============================================================================

  describe("snapshot tests", () => {
    it("should generate consistent prompt format", () => {
      // Arrange
      const recipe = createMockRecipe();
      const preferences = createMockPreferences({
        diet_type: "vegan",
        allergies: ["nuts"],
        disliked_ingredients: ["mushrooms"],
      });

      // Act
      const prompt = buildRecipeModificationPrompt(recipe, preferences);

      // Assert
      expect(prompt).toMatchInlineSnapshot(`
        "Please modify the following recipe based on these dietary preferences:

        Diet type: vegan
        Allergies: nuts
        Disliked ingredients: mushrooms

        Original Recipe:
        Title: Classic Lasagna

        Ingredients:
        Ground beef
        Pasta sheets
        Mozzarella cheese
        Tomato sauce

        Instructions:
        1. Brown the beef
        2. Layer ingredients
        3. Bake at 350°F

        Please provide a modified version of this recipe that accommodates the dietary preferences above. Return your response as a JSON object with the following structure:
        {
          "title": "Modified recipe title (include dietary preference indicators like 'Vegan', 'Gluten-Free', etc.)",
          "ingredients": "Complete list of modified ingredients",
          "instructions": "Complete cooking instructions with any necessary adjustments",
          "explanation": "Detailed explanation of the changes made and why (include specific ingredient substitutions)"
        }

        Important:
        - Make realistic and practical substitutions
        - Maintain the essence and appeal of the original dish
        - Provide clear explanations for all changes
        - Ensure the modified recipe is complete and ready to use
        - If multiple dietary preferences apply, address all of them
        - Always respond in the language of the original recipe - do not translate it."
      `);
    });
  });
});

// ============================================================================
// System Prompt Tests
// ============================================================================

describe("RECIPE_MODIFICATION_SYSTEM_PROMPT", () => {
  it("should define AI role as professional chef and nutritionist", () => {
    expect(RECIPE_MODIFICATION_SYSTEM_PROMPT).toContain("professional chef");
    expect(RECIPE_MODIFICATION_SYSTEM_PROMPT).toContain("nutritionist");
  });

  it("should emphasize maintaining taste and quality", () => {
    expect(RECIPE_MODIFICATION_SYSTEM_PROMPT).toContain("maintaining taste and quality");
  });

  it("should emphasize providing detailed explanations", () => {
    expect(RECIPE_MODIFICATION_SYSTEM_PROMPT).toContain("detailed explanations");
  });

  it("should be concise and clear", () => {
    expect(RECIPE_MODIFICATION_SYSTEM_PROMPT.length).toBeLessThan(500);
    // Count sentences (periods followed by space or end of string)
    const sentences = RECIPE_MODIFICATION_SYSTEM_PROMPT.match(/[^.!?]+[.!?]+/g) || [];
    expect(sentences.length).toBeLessThanOrEqual(3);
  });
});
