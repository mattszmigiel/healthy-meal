/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Sets session cookies automatically via Supabase SSR.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (non-empty)
 *
 * Success Response (200):
 * - user: { id, email }
 * - message: "Login successful"
 *
 * Error Responses:
 * - 400: Invalid request body (validation error)
 * - 401: Invalid credentials
 * - 429: Too many login attempts
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";

import { LoginRequestSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { handleAuthError, validationErrorResponse } from "@/lib/utils/api-responses";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = LoginRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        "Invalid request body",
        validationResult.error.errors.map((e) => e.message)
      );
    }

    const { email, password } = validationResult.data;

    // Instantiate AuthService with Supabase client from locals
    const authService = new AuthService(locals.supabase);

    // Authenticate user (session cookies set automatically by Supabase)
    const result = await authService.login(email, password);

    // Return successful authentication response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle authentication errors with centralized error handler
    return handleAuthError(error);
  }
};
