/**
 * Authentication Service
 *
 * Handles all authentication operations including login, registration, and password reset.
 * Uses Supabase Auth for backend authentication.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";
import {
  AuthenticationError,
  ConflictError,
  ExpiredTokenError,
  InvalidTokenError,
  UnauthorizedError,
} from "@/lib/errors/auth.errors";
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
   * Register a new user with email and password
   *
   * Creates a new user account and automatically signs them in.
   * Email confirmation is disabled for MVP - users get immediate access.
   *
   * @param email - User email address
   * @param password - User password (minimum 8 characters)
   * @returns AuthResponseDTO with user info and success message
   * @throws AuthenticationError if registration fails or email already exists
   */
  async register(email: string, password: string): Promise<AuthResponseDTO> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // No email confirmation for MVP
      },
    });

    if (error) {
      // Use generic message to prevent email enumeration
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        throw new ConflictError("Registration failed. Please try again or login if you already have an account.");
      }

      if (error.message.includes("Password") || error.message.includes("password")) {
        throw new AuthenticationError("Password does not meet requirements");
      }

      if (error.message.includes(AUTH_ERRORS.TOO_MANY_REQUESTS)) {
        throw new AuthenticationError("Too many registration attempts. Please try again later.");
      }

      // Generic error for any other registration failure
      throw new AuthenticationError("Registration failed. Please try again.");
    }

    if (!data.user) {
      throw new AuthenticationError("Registration failed. Please try again.");
    }

    // Return successful registration response
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      message: "Account created successfully",
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

  /**
   * Send password reset email via Supabase Auth
   *
   * Security: Always returns success to prevent email enumeration attacks.
   * This prevents attackers from discovering which emails are registered.
   *
   * @param email - User email address
   * @returns void - Always succeeds (errors are logged but not thrown)
   */
  async requestPasswordReset(email: string): Promise<void> {
    const siteUrl = import.meta.env.SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/set-new-password`;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    // Silently handle errors to prevent email enumeration
    // Don't reveal if email exists in the system
    if (error) {
      // Log for server-side monitoring (never expose to client)
      console.error("Password reset request error:", {
        message: error.message,
        email: email.substring(0, 3) + "***", // Partial email for privacy
        timestamp: new Date().toISOString(),
      });
      // Could integrate with monitoring service here (e.g., Sentry)
    }

    // Always return success - no indication whether email exists
    return;
  }

  /**
   * Confirm password reset using recovery code
   *
   * Flow:
   * 1. User clicks email link → Supabase redirects with code in URL hash
   * 2. Frontend extracts code and sends to this endpoint
   * 3. Backend uses the code to authenticate and update password
   *
   * Security: The code is a short-lived JWT that Supabase provides
   * after verifying the recovery link. We use it to create an authenticated
   * session and update the password.
   *
   * @param code - Recovery code from URL hash (after email link redirect)
   * @param newPassword - New password meeting strength requirements
   * @throws InvalidTokenError if token is invalid or malformed
   * @throws ExpiredTokenError if token has expired
   * @throws UnauthorizedError if password update fails
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    // Step 1: Set the session using the recovery code
    // This validates the code and creates an authenticated session
    const { data: sessionData, error: sessionError } = await this.supabase.auth.exchangeCodeForSession(code);

    // Handle token validation errors
    if (sessionError || !sessionData.session) {
      // Check for specific error types
      if (sessionError?.message.includes("expired") || sessionError?.message.includes("Invalid")) {
        throw new InvalidTokenError("Invalid or expired reset token");
      }

      // Generic invalid token error (prevents information leakage)
      throw new InvalidTokenError("Invalid or expired reset token");
    }

    // Step 2: Update password using the authenticated session
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // Check for specific error types
      if (updateError.message.includes("expired")) {
        throw new ExpiredTokenError("Reset link has expired");
      }

      // Generic error (don't expose internal details)
      throw new UnauthorizedError("Failed to update password");
    }

    // Password successfully updated
    return;
  }
}
