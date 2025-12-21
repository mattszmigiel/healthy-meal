/**
 * Authentication Service
 *
 * Handles all authentication operations including login, registration, and password reset.
 * Uses Supabase Auth for backend authentication.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import { UnauthorizedError } from "@/lib/errors/auth.errors";
import type { AuthResponseDTO } from "@/types";

/**
 * Authentication error codes
 * Maps Supabase error messages to our internal error types
 */
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid login credentials",
  EMAIL_NOT_CONFIRMED: "Email not confirmed",
  USER_NOT_FOUND: "User not found",
  TOO_MANY_REQUESTS: "Too many requests",
  WEAK_PASSWORD: "Password is too weak",
  EMAIL_ALREADY_EXISTS: "Email already exists",
} as const;

/**
 * Authentication Service
 * Dependency injection pattern - receives Supabase client in constructor
 */
export class AuthService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Authenticate user with email and password
   *
   * @param email - User email address
   * @param password - User password
   * @returns AuthResponseDTO with user info and success message
   * @throws UnauthorizedError if credentials are invalid
   * @throws AuthenticationError for other authentication failures
   */
  async login(email: string, password: string): Promise<AuthResponseDTO> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error to our error type
      // For security, always return generic message for invalid credentials
      if (error.message === AUTH_ERRORS.INVALID_CREDENTIALS || error.message.includes("Invalid login credentials")) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Handle other specific error cases
      if (error.message.includes(AUTH_ERRORS.TOO_MANY_REQUESTS)) {
        throw new UnauthorizedError("Too many login attempts. Please try again later.");
      }

      // Generic error for any other authentication failure
      throw new UnauthorizedError("Authentication failed. Please try again.");
    }

    if (!data.user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Return successful authentication response
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      message: "Login successful",
    };
  }

  /**
   * Sign out the current user session
   *
   * Signs out the current session only (local scope).
   * Automatically clears session cookies and revokes refresh token.
   *
   * Note: This method uses optimistic approach - it logs errors but doesn't throw.
   * The session cookies will be cleared regardless of Supabase response.
   *
   * @param userId - Optional user ID for logging purposes
   * @returns Success message
   */
  async logout(userId?: string): Promise<{ message: string }> {
    try {
      // Call Supabase signOut with 'local' scope (current session only)
      // - 'local': Signs out only the current session (this device/browser)
      // - 'global': Would sign out all sessions (all devices) - not used per requirements
      // - 'others': Would sign out all other sessions except current - not used
      const { error } = await this.supabase.auth.signOut({ scope: "local" });

      // Log error for server-side monitoring but don't throw
      // Optimistic logout: user experience is prioritized over strict error handling
      if (error) {
        console.error("Supabase logout error:", {
          message: error.message,
          userId,
          timestamp: new Date().toISOString(),
        });
        // Note: Still proceeding with success response
      }

      // Always return success for optimistic UX
      // Client will redirect regardless
      // Even if Supabase is down, clearing cookies on next middleware run is sufficient
      return { message: "Logged out successfully" };
    } catch (error) {
      // Log unexpected errors (network issues, Supabase unavailable, etc.)
      console.error("Unexpected logout error:", {
        error,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Still return success (optimistic approach)
      // Middleware will handle lack of session on next request
      return { message: "Logged out successfully" };
    }
  }
}
