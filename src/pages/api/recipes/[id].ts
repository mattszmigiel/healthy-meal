import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeService } from "@/lib/services/recipe.service";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

/**
 * Validation schema for recipe ID path parameter
 */
const RecipeIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});

/**
 * GET /api/recipes/:id
 * Retrieves a single recipe by ID with AI metadata
 * Returns 404 if recipe not found or not owned by user (RLS filtered)
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Extract recipe ID from path params
    const recipeId = params.id;

    // Validate UUID format
    const validation = RecipeIdParamSchema.safeParse({ id: recipeId });
    if (!validation.success) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid recipe ID format",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Fetch recipe with AI metadata
    const service = new RecipeService(supabase);
    const recipe = await service.getRecipeById(validation.data.id);

    // Handle not found (includes RLS filtered)
    if (!recipe) {
      const errorResponse: APIErrorResponse = {
        error: "Not Found",
        message: "Recipe not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error fetching recipe:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
