import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";
import { errorResponse, unauthorizedResponse } from "@/lib/utils/api-responses";

/**
 * Example API Route Tests
 *
 * This demonstrates how to test API routes in your Astro application.
 * For real API route tests, you would:
 * 1. Import the actual API route handler (GET, POST, etc.)
 * 2. Create a mock context with request data
 * 3. Call the handler and assert on the response
 */

describe("API Route Testing Examples", () => {
  describe("Response Helpers Integration", () => {
    it("should create proper error response structure", async () => {
      const response = errorResponse(400, "test_error", "Test message");

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await parseResponse(response);
      expect(body).toEqual({
        error: "test_error",
        message: "Test message",
      });
    });

    it("should create unauthorized response", async () => {
      const response = unauthorizedResponse();

      expect(response.status).toBe(401);

      const body = await parseResponse(response);
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("Mock API Context", () => {
    it("should create mock context with default values", () => {
      const context = createMockAPIContext();

      expect(context.request).toBeInstanceOf(Request);
      expect(context.locals.supabase).toBeDefined();
      expect(context.cookies.get).toBeDefined();
    });

    it("should allow overriding request method and body", () => {
      const context = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ test: "data" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      expect(context.request.method).toBe("POST");
    });

    it("should allow mocking supabase responses", async () => {
      const mockUser = { id: "test-user-id", email: "test@example.com" };
      const context = createMockAPIContext();

      // Mock the getUser method
      vi.mocked(context.locals.supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await context.locals.supabase.auth.getUser();

      expect(result.data.user).toEqual(mockUser);
      expect(context.locals.supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("Example: Testing Authentication Flow", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockContext: any;

    beforeEach(() => {
      mockContext = createMockAPIContext();
    });

    it("should handle authenticated user", async () => {
      // Mock authenticated user
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        aud: "authenticated",
      };

      vi.mocked(mockContext.locals.supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockContext.locals.supabase.auth.getUser();

      expect(result.data.user.id).toBe("user-123");
      expect(result.error).toBeNull();
    });

    it("should handle unauthenticated user", async () => {
      // Mock unauthenticated state
      vi.mocked(mockContext.locals.supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated", status: 401 },
      });

      const result = await mockContext.locals.supabase.auth.getUser();

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe("Example: Testing Database Operations", () => {
    it("should mock database select query", async () => {
      const mockContext = createMockAPIContext();
      const mockRecipes = [
        { id: "1", name: "Recipe 1", user_id: "user-123" },
        { id: "2", name: "Recipe 2", user_id: "user-123" },
      ];

      // Mock the database query chain
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
        }),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(mockQuery);

      const { data, error } = await mockContext.locals.supabase.from("recipes").select("*").eq("user_id", "user-123");

      expect(data).toEqual(mockRecipes);
      expect(error).toBeNull();
      expect(mockContext.locals.supabase.from).toHaveBeenCalledWith("recipes");
    });

    it("should mock database insert operation", async () => {
      const mockContext = createMockAPIContext();
      const newRecipe = { name: "New Recipe", user_id: "user-123" };
      const insertedRecipe = { id: "3", ...newRecipe };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: insertedRecipe,
          error: null,
        }),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(mockQuery);

      const { data, error } = await mockContext.locals.supabase.from("recipes").insert(newRecipe).select().single();

      expect(data).toEqual(insertedRecipe);
      expect(error).toBeNull();
    });
  });
});
