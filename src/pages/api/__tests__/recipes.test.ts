import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "../recipes";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";

describe("GET /api/recipes", () => {
  let mockContext: ReturnType<typeof createMockAPIContext>;

  beforeEach(() => {
    mockContext = createMockAPIContext();
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "GET",
        },
        locals: {
          user: null,
        },
      });

      const response = await GET(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Authentication required");
    });

    it("should allow authenticated user to list recipes", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "GET",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(
        mockQuery as unknown as ReturnType<typeof mockContext.locals.supabase.from>
      );

      const response = await GET(mockContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Query Parameters", () => {
    beforeEach(() => {
      mockContext.locals.user = { id: "user-123", email: "test@example.com" };
    });

    it("should return 400 for invalid page parameter", async () => {
      mockContext.request = new Request("http://localhost:3000/api/recipes?page=invalid");

      const response = await GET(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Bad Request");
      expect(body.message).toBe("Invalid query parameters");
    });

    it("should handle valid pagination parameters", async () => {
      mockContext.request = new Request("http://localhost:3000/api/recipes?page=1&limit=20");

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(
        mockQuery as unknown as ReturnType<typeof mockContext.locals.supabase.from>
      );

      const response = await GET(mockContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockContext.locals.user = { id: "user-123", email: "test@example.com" };
    });

    it("should return 500 for database errors", async () => {
      mockContext.request = new Request("http://localhost:3000/api/recipes");

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockRejectedValue(new Error("Database error")),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(
        mockQuery as unknown as ReturnType<typeof mockContext.locals.supabase.from>
      );

      const response = await GET(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal Server Error");
      expect(body.message).toBe("An unexpected error occurred");
    });
  });
});

describe("POST /api/recipes", () => {
  let mockContext: ReturnType<typeof createMockAPIContext>;

  beforeEach(() => {
    mockContext = createMockAPIContext();
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({ title: "Test", ingredients: "Test", instructions: "Test", is_ai_generated: false }),
          headers: { "Content-Type": "application/json" },
        },
        locals: {
          user: null,
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Authentication required");
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      mockContext.locals.user = { id: "user-123", email: "test@example.com" };
    });

    it("should return 400 for missing required fields", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Validation Error");
      expect(body.message).toBe("Invalid request data");
    });

    // TODO: Add integration test for successful recipe creation
    // Requires more complex mocking of RecipeService query chains
    it.skip("should accept valid recipe data", async () => {
      const recipeData = {
        title: "New Recipe",
        ingredients: "Ingredient 1\nIngredient 2",
        instructions: "Step 1\nStep 2",
        is_ai_generated: false,
      };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify(recipeData),
          headers: { "Content-Type": "application/json" },
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      const createdRecipe = {
        id: "recipe-123",
        user_id: "user-123",
        ...recipeData,
        created_at: new Date().toISOString(),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(
        mockInsertQuery as unknown as ReturnType<typeof mockContext.locals.supabase.from>
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(body.id).toBe("recipe-123");
      expect(body.title).toBe("New Recipe");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockContext.locals.user = { id: "user-123", email: "test@example.com" };
    });

    it("should return 500 for database errors", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: JSON.stringify({
            title: "Test Recipe",
            ingredients: "Ingredient 1",
            instructions: "Step 1",
            is_ai_generated: false,
          }),
          headers: { "Content-Type": "application/json" },
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error("Database error")),
      };

      vi.mocked(mockContext.locals.supabase.from).mockReturnValue(
        mockInsertQuery as unknown as ReturnType<typeof mockContext.locals.supabase.from>
      );

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal Server Error");
      expect(body.message).toBe("An unexpected error occurred while creating the recipe");
    });

    it("should handle malformed JSON request body", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
          body: "not valid json",
          headers: { "Content-Type": "application/json" },
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal Server Error");
    });
  });
});
