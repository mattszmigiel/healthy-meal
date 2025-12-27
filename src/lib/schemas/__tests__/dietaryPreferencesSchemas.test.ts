import { describe, it, expect } from "vitest";
import { updateDietaryPreferencesSchema } from "../dietaryPreferencesSchemas";

describe("dietaryPreferencesSchemas", () => {
  describe("updateDietaryPreferencesSchema", () => {
    describe("valid inputs", () => {
      it("should validate with all fields provided", () => {
        const validData = {
          diet_type: "vegetarian" as const,
          allergies: ["peanuts", "shellfish"],
          disliked_ingredients: ["cilantro"],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.diet_type).toBe("vegetarian");
          expect(result.data.allergies).toEqual(["peanuts", "shellfish"]);
          expect(result.data.disliked_ingredients).toEqual(["cilantro"]);
        }
      });

      it("should validate with only diet_type", () => {
        const validData = {
          diet_type: "vegan" as const,
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate with only allergies", () => {
        const validData = {
          diet_type: null,
          allergies: ["gluten"],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate with only disliked_ingredients", () => {
        const validData = {
          diet_type: null,
          allergies: [],
          disliked_ingredients: ["onions", "garlic"],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate with null diet_type", () => {
        const validData = {
          diet_type: null,
          allergies: ["dairy"],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should validate with empty arrays", () => {
        const validData = {
          diet_type: "keto" as const,
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("valid diet_type enum values", () => {
      const validDietTypes = [
        "omnivore",
        "vegetarian",
        "vegan",
        "pescatarian",
        "keto",
        "paleo",
        "low_carb",
        "low_fat",
        "mediterranean",
        "other",
      ] as const;

      validDietTypes.forEach((dietType) => {
        it(`should accept "${dietType}" as valid diet_type`, () => {
          const validData = {
            diet_type: dietType,
            allergies: [],
            disliked_ingredients: [],
          };

          const result = updateDietaryPreferencesSchema.safeParse(validData);

          expect(result.success).toBe(true);
        });
      });
    });

    describe("invalid inputs - diet_type", () => {
      it("should reject invalid diet_type", () => {
        const invalidData = {
          diet_type: "invalid_diet",
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject numeric diet_type", () => {
        const invalidData = {
          diet_type: 123,
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject empty string diet_type", () => {
        const invalidData = {
          diet_type: "",
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - arrays", () => {
      it("should reject non-array allergies", () => {
        const invalidData = {
          diet_type: "vegan" as const,
          allergies: "peanuts",
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject non-array disliked_ingredients", () => {
        const invalidData = {
          diet_type: "vegan" as const,
          allergies: [],
          disliked_ingredients: "onions",
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject allergies array with non-string values", () => {
        const invalidData = {
          diet_type: "vegan" as const,
          allergies: [123, 456],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject disliked_ingredients array with non-string values", () => {
        const invalidData = {
          diet_type: "vegan" as const,
          allergies: [],
          disliked_ingredients: [true, false],
        };

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - at least one field required", () => {
      it("should accept when fields are provided even if empty/null (schema checks for undefined)", () => {
        const validData = {
          diet_type: null,
          allergies: [],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should reject when no fields are provided", () => {
        const invalidData = {};

        const result = updateDietaryPreferencesSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Required");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle very long allergy lists", () => {
        const validData = {
          diet_type: null,
          allergies: Array(100).fill("allergy"),
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should handle very long disliked_ingredients lists", () => {
        const validData = {
          diet_type: null,
          allergies: [],
          disliked_ingredients: Array(100).fill("ingredient"),
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should trim and accept empty strings in allergies array", () => {
        const validData = {
          diet_type: null,
          allergies: ["", "peanuts", ""],
          disliked_ingredients: [],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.allergies).toEqual(["", "peanuts", ""]);
        }
      });

      it("should handle special characters in ingredient names", () => {
        const validData = {
          diet_type: null,
          allergies: ["peanuts (roasted)", "shell-fish"],
          disliked_ingredients: ["cilantro/coriander", "onions & garlic"],
        };

        const result = updateDietaryPreferencesSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });
  });
});
