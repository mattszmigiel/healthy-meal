import type { APIRoute } from "astro";
import { updateDietaryPreferencesSchema } from "@/lib/schemas/dietaryPreferencesSchemas";
import { DietaryPreferencesService } from "@/lib/services/dietaryPreferences.service";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

/**
 * GET /api/profile/dietary-preferences
 * Retrieves the authenticated user's dietary preferences
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Ensure user is authenticated (defensive check)
    if (!locals.user) {
      const errorResponse: APIErrorResponse = {
        error: "Unauthorized",
        message: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get dietary preferences via service
    const service = new DietaryPreferencesService(locals.supabase);
    const preferences = await service.getDietaryPreferences(locals.user.id);

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error) {
      if (error.message === "DIETARY_PREFERENCES_NOT_FOUND") {
        const errorResponse: APIErrorResponse = {
          error: "Not Found",
          message: "Dietary preferences not found for user",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log server errors
    console.error("Unexpected error fetching dietary preferences:", error);

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

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Ensure user is authenticated (defensive check)
    if (!locals.user) {
      const errorResponse: APIErrorResponse = {
        error: "Unauthorized",
        message: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDietaryPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid input data",
        details: validationResult.error.errors.map((e) => e.message),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update dietary preferences via service
    const service = new DietaryPreferencesService(locals.supabase);
    const updatedPreferences = await service.updateDietaryPreferences(locals.user.id, validationResult.data);

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error) {
      if (error.message === "DIETARY_PREFERENCES_NOT_FOUND") {
        const errorResponse: APIErrorResponse = {
          error: "Not Found",
          message: "Dietary preferences not found for user",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log server errors
    console.error("Unexpected error updating dietary preferences:", error);

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
