import { describe, it, expect } from "vitest";
import { RecipeListQuerySchema } from "../recipeQuerySchemas";

describe("recipeQuerySchemas", () => {
  describe("RecipeListQuerySchema", () => {
    describe("valid inputs with defaults", () => {
      it("should apply default values when fields are null", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: null,
          parent_recipe_id: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
          expect(result.data.is_ai_generated).toBeUndefined();
          expect(result.data.parent_recipe_id).toBeUndefined();
        }
      });

      it("should apply defaults for minimal input", () => {
        const input = {
          page: null,
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });
    });

    describe("page parameter", () => {
      it("should transform valid string page to number", () => {
        const input = {
          page: "5",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
          expect(typeof result.data.page).toBe("number");
        }
      });

      it("should accept page as 1", () => {
        const input = {
          page: "1",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
        }
      });

      it("should accept large page numbers", () => {
        const input = {
          page: "999",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(999);
        }
      });

      it("should reject page 0", () => {
        const input = {
          page: "0",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Page must be a positive integer");
        }
      });

      it("should reject negative page", () => {
        const input = {
          page: "-1",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject non-integer page", () => {
        const input = {
          page: "1.5",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject non-numeric page", () => {
        const input = {
          page: "abc",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("limit parameter", () => {
      it("should transform valid string limit to number", () => {
        const input = {
          page: null,
          limit: "50",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(typeof result.data.limit).toBe("number");
        }
      });

      it("should accept limit of 1", () => {
        const input = {
          page: null,
          limit: "1",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(1);
        }
      });

      it("should accept limit of 100 (maximum)", () => {
        const input = {
          page: null,
          limit: "100",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(100);
        }
      });

      it("should reject limit of 0", () => {
        const input = {
          page: null,
          limit: "0",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Limit must be at least 1");
        }
      });

      it("should reject limit exceeding 100", () => {
        const input = {
          page: null,
          limit: "101",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Limit must not exceed 100");
        }
      });

      it("should reject negative limit", () => {
        const input = {
          page: null,
          limit: "-10",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject non-integer limit", () => {
        const input = {
          page: null,
          limit: "25.5",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("is_ai_generated parameter", () => {
      it("should transform 'true' string to boolean true", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: "true",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_ai_generated).toBe(true);
          expect(typeof result.data.is_ai_generated).toBe("boolean");
        }
      });

      it("should transform 'false' string to boolean false", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: "false",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_ai_generated).toBe(false);
          expect(typeof result.data.is_ai_generated).toBe("boolean");
        }
      });

      it("should transform empty string to undefined", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: "",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_ai_generated).toBeUndefined();
        }
      });

      it("should transform null to undefined", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_ai_generated).toBeUndefined();
        }
      });

      it("should be undefined when field is not provided", () => {
        const input = {
          page: null,
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.is_ai_generated).toBeUndefined();
        }
      });

      it("should reject invalid boolean string", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: "yes",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject numeric value", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: "1",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("parent_recipe_id parameter", () => {
      it("should accept valid UUID", () => {
        const input = {
          page: null,
          limit: null,
          parent_recipe_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parent_recipe_id).toBe("550e8400-e29b-41d4-a716-446655440000");
        }
      });

      it("should transform null to undefined", () => {
        const input = {
          page: null,
          limit: null,
          parent_recipe_id: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parent_recipe_id).toBeUndefined();
        }
      });

      it("should reject empty string (fails UUID validation before transform)", () => {
        const input = {
          page: null,
          limit: null,
          parent_recipe_id: "",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should be undefined when field is not provided", () => {
        const input = {
          page: null,
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.parent_recipe_id).toBeUndefined();
        }
      });

      it("should reject invalid UUID format", () => {
        const input = {
          page: null,
          limit: null,
          parent_recipe_id: "not-a-uuid",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Parent recipe ID must be a valid UUID");
        }
      });

      it("should reject UUID without hyphens", () => {
        const input = {
          page: null,
          limit: null,
          parent_recipe_id: "550e8400e29b41d4a716446655440000",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("combined query parameters", () => {
      it("should handle all parameters with valid values", () => {
        const input = {
          page: "3",
          limit: "50",
          is_ai_generated: "true",
          parent_recipe_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(3);
          expect(result.data.limit).toBe(50);
          expect(result.data.is_ai_generated).toBe(true);
          expect(result.data.parent_recipe_id).toBe("550e8400-e29b-41d4-a716-446655440000");
        }
      });

      it("should handle mix of provided and default values", () => {
        const input = {
          page: "2",
          limit: null,
          is_ai_generated: "false",
          parent_recipe_id: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(2);
          expect(result.data.limit).toBe(20);
          expect(result.data.is_ai_generated).toBe(false);
          expect(result.data.parent_recipe_id).toBeUndefined();
        }
      });

      it("should filter AI-generated recipes on page 5 with custom limit", () => {
        const input = {
          page: "5",
          limit: "10",
          is_ai_generated: "true",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            page: 5,
            limit: 10,
            is_ai_generated: true,
            parent_recipe_id: undefined,
          });
        }
      });
    });

    describe("edge cases", () => {
      it("should handle maximum valid values", () => {
        const input = {
          page: "999999",
          limit: "100",
          is_ai_generated: "true",
          parent_recipe_id: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it("should handle empty object with all nulls", () => {
        const input = {
          page: null,
          limit: null,
          is_ai_generated: null,
          parent_recipe_id: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(20);
        }
      });

      it("should handle partial query (only page)", () => {
        const input = {
          page: "10",
          limit: null,
        };

        const result = RecipeListQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(10);
          expect(result.data.limit).toBe(20);
        }
      });
    });
  });
});
