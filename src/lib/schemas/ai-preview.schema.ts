import { z } from "zod";

/**
 * Schema for validating recipe ID path parameter in AI preview endpoint
 * Ensures the ID is a valid UUID format
 */
export const recipeIdParamSchema = z.object({
  id: z.string().uuid({ message: "Recipe ID must be a valid UUID" }),
});

/**
 * Type inference for recipe ID parameter
 */
export type RecipeIdParam = z.infer<typeof recipeIdParamSchema>;
