import { z } from "zod";

/**
 * Schema for validating recipe list query parameters
 * Used in GET /api/recipes endpoint
 */
export const RecipeListQuerySchema = z.object({
  page: z
    .string()
    .nullable()
    .transform((val) => (val ? Number(val) : 1))
    .pipe(z.number().int().positive("Page must be a positive integer")),
  limit: z
    .string()
    .nullable()
    .transform((val) => (val ? Number(val) : 20))
    .pipe(z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100")),
  is_ai_generated: z
    .string()
    .nullable()
    .transform((val) => {
      if (val === null || val === "") return undefined;
      return val === "true";
    })
    .optional(),
  parent_recipe_id: z
    .string()
    .uuid("Parent recipe ID must be a valid UUID")
    .nullable()
    .transform((val) => (val === null || val === "" ? undefined : val))
    .optional(),
});
