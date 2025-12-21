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
}
