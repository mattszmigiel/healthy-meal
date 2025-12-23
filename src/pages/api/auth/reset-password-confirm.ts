/**
 * POST /api/auth/reset-password-confirm
 *
 * Confirms password reset using code from URL query parameters.
 * The code comes from Supabase redirect after user clicks email link.
 *
 * Flow:
 * 1. User clicks email link → Supabase redirects to /set-new-password?code=XXX
 * 2. Frontend extracts code from URL query parameters
 * 3. Frontend sends code + new password to this endpoint
 * 4. Backend validates token and updates password
 *
 * Request Body:
 * - code: string (from URL query parameters after email redirect)
 * - password: string (new password, minimum 8 characters)
 *
 * Success Response (200):
 * - message: "Password updated successfully"
 *
 * Error Responses:
 * - 400: Invalid request body, invalid token, or expired token
 * - 500: Internal server error
 *
 * Security Features:
 * - Token validation via session exchange
 * - Generic error messages (don't differentiate invalid vs expired)
 * - Strong password requirements enforced
 */

import type { APIRoute } from "astro";

import { ResetPasswordConfirmServerSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { handleAuthError, validationErrorResponse } from "@/lib/utils/api-responses";
import type { PasswordResetResponseDTO } from "@/types";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ResetPasswordConfirmServerSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        "Invalid request body",
        validationResult.error.errors.map((e) => e.message)
      );
    }

    const { code, password } = validationResult.data;

    // Instantiate AuthService with Supabase client from locals
    const authService = new AuthService(locals.supabase);

    // Confirm password reset (validates code and updates password)
    await authService.confirmPasswordReset(code, password);

    // Return success response
    const response: PasswordResetResponseDTO = {
      message: "Password updated successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle authentication errors with centralized error handler
    // This will return generic "invalid or expired" message for InvalidTokenError/ExpiredTokenError
    return handleAuthError(error);
  }
};
