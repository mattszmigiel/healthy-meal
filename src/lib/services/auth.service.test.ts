/**
 * AuthService Unit Tests
 *
 * Tests all authentication operations with comprehensive error handling coverage.
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import {
  AuthenticationError,
  ConflictError,
  ExpiredTokenError,
  InvalidTokenError,
  UnauthorizedError,
} from "@/lib/errors/auth.errors";
import { createMockSupabaseClient } from "@/test/helpers/api-test-helpers";
import { AuthService } from "./auth.service";

/**
 * Creates a mock Supabase User object with all required fields
 */
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  email: "test@example.com",
  aud: "authenticated",
  created_at: "2025-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {},
  ...overrides,
});

/**
 * Extends the base mock Supabase client with auth-specific methods
 */
const createAuthMockSupabaseClient = () => {
  const baseMock = createMockSupabaseClient();

  return {
    ...baseMock,
    auth: {
      ...baseMock.auth,
      exchangeCodeForSession: vi.fn(),
      updateUser: vi.fn(),
    },
  } as unknown as SupabaseClient<Database>;
};

describe("AuthService", () => {
  let authService: AuthService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create fresh mock instance
    mockSupabase = createAuthMockSupabaseClient();
    authService = new AuthService(mockSupabase);

    // Suppress console.error for error logging tests
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("login", () => {
    const validEmail = "test@example.com";
    const validPassword = "password123";

    it("should return AuthResponseDTO on successful login", async () => {
      // Arrange
      const mockUser = createMockUser({
        id: "user-123",
        email: validEmail,
      });

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: "token", refresh_token: "refresh" } as any,
        },
        error: null,
      });

      // Act
      const result = await authService.login(validEmail, validPassword);

      // Assert
      expect(result).toEqual({
        user: {
          id: "user-123",
          email: validEmail,
        },
        message: "Login successful",
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    });

    it("should use user email from response, fallback to input email if null", async () => {
      // Arrange - Supabase returns undefined email
      const mockUser = createMockUser({
        id: "user-123",
        email: undefined,
      });

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      // Act
      const result = await authService.login(validEmail, validPassword);

      // Assert
      expect(result.user.email).toBe(validEmail);
    });

    it("should throw UnauthorizedError for invalid credentials", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", name: "AuthError", status: 400 } as any,
      });

      // Act & Assert
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow("Invalid email or password");
    });

    it("should throw UnauthorizedError for credentials with 'Invalid login credentials' substring", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Error: Invalid login credentials provided",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow("Invalid email or password");
    });

    it("should throw UnauthorizedError for too many requests", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Too many requests", name: "AuthError", status: 429 } as any,
      });

      // Act & Assert
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow(
        "Too many login attempts. Please try again later."
      );
    });

    it("should throw UnauthorizedError with generic message for other errors", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Network error", name: "AuthError", status: 500 } as any,
      });

      // Act & Assert
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow(
        "Authentication failed. Please try again."
      );
    });

    it("should throw UnauthorizedError when user is null despite no error", async () => {
      // Arrange - edge case: no error but no user either
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      // Act & Assert
      await expect(authService.login(validEmail, validPassword)).rejects.toThrow("Invalid email or password");
    });
  });

  describe("register", () => {
    const validEmail = "newuser@example.com";
    const validPassword = "SecurePass123!";

    it("should return AuthResponseDTO on successful registration", async () => {
      // Arrange
      const mockUser = createMockUser({
        id: "user-456",
        email: validEmail,
      });

      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      // Act
      const result = await authService.register(validEmail, validPassword);

      // Assert
      expect(result).toEqual({
        user: {
          id: "user-456",
          email: validEmail,
        },
        message: "Account created successfully",
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
        options: {
          emailRedirectTo: undefined, // MVP: no email confirmation
        },
      });
    });

    it("should throw ConflictError when email already exists", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "User already registered",
          name: "AuthError",
          status: 422,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(ConflictError);
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
        "Registration failed. Please try again or login if you already have an account."
      );
    });

    it("should throw ConflictError for 'already exists' error message", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Email already exists in the system",
          name: "AuthError",
          status: 422,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(ConflictError);
    });

    it("should throw AuthenticationError for weak password", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Password is too weak",
          name: "AuthError",
          status: 422,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, "weak")).rejects.toThrow(AuthenticationError);
      await expect(authService.register(validEmail, "weak")).rejects.toThrow("Password does not meet requirements");
    });

    it("should throw AuthenticationError for password-related errors (lowercase)", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "password must be at least 8 characters",
          name: "AuthError",
          status: 422,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, "short")).rejects.toThrow("Password does not meet requirements");
    });

    it("should throw AuthenticationError for too many requests", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Too many requests",
          name: "AuthError",
          status: 429,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
        "Too many registration attempts. Please try again later."
      );
    });

    it("should throw generic AuthenticationError for unknown errors", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Database connection failed",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
        "Registration failed. Please try again."
      );
    });

    it("should throw AuthenticationError when user is null despite no error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act & Assert
      await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
        "Registration failed. Please try again."
      );
    });
  });

  describe("logout", () => {
    it("should return success message on successful logout", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      // Act
      const result = await authService.logout("user-123");

      // Assert
      expect(result).toEqual({ message: "Logged out successfully" });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("should log error but still return success on Supabase error (optimistic UX)", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error");
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: { message: "Network error", name: "AuthError", status: 500 } as any,
      });

      // Act
      const result = await authService.logout("user-456");

      // Assert - optimistic approach: always returns success
      expect(result).toEqual({ message: "Logged out successfully" });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith("Supabase logout error:", {
        message: "Network error",
        userId: "user-456",
        timestamp: expect.any(String),
      });
    });

    it("should log error but still return success on unexpected exception (optimistic UX)", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error");
      vi.mocked(mockSupabase.auth.signOut).mockRejectedValue(new Error("Unexpected error"));

      // Act
      const result = await authService.logout("user-789");

      // Assert - still returns success despite exception
      expect(result).toEqual({ message: "Logged out successfully" });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected logout error:", {
        error: expect.any(Error),
        userId: "user-789",
        timestamp: expect.any(String),
      });
    });

    it("should work without userId parameter", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });

  describe("requestPasswordReset", () => {
    const testEmail = "reset@example.com";

    it("should send password reset email successfully", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {} as any,
        error: null,
      });

      // Act
      const result = await authService.requestPasswordReset(testEmail);

      // Assert
      expect(result).toBeUndefined(); // Returns void
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(testEmail, {
        redirectTo: expect.stringContaining("/set-new-password"),
      });
    });

    it("should silently handle errors to prevent email enumeration", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error");
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: null,
        error: {
          message: "User not found",
          name: "AuthError",
          status: 404,
        } as any,
      });

      // Act
      const result = await authService.requestPasswordReset(testEmail);

      // Assert - should still succeed to prevent email enumeration
      expect(result).toBeUndefined();

      // Verify error was logged with partial email
      expect(consoleErrorSpy).toHaveBeenCalledWith("Password reset request error:", {
        message: "User not found",
        email: "res***", // First 3 chars + ***
        timestamp: expect.any(String),
      });
    });

    it("should construct redirect URL correctly", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {} as any,
        error: null,
      });

      // Act
      await authService.requestPasswordReset(testEmail);

      // Assert - verify correct endpoint is called with redirect URL
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        testEmail,
        expect.objectContaining({
          redirectTo: expect.stringContaining("/set-new-password"),
        })
      );
    });
  });

  describe("confirmPasswordReset", () => {
    const validCode = "recovery-code-123";
    const newPassword = "NewSecurePassword123!";

    it("should successfully reset password with valid code", async () => {
      // Arrange
      const mockSession = {
        access_token: "token",
        refresh_token: "refresh",
        user: { id: "user-123", email: "user@example.com" },
      };

      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: mockSession } as any,
        error: null,
      });

      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: mockSession.user } as any,
        error: null,
      });

      // Act
      const result = await authService.confirmPasswordReset(validCode, newPassword);

      // Assert
      expect(result).toBeUndefined(); // Returns void
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(validCode);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it("should throw InvalidTokenError for invalid recovery code", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid code",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(authService.confirmPasswordReset("invalid-code", newPassword)).rejects.toThrow(InvalidTokenError);
      await expect(authService.confirmPasswordReset("invalid-code", newPassword)).rejects.toThrow(
        "Invalid or expired reset token"
      );
    });

    it("should throw InvalidTokenError for expired code", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Code has expired",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow(InvalidTokenError);
    });

    it("should throw InvalidTokenError when session is null despite no error", async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      // Act & Assert
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow(
        "Invalid or expired reset token"
      );
    });

    it("should throw ExpiredTokenError when password update fails with expired error", async () => {
      // Arrange
      const mockSession = {
        access_token: "token",
        user: { id: "user-123" },
      };

      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: mockSession } as any,
        error: null,
      });

      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: {
          message: "Session has expired",
          name: "AuthError",
          status: 401,
        } as any,
      });

      // Act & Assert
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow(ExpiredTokenError);
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow("Reset link has expired");
    });

    it("should throw UnauthorizedError for generic password update failures", async () => {
      // Arrange
      const mockSession = {
        access_token: "token",
        user: { id: "user-123" },
      };

      vi.mocked(mockSupabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: mockSession } as any,
        error: null,
      });

      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: {
          message: "Database error",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow(UnauthorizedError);
      await expect(authService.confirmPasswordReset(validCode, newPassword)).rejects.toThrow(
        "Failed to update password"
      );
    });
  });

  describe("Type Safety", () => {
    it("should have correct return type for login", async () => {
      // Arrange
      const mockUser = createMockUser({
        id: "user-123",
        email: "test@example.com",
      });

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: "token" } as any,
        },
        error: null,
      });

      // Act
      const result = await authService.login("test@example.com", "password");

      // Assert - Type-level check
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("message");
      expect(result.user).toHaveProperty("id");
      expect(result.user).toHaveProperty("email");
    });

    it("should accept SupabaseClient<Database> in constructor", () => {
      // Type-level test: this should compile without errors
      const service = new AuthService(mockSupabase);
      expect(service).toBeInstanceOf(AuthService);
    });
  });
});
