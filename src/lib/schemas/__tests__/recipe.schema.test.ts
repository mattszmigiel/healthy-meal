import { describe, it, expect } from "vitest";
import { createRecipeSchema } from "../recipe.schema";

describe("recipe.schema", () => {
  describe("createRecipeSchema", () => {
    const validAIMetadata = {
      model: "gpt-4o-mini",
      provider: "openrouter",
      generation_duration: 1500,
      raw_response: { completion: "success" },
    };

    describe("valid inputs", () => {
      it("should validate a valid non-AI recipe", () => {
        const validData = {
          title: "Classic Pasta",
          ingredients: "Pasta, tomatoes, garlic",
          instructions: "Boil pasta, make sauce, combine",
          is_ai_generated: false,
          parent_recipe_id: null,
          ai_metadata: null,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate a valid AI-generated recipe", () => {
        const validData = {
          title: "AI Pasta",
          ingredients: "Pasta, tomatoes, garlic",
          instructions: "Boil pasta, make sauce, combine",
          is_ai_generated: true,
          parent_recipe_id: "550e8400-e29b-41d4-a716-446655440000",
          ai_metadata: validAIMetadata,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should apply default null to parent_recipe_id when not provided", () => {
        const validData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parent_recipe_id).toBeNull();
          expect(result.data.ai_metadata).toBeNull();
        }
      });

      it("should trim whitespace from text fields", () => {
        const validData = {
          title: "  Recipe Title  ",
          ingredients: "  Ingredient 1  ",
          instructions: "  Step 1  ",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("Recipe Title");
          expect(result.data.ingredients).toBe("Ingredient 1");
          expect(result.data.instructions).toBe("Step 1");
        }
      });
    });

    describe("invalid inputs - required fields", () => {
      it("should reject empty title", () => {
        const invalidData = {
          title: "",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title is required");
        }
      });

      it("should reject whitespace-only title", () => {
        const invalidData = {
          title: "   ",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject empty ingredients", () => {
        const invalidData = {
          title: "Recipe",
          ingredients: "",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Ingredients are required");
        }
      });

      it("should reject empty instructions", () => {
        const invalidData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Instructions are required");
        }
      });

      it("should reject missing is_ai_generated", () => {
        const invalidData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - field length constraints", () => {
      it("should reject title exceeding 200 characters", () => {
        const invalidData = {
          title: "a".repeat(201),
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title must not exceed 200 characters");
        }
      });

      it("should accept title with exactly 200 characters", () => {
        const validData = {
          title: "a".repeat(200),
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs - combined length constraint", () => {
      it("should reject when combined ingredients and instructions exceed 10,000 characters", () => {
        const invalidData = {
          title: "Recipe",
          ingredients: "a".repeat(5001),
          instructions: "b".repeat(5000),
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const combinedError = result.error.issues.find((issue) => issue.path.includes("combined"));
          expect(combinedError?.message).toBe(
            "Combined ingredients and instructions must not exceed 10,000 characters"
          );
        }
      });

      it("should accept when combined length is exactly 10,000 characters", () => {
        const validData = {
          title: "Recipe",
          ingredients: "a".repeat(5000),
          instructions: "b".repeat(5000),
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should accept when combined length is under 10,000 characters", () => {
        const validData = {
          title: "Recipe",
          ingredients: "a".repeat(4000),
          instructions: "b".repeat(5000),
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs - parent_recipe_id", () => {
      it("should reject invalid UUID format", () => {
        const invalidData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
          parent_recipe_id: "not-a-uuid",
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid parent recipe ID format");
        }
      });

      it("should accept null parent_recipe_id", () => {
        const validData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
          parent_recipe_id: null,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should accept valid UUID parent_recipe_id", () => {
        const validData = {
          title: "Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
          parent_recipe_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs - AI metadata constraints", () => {
      it("should reject when is_ai_generated is true but ai_metadata is null", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: null,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const metadataError = result.error.issues.find((issue) => issue.path.includes("ai_metadata"));
          expect(metadataError?.message).toBe("AI metadata is required when is_ai_generated is true");
        }
      });

      it("should reject when is_ai_generated is false but ai_metadata is provided", () => {
        const invalidData = {
          title: "Manual Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: false,
          ai_metadata: validAIMetadata,
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const metadataError = result.error.issues.find((issue) => issue.path.includes("ai_metadata"));
          expect(metadataError?.message).toBe("AI metadata should not be provided when is_ai_generated is false");
        }
      });
    });

    describe("ai_metadata validation", () => {
      it("should reject ai_metadata with missing model", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            provider: "openrouter",
            generation_duration: 1500,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject ai_metadata with empty model", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "",
            provider: "openrouter",
            generation_duration: 1500,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject ai_metadata with missing provider", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "gpt-4o-mini",
            generation_duration: 1500,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject ai_metadata with non-positive generation_duration", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "gpt-4o-mini",
            provider: "openrouter",
            generation_duration: 0,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Generation duration must be positive");
        }
      });

      it("should reject ai_metadata with negative generation_duration", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "gpt-4o-mini",
            provider: "openrouter",
            generation_duration: -100,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject ai_metadata with non-integer generation_duration", () => {
        const invalidData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "gpt-4o-mini",
            provider: "openrouter",
            generation_duration: 1500.5,
            raw_response: {},
          },
        };

        const result = createRecipeSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should accept ai_metadata with complex raw_response object", () => {
        const validData = {
          title: "AI Recipe",
          ingredients: "Ingredients",
          instructions: "Instructions",
          is_ai_generated: true,
          ai_metadata: {
            model: "gpt-4o-mini",
            provider: "openrouter",
            generation_duration: 1500,
            raw_response: {
              completion: "success",
              tokens: 150,
              nested: { data: [1, 2, 3] },
            },
          },
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle minimal valid recipe", () => {
        const validData = {
          title: "A",
          ingredients: "B",
          instructions: "C",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should handle recipe at maximum length boundaries", () => {
        const validData = {
          title: "a".repeat(200),
          ingredients: "b".repeat(9000),
          instructions: "c".repeat(1000),
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should handle special characters in all fields", () => {
        const validData = {
          title: "Recipe™ with émojis 🍝",
          ingredients: "Pasta (500g), tomatoes & garlic",
          instructions: "Step 1: Cook\nStep 2: Serve",
          is_ai_generated: false,
        };

        const result = createRecipeSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });
  });
});
