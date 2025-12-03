import { z } from "zod";

/**
 * Valid diet type values matching the database enum
 */
const DIET_TYPES = [
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

/**
 * Validation schema for updating dietary preferences
 * All fields are optional, but at least one field must be provided
 */
export const updateDietaryPreferencesSchema = z
  .object({
    diet_type: z.enum(DIET_TYPES).nullable(),
    allergies: z.array(z.string()),
    disliked_ingredients: z.array(z.string()),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return data.diet_type !== undefined || data.allergies !== undefined || data.disliked_ingredients !== undefined;
    },
    {
      message: "At least one field must be provided",
    }
  );
