import type { APIRoute } from "astro";
import { createRecipeSchema } from "@/lib/schemas/recipe.schema";
import { RecipeService } from "@/lib/services/recipe.service";
import { DEFAULT_USER } from "@/db/supabase.client";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message);
      const errorResponse: APIErrorResponse = {
        error: "Validation Error",
        message: "Invalid request data",
        details: errors,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = validationResult.data;
    const service = new RecipeService(locals.supabase);

    // Validate parent recipe if provided
    if (command.parent_recipe_id) {
      const isValid = await service.validateParentRecipe(
        DEFAULT_USER,
        command.parent_recipe_id
      );

      if (!isValid) {
        const errorResponse: APIErrorResponse = {
          error: "Not Found",
          message: "Parent recipe not found or you don't have access to it",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Create recipe
    const recipe = await service.createRecipe(DEFAULT_USER, command);

    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the recipe",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
