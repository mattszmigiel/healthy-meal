import { z } from "zod";

export const createRecipeSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
    ingredients: z.string().trim().min(1, "Ingredients are required"),
    instructions: z.string().trim().min(1, "Instructions are required"),
    is_ai_generated: z.boolean(),
    parent_recipe_id: z.string().uuid("Invalid parent recipe ID format").nullable().default(null),
    ai_metadata: z
      .object({
        model: z.string().min(1, "Model is required"),
        provider: z.string().min(1, "Provider is required"),
        generation_duration: z.number().int().positive("Generation duration must be positive"),
        raw_response: z.record(z.any()),
      })
      .nullable()
      .default(null),
  })
  .refine(
    (data) => {
      const totalLength = data.ingredients.length + data.instructions.length;
      return totalLength <= 10000;
    },
    {
      message: "Combined ingredients and instructions must not exceed 10,000 characters",
      path: ["combined"],
    }
  )
  .refine(
    (data) => {
      if (data.is_ai_generated && !data.ai_metadata) {
        return false;
      }
      return true;
    },
    {
      message: "AI metadata is required when is_ai_generated is true",
      path: ["ai_metadata"],
    }
  )
  .refine(
    (data) => {
      if (!data.is_ai_generated && data.ai_metadata) {
        return false;
      }
      return true;
    },
    {
      message: "AI metadata should not be provided when is_ai_generated is false",
      path: ["ai_metadata"],
    }
  );
