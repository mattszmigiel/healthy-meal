import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../reset-password-confirm";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";
import { InvalidTokenError, ExpiredTokenError } from "@/lib/errors/auth.errors";

describe("POST /api/auth/reset-password-confirm", () => {
  let mockContext: ReturnType<typeof createMockAPIContext>;

  beforeEach(() => {
    mockContext = createMockAPIContext();
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("should return 400 for missing code", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should return 400 for missing password", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-reset-code-123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should return 400 for password shorter than 8 characters", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-code", password: "short" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should accept valid code and password", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-reset-code-123", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock successful password update with session exchange
      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Password Reset Flow", () => {
    it("should return 200 on successful password reset", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-reset-code-123", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(body.message).toBe("Password updated successfully");
    });

    it("should call AuthService.confirmPasswordReset with code and password", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "reset-code-456", password: "newsecurepass" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      await POST(mockContext);

      // Verify the code is exchanged for session
      expect(mockContext.locals.supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("reset-code-456");

      // Verify password is updated
      expect(mockContext.locals.supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newsecurepass",
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid reset code", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "invalid-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockRejectedValue(
        new InvalidTokenError("Invalid reset token")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid token");
      expect(body.message).toBe("This reset link is invalid or has expired");
    });

    it("should return 400 for expired reset code", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "expired-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockRejectedValue(
        new ExpiredTokenError("Reset token has expired")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid token");
      // Generic message for security (don't differentiate invalid vs expired)
      expect(body.message).toBe("This reset link is invalid or has expired");
    });

    it("should return 500 for unexpected errors", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    it("should handle malformed JSON request body", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: "not valid json",
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("Security", () => {
    it("should enforce minimum password length (8 characters)", async () => {
      const testCases = [
        { password: "", shouldPass: false },
        { password: "1234567", shouldPass: false },
        { password: "12345678", shouldPass: true },
        { password: "verylongpassword123", shouldPass: true },
      ];

      for (const testCase of testCases) {
        mockContext = createMockAPIContext({
          request: {
            method: "POST",
            body: JSON.stringify({ code: "valid-code", password: testCase.password }),
            headers: { "Content-Type": "application/json" },
          },
        });

        if (testCase.shouldPass) {
          vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
            data: { user: { id: "user-123" }, session: { access_token: "token" } },
            error: null,
          });

          vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          });
        }

        const response = await POST(mockContext);

        if (testCase.shouldPass) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(400);
        }

        vi.clearAllMocks();
      }
    });

    it("should not differentiate between invalid and expired tokens in error message", async () => {
      // Test invalid token
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "invalid", password: "newpass123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockRejectedValue(
        new InvalidTokenError("Invalid")
      );

      const invalidResponse = await POST(mockContext);
      const invalidBody = await parseResponse(invalidResponse);

      // Test expired token
      vi.clearAllMocks();
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "expired", password: "newpass123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockRejectedValue(
        new ExpiredTokenError("Expired")
      );

      const expiredResponse = await POST(mockContext);
      const expiredBody = await parseResponse(expiredResponse);

      // Both should return the same generic message
      expect(invalidBody.message).toBe(expiredBody.message);
      expect(invalidBody.message).toBe("This reset link is invalid or has expired");
    });

    it("should validate code format", async () => {
      const testCodes = ["valid-code-123", "abc123", "CODE_456"];

      for (const code of testCodes) {
        mockContext = createMockAPIContext({
          request: {
            method: "POST",
            body: JSON.stringify({ code, password: "newpassword123" }),
            headers: { "Content-Type": "application/json" },
          },
        });

        vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
          data: { user: { id: "user-123" }, session: { access_token: "token" } },
          error: null,
        });

        vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        });

        const response = await POST(mockContext);

        // All non-empty strings should be accepted (validation is in Supabase)
        expect(response.status).toBe(200);

        vi.clearAllMocks();
      }
    });
  });

  describe("Integration", () => {
    it("should work with AuthService through the full flow", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify AuthService was instantiated with correct Supabase client
      expect(mockContext.locals.supabase.auth.exchangeCodeForSession).toHaveBeenCalled();
      expect(mockContext.locals.supabase.auth.updateUser).toHaveBeenCalled();

      // Verify response structure matches PasswordResetResponseDTO
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("Password updated successfully");
      expect(response.status).toBe(200);
    });

    it("should handle the complete password reset flow", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "reset-code-789", password: "brandnewpassword" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const mockUser = { id: "user-789", email: "user@example.com" };

      // Step 1: Exchange code for session
      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token", refresh_token: "refresh" } },
        error: null,
      });

      // Step 2: Update password
      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify the flow
      expect(mockContext.locals.supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("reset-code-789");
      expect(mockContext.locals.supabase.auth.updateUser).toHaveBeenCalledWith({ password: "brandnewpassword" });
      expect(response.status).toBe(200);
      expect(body.message).toBe("Password updated successfully");
    });
  });

  describe("Response Format", () => {
    it("should return JSON response with correct content type", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return consistent message format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ code: "valid-code", password: "newpassword123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { user: { id: "user-123" }, session: { access_token: "token" } },
        error: null,
      });

      vi.mocked(mockContext.locals.supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(body).toEqual({
        message: "Password updated successfully",
      });
    });
  });
});
