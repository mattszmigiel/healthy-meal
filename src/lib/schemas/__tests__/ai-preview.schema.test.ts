import { describe, it, expect } from "vitest";
import { recipeIdParamSchema, type RecipeIdParam } from "../ai-preview.schema";

describe("ai-preview.schema", () => {
  describe("recipeIdParamSchema", () => {
    describe("valid inputs", () => {
      it("should validate a valid UUID", () => {
        const validData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = recipeIdParamSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(validData.id);
        }
      });

      it("should validate lowercase UUID", () => {
        const validData = {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        };

        const result = recipeIdParamSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate uppercase UUID", () => {
        const validData = {
          id: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
        };

        const result = recipeIdParamSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("should reject non-UUID string", () => {
        const invalidData = {
          id: "not-a-uuid",
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Recipe ID must be a valid UUID");
        }
      });

      it("should reject empty string", () => {
        const invalidData = {
          id: "",
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Recipe ID must be a valid UUID");
        }
      });

      it("should reject UUID with missing hyphens", () => {
        const invalidData = {
          id: "550e8400e29b41d4a716446655440000",
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject UUID with wrong format", () => {
        const invalidData = {
          id: "550e8400-e29b-41d4-a716",
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject missing id field", () => {
        const invalidData = {};

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject null id", () => {
        const invalidData = {
          id: null,
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject numeric id", () => {
        const invalidData = {
          id: 123,
        };

        const result = recipeIdParamSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe("type inference", () => {
      it("should infer correct TypeScript type", () => {
        const data: RecipeIdParam = {
          id: "550e8400-e29b-41d4-a716-446655440000",
        };

        expect(data.id).toBeDefined();
      });
    });
  });
});
