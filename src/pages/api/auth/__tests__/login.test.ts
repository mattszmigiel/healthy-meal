import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../login";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";
import { UnauthorizedError, RateLimitError } from "@/lib/errors/auth.errors";

describe("POST /api/auth/login", () => {
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

    it("should return 400 for empty password", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid input");
    });

    it("should accept valid email and password", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock successful login
      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Authentication", () => {
    it("should return 200 and user data on successful login", async () => {
      const mockUser = { id: "user-123", email: "test@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock successful login
      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe("user-123");
      expect(body.user.email).toBe("test@example.com");
      expect(body.message).toBe("Login successful");
    });

    it("should call AuthService.login with correct credentials", async () => {
      const mockUser = { id: "user-123", email: "test@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "mypassword" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      await POST(mockContext);

      expect(mockContext.locals.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "mypassword",
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 401 for invalid credentials", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock invalid credentials error with Supabase error message format
      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Invalid email or password");
    });

    it("should return 429 for rate limit exceeded", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      // Mock rate limit error
      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockRejectedValue(
        new RateLimitError("Too many login attempts")
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

      // Mock unexpected error
      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockRejectedValue(
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
    it("should not expose sensitive information in error messages", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Should not reveal whether email exists
      expect(body.message).not.toContain("user not found");
      expect(body.message).not.toContain("email does not exist");
      expect(body.message).toBe("Invalid email or password");
    });

    it("should handle UnauthorizedError correctly", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockRejectedValue(
        new UnauthorizedError("Invalid email or password")
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Invalid email or password");
    });
  });

  describe("Integration", () => {
    it("should work with AuthService through the full flow", async () => {
      const mockUser = { id: "user-123", email: "test@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
          headers: { "Content-Type": "application/json" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify AuthService was instantiated with correct Supabase client
      expect(mockContext.locals.supabase.auth.signInWithPassword).toHaveBeenCalled();

      // Verify response structure matches LoginResponseDTO
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("message");
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("email");
    });
  });
});
