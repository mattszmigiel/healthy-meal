import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../register";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";
import { ConflictError, RateLimitError } from "@/lib/errors/auth.errors";

describe("POST /api/auth/register", () => {
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
          body: JSON.stringify({ password: "password123" }),
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
          body: JSON.stringify({ email: "test@example.com" }),
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
          body: JSON.stringify({ email: "not-an-email", password: "password123" }),
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
          body: JSON.stringify({ email: "test@example.com", password: "short" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
      expect(body.details).toBeDefined();
    });

    it("should accept valid email and password (min 8 chars)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.status).toBe(201);
    });
  });

  describe("Registration", () => {
    it("should return 201 and user data on successful registration", async () => {
      const mockUser = { id: "user-123", email: "newuser@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "newuser@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe("user-123");
      expect(body.user.email).toBe("newuser@example.com");
      expect(body.message).toBe("Account created successfully");
    });

    it("should call AuthService.register with correct credentials", async () => {
      const mockUser = { id: "user-123", email: "newuser@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "newuser@example.com", password: "securepass" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      await POST(mockContext);

      expect(mockContext.locals.supabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "securepass",
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it("should auto-login user after registration (create session)", async () => {
      const mockUser = { id: "user-123", email: "newuser@example.com", aud: "authenticated" };
      const mockSession = { access_token: "token", refresh_token: "refresh" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "newuser@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(body.user).toBeDefined();
      // Session cookies are set automatically by Supabase SSR
    });
  });

  describe("Error Handling", () => {
    it("should return 409 for email already exists", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "existing@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockRejectedValue(
        new ConflictError("Email already registered")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(409);
      expect(body.error).toBe("Conflict");
      expect(body.message).toBe("Email already registered");
    });

    it("should return 429 for rate limit exceeded", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockRejectedValue(
        new RateLimitError("Too many registration attempts")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(429);
      expect(body.error).toBe("Rate limit exceeded");
      expect(body.retry_after).toBeDefined();
    });

    it("should return 500 for unexpected errors", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockRejectedValue(new Error("Database connection failed"));

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

    it("should handle Supabase error response format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "existing@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered", status: 400 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(409);
      expect(body.error).toBe("Conflict");
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
            body: JSON.stringify({ email: "test@example.com", password: testCase.password }),
            headers: { "Content-Type": "application/json" },
          },
        });

        if (testCase.shouldPass) {
          const mockUser = { id: "user-123", email: "test@example.com" };
          vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
            data: { user: mockUser, session: { access_token: "token" } },
            error: null,
          });
        }

        const response = await POST(mockContext);

        if (testCase.shouldPass) {
          expect(response.status).toBe(201);
        } else {
          expect(response.status).toBe(400);
        }

        vi.clearAllMocks();
      }
    });

    it("should handle email confirmation disabled (immediate access)", async () => {
      const mockUser = { id: "user-123", email: "newuser@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "newuser@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Email confirmation is disabled, so session is returned immediately
      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(body.user).toBeDefined();
      expect(body.message).toBe("Account created successfully");
    });
  });

  describe("Integration", () => {
    it("should work with AuthService through the full flow", async () => {
      const mockUser = { id: "user-123", email: "newuser@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "newuser@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify AuthService was instantiated with correct Supabase client
      expect(mockContext.locals.supabase.auth.signUp).toHaveBeenCalled();

      // Verify response structure matches RegisterResponseDTO
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("message");
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("email");
      expect(response.status).toBe(201);
    });

    it("should validate email format strictly", async () => {
      const invalidEmails = ["notanemail", "@example.com", "user@", "user @example.com", "user@.com"];

      for (const email of invalidEmails) {
        mockContext = createMockAPIContext({
          request: {
            method: "POST",
            body: JSON.stringify({ email, password: "password123" }),
            headers: { "Content-Type": "application/json" },
          },
        });

        const response = await POST(mockContext);
        const body = await parseResponse(response);

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid input");

        vi.clearAllMocks();
      }
    });
  });
});
