import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../reset-password-request";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";

describe("POST /api/auth/reset-password-request", () => {
  let mockContext: ReturnType<typeof createMockAPIContext>;

  beforeEach(() => {
    mockContext = createMockAPIContext();
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("should return 400 for missing email", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should return 400 for invalid email format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "not-an-email" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should accept valid email format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Security - Email Enumeration Prevention", () => {
    it("should return same success message for existing email", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "existing@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe(
        "If an account exists with this email, you will receive a password reset link shortly."
      );
    });

    it("should return same success message for non-existing email", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "nonexistent@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Even if user doesn't exist, return success
      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: "User not found", status: 404 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe(
        "If an account exists with this email, you will receive a password reset link shortly."
      );
    });

    it("should not reveal whether email exists in system", async () => {
      const testEmails = ["existing@example.com", "nonexistent@example.com", "another@example.com"];

      for (const email of testEmails) {
        mockContext = createMockAPIContext({
          request: {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: { "Content-Type": "application/json" },
          },
        });

        vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
          data: {},
          error: null,
        });

        const response = await POST(mockContext);
        const body = await parseResponse(response);

        // All requests should return identical response
        expect(response.status).toBe(200);
        expect(body.message).toBe(
          "If an account exists with this email, you will receive a password reset link shortly."
        );

        vi.clearAllMocks();
      }
    });
  });

  describe("Email Sending", () => {
    it("should call AuthService.requestPasswordReset with email", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      await POST(mockContext);

      expect(mockContext.locals.supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
        redirectTo: "http://localhost:3000/set-new-password",
      });
    });

    it("should return 200 even if email send fails", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock email send failure
      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: "Email service unavailable", status: 500 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Still return success to prevent enumeration
      expect(response.status).toBe(200);
      expect(body.message).toBe(
        "If an account exists with this email, you will receive a password reset link shortly."
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 for unexpected errors", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock unexpected error
      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(body.message).toBe("Unable to process password reset request. Please try again later.");
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

    it("should log errors server-side without exposing to client", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockRejectedValue(
        new Error("Internal error")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Error is logged
      expect(consoleSpy).toHaveBeenCalled();

      // But client gets generic message
      expect(body.message).toBe("Unable to process password reset request. Please try again later.");

      consoleSpy.mockRestore();
    });
  });

  describe("Integration", () => {
    it("should work with AuthService through the full flow", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify AuthService was instantiated with correct Supabase client
      expect(mockContext.locals.supabase.auth.resetPasswordForEmail).toHaveBeenCalled();

      // Verify response structure matches PasswordResetResponseDTO
      expect(body).toHaveProperty("message");
      expect(response.status).toBe(200);
    });

    it("should validate various email formats", async () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user123@subdomain.example.com",
      ];

      for (const email of validEmails) {
        mockContext = createMockAPIContext({
          request: {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: { "Content-Type": "application/json" },
          },
        });

        vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
          data: {},
          error: null,
        });

        const response = await POST(mockContext);

        expect(response.status).toBe(200);

        vi.clearAllMocks();
      }
    });
  });

  describe("Response Format", () => {
    it("should return JSON response with correct content type", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return consistent message format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(body).toEqual({
        message: "If an account exists with this email, you will receive a password reset link shortly.",
      });
    });
  });
});
