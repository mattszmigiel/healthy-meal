import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { recipeIdParamSchema } from "@/lib/schemas/ai-preview.schema";
import { AIPreviewService, AI_PREVIEW_ERRORS } from "@/lib/services/ai-preview.service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import {
  validationErrorResponse,
  notFoundResponse,
  noPreferencesResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  internalServerErrorResponse,
} from "@/lib/utils/api-responses";
import { DEFAULT_USER } from "@/db/supabase.client";
import { logger, startTimer, getErrorStack } from "@/lib/utils/logger";

export const prerender = false;

/**
 * POST /api/recipes/:id/ai-preview
 * Generates an AI-modified version of a recipe based on user's dietary preferences
 * Returns a preview without saving to the database
 *
 * Rate limit: 10 requests per minute per user
 *
 * @returns 200 - AI preview with original and modified recipe
 * @returns 400 - Invalid UUID or no dietary preferences
 * @returns 404 - Recipe not found or unauthorized
 * @returns 429 - Rate limit exceeded
 * @returns 500 - Internal server error
 */
export const POST: APIRoute = async ({ params, locals }) => {
  const userId = DEFAULT_USER;
  const endTimer = startTimer("AI preview generation", {
    user_id: userId,
    endpoint: `/api/recipes/${params.id}/ai-preview`,
  });

  try {
    // Step 2: Validate recipe ID parameter
    const validation = recipeIdParamSchema.safeParse({ id: params.id });
    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message);
      logger.warn("Invalid recipe ID format", {
        user_id: userId,
        recipe_id: params.id,
        error: errorMessages[0],
      });
      return validationErrorResponse(errorMessages[0]);
    }

    const { id: recipeId } = validation.data;

    // Step 3: Check rate limit
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", {
        user_id: userId,
        recipe_id: recipeId,
        retry_after: rateLimitResult.retryAfter,
      });
      return rateLimitResponse(rateLimitResult.retryAfter ?? 60);
    }

    // Step 4: Call service layer to generate AI preview
    const service = new AIPreviewService(locals.supabase);
    const preview = await service.generateAIPreview(recipeId, userId);

    // Step 5: Return success response
    endTimer();
    logger.info("AI preview generated successfully", {
      user_id: userId,
      recipe_id: recipeId,
    });

    return new Response(JSON.stringify(preview), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // Handle service-specific errors
    if (err instanceof Error) {
      switch (err.message) {
        case AI_PREVIEW_ERRORS.RECIPE_NOT_FOUND:
          logger.warn("Recipe not found or unauthorized", {
            user_id: userId,
            recipe_id: params.id,
          });
          return notFoundResponse();

        case AI_PREVIEW_ERRORS.NO_PREFERENCES:
          logger.warn("No dietary preferences set", {
            user_id: userId,
          });
          return noPreferencesResponse();

        case AI_PREVIEW_ERRORS.AI_SERVICE_ERROR:
          logger.error("AI service error", {
            user_id: userId,
            recipe_id: params.id,
            error_stack: getErrorStack(err),
          });
          return serviceUnavailableResponse();

        case AI_PREVIEW_ERRORS.DATABASE_ERROR:
          logger.error("Database error", {
            user_id: userId,
            recipe_id: params.id,
            error_stack: getErrorStack(err),
          });
          return internalServerErrorResponse("Database error occurred. Please try again.");
      }
    }

    // Handle validation errors
    if (err instanceof ZodError) {
      const errorMessages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      logger.warn("Validation error", {
        user_id: userId,
        errors: errorMessages.join(", "),
      });
      return validationErrorResponse("Validation failed", errorMessages);
    }

    // Handle unexpected errors
    logger.error("Unexpected error in AI preview endpoint", {
      user_id: userId,
      recipe_id: params.id,
      error_stack: getErrorStack(err),
    });
    return internalServerErrorResponse();
  }
};
