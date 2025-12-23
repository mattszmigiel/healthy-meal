/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password.
 * Auto-creates session and logs user in immediately.
 * Email confirmation is disabled - users get immediate access.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (minimum 8 characters)
 *
 * Success Response (201):
 * - user: { id, email }
 * - message: "Account created successfully"
 *
 * Error Responses:
 * - 400: Invalid request body or registration failed
 * - 401: Email already exists or password requirements not met
 * - 429: Too many registration attempts (Supabase rate limiting)
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";

import { RegisterRequestSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { handleAuthError, validationErrorResponse } from "@/lib/utils/api-responses";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        "Invalid request body",
        validationResult.error.errors.map((e) => e.message)
      );
    }

    const { email, password } = validationResult.data;

    // Instantiate AuthService with Supabase client from locals
    const authService = new AuthService(locals.supabase);

    // Register user (session cookies set automatically by Supabase)
    const result = await authService.register(email, password);

    // Return successful registration response with 201 Created
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle authentication errors with centralized error handler
    return handleAuthError(error);
  }
};
