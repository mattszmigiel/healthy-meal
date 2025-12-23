/**
 * POST /api/auth/reset-password-request
 *
 * Initiates password reset flow by sending a reset email.
 * Always returns success to prevent email enumeration attacks.
 *
 * Request Body:
 * - email: string (valid email format)
 *
 * Success Response (200):
 * - message: "If an account exists with this email, you will receive a password reset link shortly."
 *
 * Error Responses:
 * - 400: Invalid request body (validation error)
 * - 500: Internal server error
 *
 * Security Features:
 * - Generic success message prevents email enumeration
 * - Errors logged server-side but not exposed to client
 */

import type { APIRoute } from "astro";

import { ResetPasswordRequestServerSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { internalServerErrorResponse, validationErrorResponse } from "@/lib/utils/api-responses";
import type { PasswordResetResponseDTO } from "@/types";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ResetPasswordRequestServerSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        "Invalid request body",
        validationResult.error.errors.map((e) => e.message)
      );
    }

    const { email } = validationResult.data;

    // Instantiate AuthService with Supabase client from locals
    const authService = new AuthService(locals.supabase);

    // Request password reset (always succeeds, errors logged internally)
    await authService.requestPasswordReset(email);

    // IMPORTANT: Always return the same success message
    // This prevents email enumeration attacks
    const response: PasswordResetResponseDTO = {
      message: "If an account exists with this email, you will receive a password reset link shortly.",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for server monitoring
    console.error("Password reset request error:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Return generic error (don't expose internal details)
    return internalServerErrorResponse("Unable to process password reset request. Please try again later.");
  }
};
