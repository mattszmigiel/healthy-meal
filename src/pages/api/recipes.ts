import type { APIRoute } from "astro";
import { createRecipeSchema } from "@/lib/schemas/recipe.schema";
import { RecipeListQuerySchema } from "@/lib/schemas/recipeQuerySchemas";
import { RecipeService } from "@/lib/services/recipe.service";
import { DEFAULT_USER } from "@/db/supabase.client";
import type { APIErrorResponse } from "@/types";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/recipes
 * Retrieves a paginated list of recipes for the authenticated user
 * Query parameters: page, limit, is_ai_generated, parent_recipe_id
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Extract query parameters from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      is_ai_generated: url.searchParams.get("is_ai_generated"),
      parent_recipe_id: url.searchParams.get("parent_recipe_id"),
    };

    // Validate query parameters with Zod schema
    const validatedParams = RecipeListQuerySchema.parse(queryParams);

    // Initialize service and fetch recipes
    const service = new RecipeService(locals.supabase);
    const result = await service.listUserRecipes(DEFAULT_USER, validatedParams);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid query parameters",
        details: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("Error listing recipes:", error);
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

/**
 * POST /api/recipes
 * Creates a new recipe with optional AI metadata
 */
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
      const isValid = await service.validateParentRecipe(DEFAULT_USER, command.parent_recipe_id);

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
