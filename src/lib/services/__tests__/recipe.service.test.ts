import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecipeService } from "../recipe.service";
import type { CreateRecipeCommand, RecipeListQueryParams } from "@/types";

// Mock Supabase client at the top level
const mockSupabaseClient = {
  from: vi.fn(),
};

describe("RecipeService", () => {
  let service: RecipeService;
  const userId = "test-user-123";
  const recipeId = "recipe-123";

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create service instance with mocked Supabase client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new RecipeService(mockSupabaseClient as any);
  });

  describe("createRecipe", () => {
    it("should create recipe without AI metadata", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        title: "Spaghetti Carbonara",
        ingredients: "Pasta, eggs, bacon, parmesan",
        instructions: "Cook pasta. Mix eggs and cheese. Combine.",
        is_ai_generated: false,
        parent_recipe_id: null,
      };

      const createdRecipe = {
        id: recipeId,
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: false,
        parent_recipe_id: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const completeRecipe = {
        ...createdRecipe,
        ai_metadata: [],
      };

      // Mock the insert chain
      const mockInsert = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: createdRecipe,
        error: null,
      });

      // Mock the fetch chain
      const mockFetchSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockFetchSingle = vi.fn().mockResolvedValue({
        data: completeRecipe,
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === "recipes") {
          // First call is insert, second call is fetch
          if (mockSupabaseClient.from.mock.calls.length === 1) {
            return {
              insert: mockInsert,
            };
          } else {
            return {
              select: mockFetchSelect,
            };
          }
        }
        return {};
      });

      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });
      mockInsertSelect.mockReturnValue({
        single: mockInsertSingle,
      });

      mockFetchSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockFetchSingle,
      });

      // Act
      const result = await service.createRecipe(userId, command);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipes");
      expect(mockInsert).toHaveBeenCalledWith({
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: false,
        parent_recipe_id: null,
      });
      expect(result).toEqual({
        ...completeRecipe,
        ai_metadata: null, // Array transformed to null
      });
    });

    it("should create recipe with AI metadata", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        title: "Vegan Carbonara",
        ingredients: "Pasta, tofu, nutritional yeast",
        instructions: "Cook pasta. Blend tofu. Combine.",
        is_ai_generated: true,
        parent_recipe_id: "parent-recipe-123",
        ai_metadata: {
          model: "gpt-4o-mini",
          provider: "openai",
          generation_duration: 1500,
          raw_response: '{"modified": true}',
        },
      };

      const createdRecipe = {
        id: recipeId,
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: true,
        parent_recipe_id: "parent-recipe-123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const aiMetadata = {
        recipe_id: recipeId,
        owner_id: userId,
        model: command.ai_metadata?.model,
        provider: command.ai_metadata?.provider,
        generation_duration: command.ai_metadata?.generation_duration,
        raw_response: command.ai_metadata?.raw_response,
        created_at: "2025-01-01T00:00:00Z",
      };

      const completeRecipe = {
        ...createdRecipe,
        ai_metadata: [aiMetadata],
      };

      // Mock the insert recipe chain
      const mockInsert = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: createdRecipe,
        error: null,
      });

      // Mock the insert AI metadata chain
      const mockMetadataInsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock the fetch chain
      const mockFetchSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockFetchSingle = vi.fn().mockResolvedValue({
        data: completeRecipe,
        error: null,
      });

      let fromCallCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { insert: mockInsert };
        } else if (fromCallCount === 2) {
          return { insert: mockMetadataInsert };
        } else if (fromCallCount === 3) {
          return { select: mockFetchSelect };
        }
        return {};
      });

      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });
      mockInsertSelect.mockReturnValue({
        single: mockInsertSingle,
      });

      mockFetchSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockFetchSingle,
      });

      // Act
      const result = await service.createRecipe(userId, command);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipe_ai_metadata");
      expect(mockMetadataInsert).toHaveBeenCalledWith({
        recipe_id: recipeId,
        owner_id: userId,
        model: command.ai_metadata?.model,
        provider: command.ai_metadata?.provider,
        generation_duration: command.ai_metadata?.generation_duration,
        raw_response: command.ai_metadata?.raw_response,
      });
      expect(result.ai_metadata).toEqual(aiMetadata);
    });

    it("should throw error if recipe insert fails", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        title: "Test Recipe",
        ingredients: "Test ingredients",
        instructions: "Test instructions",
        is_ai_generated: false,
        parent_recipe_id: null,
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed", code: "23505" },
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });
      mockInsertSelect.mockReturnValue({
        single: mockInsertSingle,
      });

      // Act & Assert
      await expect(service.createRecipe(userId, command)).rejects.toThrow("Failed to create recipe: Insert failed");
    });

    it("should rollback recipe if AI metadata insert fails", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        title: "Test Recipe",
        ingredients: "Test ingredients",
        instructions: "Test instructions",
        is_ai_generated: true,
        parent_recipe_id: null,
        ai_metadata: {
          model: "gpt-4o-mini",
          provider: "openai",
          generation_duration: 1000,
          raw_response: "{}",
        },
      };

      const createdRecipe = {
        id: recipeId,
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: true,
        parent_recipe_id: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: createdRecipe,
        error: null,
      });

      const mockMetadataInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Metadata insert failed", code: "23503" },
      });

      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      let fromCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        fromCallCount++;
        if (table === "recipes" && fromCallCount === 1) {
          return { insert: mockInsert };
        } else if (table === "recipe_ai_metadata") {
          return { insert: mockMetadataInsert };
        } else if (table === "recipes" && fromCallCount === 3) {
          return { delete: mockDelete };
        }
        return {};
      });

      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });
      mockInsertSelect.mockReturnValue({
        single: mockInsertSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      // Act & Assert
      await expect(service.createRecipe(userId, command)).rejects.toThrow(
        "Failed to create AI metadata: Metadata insert failed"
      );

      // Verify rollback was attempted
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith("id", recipeId);
    });

    it("should throw error if fetching complete recipe fails", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        title: "Test Recipe",
        ingredients: "Test ingredients",
        instructions: "Test instructions",
        is_ai_generated: false,
        parent_recipe_id: null,
      };

      const createdRecipe = {
        id: recipeId,
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: false,
        parent_recipe_id: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockInsertSelect = vi.fn().mockReturnThis();
      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: createdRecipe,
        error: null,
      });

      const mockFetchSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockFetchSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Fetch failed", code: "PGRST000" },
      });

      let fromCallCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return { insert: mockInsert };
        } else {
          return { select: mockFetchSelect };
        }
      });

      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });
      mockInsertSelect.mockReturnValue({
        single: mockInsertSingle,
      });

      mockFetchSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockFetchSingle,
      });

      // Act & Assert
      await expect(service.createRecipe(userId, command)).rejects.toThrow(
        "Failed to fetch created recipe: Fetch failed"
      );
    });
  });

  describe("validateParentRecipe", () => {
    it("should return true when parent recipe exists and belongs to user", async () => {
      // Arrange
      const parentRecipeId = "parent-recipe-123";

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: parentRecipeId },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      // Act
      const result = await service.validateParentRecipe(userId, parentRecipeId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipes");
      expect(mockSelect).toHaveBeenCalledWith("id");
      expect(mockEq1).toHaveBeenCalledWith("id", parentRecipeId);
      expect(mockEq2).toHaveBeenCalledWith("owner_id", userId);
      expect(result).toBe(true);
    });

    it("should return false when parent recipe does not exist", async () => {
      // Arrange
      const parentRecipeId = "nonexistent-recipe";

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      // Act
      const result = await service.validateParentRecipe(userId, parentRecipeId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when database error occurs", async () => {
      // Arrange
      const parentRecipeId = "parent-recipe-123";

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "PGRST000" },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      // Act
      const result = await service.validateParentRecipe(userId, parentRecipeId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when recipe exists but belongs to different user (RLS filtered)", async () => {
      // Arrange
      const parentRecipeId = "other-user-recipe";

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null, // RLS filters it out
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      // Act
      const result = await service.validateParentRecipe(userId, parentRecipeId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getRecipeById", () => {
    it("should return recipe with AI metadata", async () => {
      // Arrange
      const aiMetadata = {
        recipe_id: recipeId,
        owner_id: userId,
        model: "gpt-4o-mini",
        provider: "openai",
        generation_duration: 1500,
        raw_response: "{}",
        created_at: "2025-01-01T00:00:00Z",
      };

      const recipeWithMetadata = {
        id: recipeId,
        owner_id: userId,
        title: "Vegan Carbonara",
        ingredients: "Pasta, tofu",
        instructions: "Cook pasta. Blend tofu.",
        is_ai_generated: true,
        parent_recipe_id: "parent-123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        ai_metadata: [aiMetadata],
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: recipeWithMetadata,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.getRecipeById(recipeId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipes");
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("ai_metadata:recipe_ai_metadata(*)"));
      expect(mockEq).toHaveBeenCalledWith("id", recipeId);
      expect(result).toEqual({
        ...recipeWithMetadata,
        ai_metadata: aiMetadata, // Array transformed to single object
      });
    });

    it("should return recipe without AI metadata", async () => {
      // Arrange
      const recipeWithoutMetadata = {
        id: recipeId,
        owner_id: userId,
        title: "Spaghetti Carbonara",
        ingredients: "Pasta, eggs",
        instructions: "Cook pasta.",
        is_ai_generated: false,
        parent_recipe_id: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        ai_metadata: [],
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: recipeWithoutMetadata,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.getRecipeById(recipeId);

      // Assert
      expect(result).toEqual({
        ...recipeWithoutMetadata,
        ai_metadata: null, // Empty array transformed to null
      });
    });

    it("should return null when recipe not found (PGRST116)", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.getRecipeById(recipeId);

      // Assert
      expect(result).toBeNull();
    });

    it("should throw error for actual database errors", async () => {
      // Arrange
      const dbError = {
        code: "PGRST000",
        message: "Database connection failed",
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: dbError,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act & Assert
      await expect(service.getRecipeById(recipeId)).rejects.toEqual(dbError);
    });
  });

  describe("listUserRecipes", () => {
    it("should return paginated list with default parameters", async () => {
      // Arrange
      const params: RecipeListQueryParams = {};
      const recipes = [
        {
          id: "recipe-1",
          owner_id: userId,
          title: "Recipe 1",
          ingredients: "Ingredients 1",
          instructions: "Instructions 1",
          is_ai_generated: false,
          parent_recipe_id: null,
          created_at: "2025-01-02T00:00:00Z",
          updated_at: "2025-01-02T00:00:00Z",
          ai_metadata: [],
        },
        {
          id: "recipe-2",
          owner_id: userId,
          title: "Recipe 2",
          ingredients: "Ingredients 2",
          instructions: "Instructions 2",
          is_ai_generated: true,
          parent_recipe_id: "recipe-1",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          ai_metadata: [
            {
              recipe_id: "recipe-2",
              owner_id: userId,
              model: "gpt-4o-mini",
              provider: "openai",
              generation_duration: 1000,
              raw_response: "{}",
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: recipes,
        error: null,
        count: 25,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await service.listUserRecipes(userId, params);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipes");
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("ai_metadata:recipe_ai_metadata(*)"), {
        count: "exact",
      });
      expect(mockEq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 19); // Default page=1, limit=20

      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "ai_metadata": null,
              "created_at": "2025-01-02T00:00:00Z",
              "id": "recipe-1",
              "ingredients": "Ingredients 1",
              "instructions": "Instructions 1",
              "is_ai_generated": false,
              "owner_id": "test-user-123",
              "parent_recipe_id": null,
              "title": "Recipe 1",
              "updated_at": "2025-01-02T00:00:00Z",
            },
            {
              "ai_metadata": {
                "created_at": "2025-01-01T00:00:00Z",
                "generation_duration": 1000,
                "model": "gpt-4o-mini",
                "owner_id": "test-user-123",
                "provider": "openai",
                "raw_response": "{}",
                "recipe_id": "recipe-2",
              },
              "created_at": "2025-01-01T00:00:00Z",
              "id": "recipe-2",
              "ingredients": "Ingredients 2",
              "instructions": "Instructions 2",
              "is_ai_generated": true,
              "owner_id": "test-user-123",
              "parent_recipe_id": "recipe-1",
              "title": "Recipe 2",
              "updated_at": "2025-01-01T00:00:00Z",
            },
          ],
          "pagination": {
            "limit": 20,
            "page": 1,
            "total": 25,
            "total_pages": 2,
          },
        }
      `);
    });

    it("should apply pagination correctly for page 2", async () => {
      // Arrange
      const params: RecipeListQueryParams = {
        page: 2,
        limit: 10,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      await service.listUserRecipes(userId, params);

      // Assert
      expect(mockRange).toHaveBeenCalledWith(10, 19); // Offset 10, limit 10
    });

    it("should filter by is_ai_generated when provided", async () => {
      // Arrange
      const params: RecipeListQueryParams = {
        is_ai_generated: true,
      };

      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      const mockSelect = vi.fn().mockReturnValue(mockQueryChain);

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      // Act
      await service.listUserRecipes(userId, params);

      // Assert
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("ai_metadata:recipe_ai_metadata(*)"), {
        count: "exact",
      });
      expect(mockQueryChain.eq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("is_ai_generated", true);
      expect(mockQueryChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should filter by parent_recipe_id when provided", async () => {
      // Arrange
      const parentRecipeId = "parent-123";
      const params: RecipeListQueryParams = {
        parent_recipe_id: parentRecipeId,
      };

      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      const mockSelect = vi.fn().mockReturnValue(mockQueryChain);

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      // Act
      await service.listUserRecipes(userId, params);

      // Assert
      expect(mockQueryChain.eq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("parent_recipe_id", parentRecipeId);
    });

    it("should apply both filters when provided", async () => {
      // Arrange
      const params: RecipeListQueryParams = {
        is_ai_generated: true,
        parent_recipe_id: "parent-123",
      };

      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      const mockSelect = vi.fn().mockReturnValue(mockQueryChain);

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      // Act
      await service.listUserRecipes(userId, params);

      // Assert
      expect(mockQueryChain.eq).toHaveBeenCalledWith("owner_id", userId);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("is_ai_generated", true);
      expect(mockQueryChain.eq).toHaveBeenCalledWith("parent_recipe_id", "parent-123");
    });

    it("should calculate pagination metadata correctly", async () => {
      // Arrange
      const params: RecipeListQueryParams = {
        page: 3,
        limit: 10,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 47, // 5 pages total (47 / 10 = 4.7, ceil to 5)
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await service.listUserRecipes(userId, params);

      // Assert
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 47,
        total_pages: 5,
      });
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const params: RecipeListQueryParams = {};

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "PGRST000" },
        count: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act & Assert
      await expect(service.listUserRecipes(userId, params)).rejects.toThrow("Failed to fetch recipes: Database error");
    });

    it("should handle count as null gracefully", async () => {
      // Arrange
      const params: RecipeListQueryParams = {};

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        range: mockRange,
      });

      // Act
      const result = await service.listUserRecipes(userId, params);

      // Assert
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.total_pages).toBe(0);
    });
  });

  describe("deleteRecipe", () => {
    it("should return true when recipe is successfully deleted", async () => {
      // Arrange
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Act
      const result = await service.deleteRecipe(recipeId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("recipes");
      expect(mockDelete).toHaveBeenCalledWith({ count: "exact" });
      expect(mockEq).toHaveBeenCalledWith("id", recipeId);
      expect(result).toBe(true);
    });

    it("should return false when recipe not found (count === 0)", async () => {
      // Arrange
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Act
      const result = await service.deleteRecipe(recipeId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when RLS filters out recipe (count === 0)", async () => {
      // Arrange - Recipe exists but belongs to another user
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 0, // RLS prevents deletion
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Act
      const result = await service.deleteRecipe(recipeId);

      // Assert
      expect(result).toBe(false);
    });

    it("should throw error when database delete fails", async () => {
      // Arrange
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Delete failed", code: "23503" },
        count: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Act & Assert
      await expect(service.deleteRecipe(recipeId)).rejects.toThrow("Failed to delete recipe: Delete failed");
    });

    it("should handle count as null gracefully", async () => {
      // Arrange
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      // Act
      const result = await service.deleteRecipe(recipeId);

      // Assert
      expect(result).toBe(false); // Treats null as 0
    });
  });
});
