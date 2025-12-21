/**
 * POST /api/auth/logout
 *
 * Invalidates user session and clears cookies.
 * Uses optimistic logout approach - always returns success.
 *
 * Success Response (200):
 * - message: "Logged out successfully"
 *
 * Security Notes:
 * - Refresh token is revoked on successful signOut
 * - Access token (JWT) remains valid until expiration (~1 hour)
 * - Cookies cleared prevent token from being sent in future requests
 * - Middleware will redirect to /login on next protected route access
 */

import type { APIRoute } from "astro";

import { AuthService } from "@/lib/services/auth.service";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  // Instantiate AuthService with Supabase client from locals
  const authService = new AuthService(locals.supabase);

  // Sign out user (optimistic - always succeeds, logs errors internally)
  const result = await authService.logout(locals.user?.id);

  // Return successful logout response
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
