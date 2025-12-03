import type { APIRoute } from "astro";
import { updateDietaryPreferencesSchema } from "@/lib/schemas/dietaryPreferencesSchemas";
import { DietaryPreferencesService } from "@/lib/services/dietaryPreferences.service";
import { DEFAULT_USER } from "@/db/supabase.client";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
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

    // Update dietary preferences via service (using DEFAULT_USER for testing)
    const service = new DietaryPreferencesService(locals.supabase);
    const updatedPreferences = await service.updateDietaryPreferences(DEFAULT_USER, validationResult.data);

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
