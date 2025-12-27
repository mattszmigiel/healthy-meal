/**
 * AIPreviewService Unit Tests
 *
 * Tests AI-powered recipe modification with comprehensive error handling coverage.
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { RecipeEntity, DietaryPreferencesEntity } from "@/types";
import type { ChatResponse } from "../openrouter/openrouter.types";
import { OpenRouterError } from "../openrouter/openrouter.types";
import { AIPreviewService, AI_PREVIEW_ERRORS } from "../ai-preview.service";
import { createMockSupabaseClient } from "@/test/helpers/api-test-helpers";

// ============================================================================
// Mock OpenRouterService
// ============================================================================

// Create a mock chat function that will be shared across all instances
const mockChat = vi.fn();

vi.mock("../openrouter/openrouter.service", () => ({
  OpenRouterService: class MockOpenRouterService {
    chat = mockChat;
  },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockRecipe = (overrides?: Partial<RecipeEntity>): RecipeEntity => ({
  id: "recipe-123",
  title: "Classic Lasagna",
  ingredients: "Ground beef\nPasta sheets\nMozzarella cheese\nTomato sauce",
  instructions: "1. Brown the beef\n2. Layer ingredients\n3. Bake at 350°F",
  owner_id: "user-123",
  is_ai_generated: false,
  parent_recipe_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createMockPreferences = (overrides?: Partial<DietaryPreferencesEntity>): DietaryPreferencesEntity => ({
  user_id: "user-123",
  diet_type: "vegan",
  allergies: ["nuts"],
  disliked_ingredients: ["mushrooms"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createMockChatResponse = (overrides?: Partial<ChatResponse>): ChatResponse => ({
  id: "chatcmpl-123",
  model: "openai/gpt-4o-mini",
  created: Date.now(),
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: JSON.stringify({
          title: "Vegan Lasagna",
          ingredients: "Plant-based meat\nPasta sheets\nVegan cheese\nTomato sauce",
          instructions: "1. Brown the plant-based meat\n2. Layer ingredients\n3. Bake at 350°F",
          explanation: "Replaced beef with plant-based meat and dairy cheese with vegan cheese",
        }),
        toolCalls: undefined,
      },
      finishReason: "stop",
    },
  ],
  usage: {
    promptTokens: 100,
    completionTokens: 200,
    totalTokens: 300,
  },
  ...overrides,
});

/**
 * Extends the base mock Supabase client with query builder chain
 */
const createAIPreviewMockSupabaseClient = () => {
  const baseMock = createMockSupabaseClient();

  // Create chainable query builder mocks
  const createQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  });

  return {
    ...baseMock,
    from: vi.fn(() => createQueryBuilder()),
  } as unknown as SupabaseClient<Database>;
};

// ============================================================================
// Test Suite
// ============================================================================

describe("AIPreviewService", () => {
  let aiPreviewService: AIPreviewService;
  let mockSupabase: SupabaseClient<Database>;
  const testApiKey = "test-api-key";
  const testUserId = "user-123";
  const testRecipeId = "recipe-123";

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create fresh mock instances
    mockSupabase = createAIPreviewMockSupabaseClient();
    aiPreviewService = new AIPreviewService(mockSupabase, testApiKey);

    // Suppress console logs for cleaner test output
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe("constructor", () => {
    it("should initialize with Supabase client and API key", () => {
      // Act
      const service = new AIPreviewService(mockSupabase, testApiKey);

      // Assert
      expect(service).toBeInstanceOf(AIPreviewService);
    });
  });

  // ============================================================================
  // Happy Path Tests
  // ============================================================================

  describe("generateAIPreview - happy path", () => {
    it("should return AI preview response for valid recipe and preferences", async () => {
      // Arrange
      const mockRecipe = createMockRecipe();
      const mockPreferences = createMockPreferences();
      const mockChatResponse = createMockChatResponse();

      // Mock database queries
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockRecipe,
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(mockChatResponse);

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(result).toMatchObject({
        original_recipe: {
          id: mockRecipe.id,
          title: mockRecipe.title,
          ingredients: mockRecipe.ingredients,
          instructions: mockRecipe.instructions,
        },
        modified_recipe: {
          title: "Vegan Lasagna",
          ingredients: "Plant-based meat\nPasta sheets\nVegan cheese\nTomato sauce",
          instructions: "1. Brown the plant-based meat\n2. Layer ingredients\n3. Bake at 350°F",
          explanation: "Replaced beef with plant-based meat and dairy cheese with vegan cheese",
        },
        ai_metadata: {
          model: "openai/gpt-4o-mini",
          provider: "openrouter",
          generation_duration: expect.any(Number),
          raw_response: mockChatResponse,
        },
        applied_preferences: {
          diet_type: "vegan",
          allergies: ["nuts"],
          disliked_ingredients: ["mushrooms"],
        },
      });
    });

    it("should fetch recipe and preferences in parallel", async () => {
      // Arrange
      const mockRecipe = createMockRecipe();
      const mockPreferences = createMockPreferences();
      const mockChatResponse = createMockChatResponse();

      const recipeQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      };

      const preferencesQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(recipeQueryBuilder as any)
        .mockReturnValueOnce(preferencesQueryBuilder as any);

      mockChat.mockResolvedValue(mockChatResponse);

      // Act
      await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert - both queries should be called (parallel execution)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(mockSupabase.from).toHaveBeenCalledWith("dietary_preferences");
    });

    it("should call OpenRouter with correct prompt structure", async () => {
      // Arrange
      const mockRecipe = createMockRecipe();
      const mockPreferences = createMockPreferences();
      const mockChatResponse = createMockChatResponse();

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
        } as any);

      mockChat.mockResolvedValue(mockChatResponse);

      // Act
      await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(mockChat).toHaveBeenCalledWith({
        messages: [
          {
            role: "system",
            content: expect.stringContaining("professional chef"),
          },
          {
            role: "user",
            content: expect.stringContaining("Classic Lasagna"),
          },
        ],
        responseFormat: {
          type: "json_object",
        },
        parameters: {
          temperature: 0.7,
          maxTokens: 4000,
        },
      });
    });

    it("should handle ingredients as array in AI response", async () => {
      // Arrange
      const mockRecipe = createMockRecipe();
      const mockPreferences = createMockPreferences();
      const mockChatResponse = createMockChatResponse({
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                title: "Vegan Lasagna",
                ingredients: ["Plant-based meat", "Pasta sheets", "Vegan cheese", "Tomato sauce"],
                instructions: ["Brown the plant-based meat", "Layer ingredients", "Bake at 350°F"],
                explanation: "Replaced animal products with plant-based alternatives",
              }),
              toolCalls: undefined,
            },
            finishReason: "stop",
          },
        ],
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
        } as any);

      mockChat.mockResolvedValue(mockChatResponse);

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert - arrays should be joined with newlines
      expect(result.modified_recipe.ingredients).toBe("Plant-based meat\nPasta sheets\nVegan cheese\nTomato sauce");
      expect(result.modified_recipe.instructions).toBe("Brown the plant-based meat\nLayer ingredients\nBake at 350°F");
    });
  });

  // ============================================================================
  // Error Handling Tests - Recipe Validation
  // ============================================================================

  describe("generateAIPreview - recipe validation errors", () => {
    it("should throw RECIPE_NOT_FOUND when recipe does not exist", async () => {
      // Arrange
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.RECIPE_NOT_FOUND
      );
    });

    it("should throw RECIPE_NOT_FOUND when recipe belongs to different user", async () => {
      // Arrange - RLS will return null for unauthorized access
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, "different-user")).rejects.toThrow(
        AI_PREVIEW_ERRORS.RECIPE_NOT_FOUND
      );
    });

    it("should throw DATABASE_ERROR for database failures", async () => {
      // Arrange
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "DATABASE_ERROR", message: "Database connection failed" },
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.DATABASE_ERROR
      );
    });
  });

  // ============================================================================
  // Error Handling Tests - Preferences Validation
  // ============================================================================

  describe("generateAIPreview - preferences validation errors", () => {
    it("should throw NO_PREFERENCES when preferences do not exist", async () => {
      // Arrange
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.NO_PREFERENCES
      );
    });

    it("should throw NO_PREFERENCES when all preference fields are null", async () => {
      // Arrange
      const emptyPreferences = createMockPreferences({
        diet_type: null,
        allergies: null,
        disliked_ingredients: null,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: emptyPreferences,
            error: null,
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.NO_PREFERENCES
      );
    });

    it("should throw NO_PREFERENCES when all arrays are empty", async () => {
      // Arrange
      const emptyPreferences = createMockPreferences({
        diet_type: null,
        allergies: [],
        disliked_ingredients: [],
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: emptyPreferences,
            error: null,
          }),
        } as any);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.NO_PREFERENCES
      );
    });

    it("should accept preferences with only diet_type set", async () => {
      // Arrange
      const preferences = createMockPreferences({
        diet_type: "vegan",
        allergies: null,
        disliked_ingredients: null,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: preferences,
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(createMockChatResponse());

      // Act & Assert - should not throw
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).resolves.toBeDefined();
    });

    it("should accept preferences with only allergies set", async () => {
      // Arrange
      const preferences = createMockPreferences({
        diet_type: null,
        allergies: ["peanuts"],
        disliked_ingredients: null,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: preferences,
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(createMockChatResponse());

      // Act & Assert - should not throw
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).resolves.toBeDefined();
    });

    it("should accept preferences with only disliked_ingredients set", async () => {
      // Arrange
      const preferences = createMockPreferences({
        diet_type: null,
        allergies: null,
        disliked_ingredients: ["cilantro"],
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: preferences,
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(createMockChatResponse());

      // Act & Assert - should not throw
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).resolves.toBeDefined();
    });
  });

  // ============================================================================
  // Error Handling Tests - AI Service Errors
  // ============================================================================

  describe("generateAIPreview - AI service errors", () => {
    beforeEach(() => {
      // Setup successful database queries for AI error tests
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);
    });

    it("should throw AI_SERVICE_ERROR on OpenRouter failure", async () => {
      // Arrange
      const openRouterError = new OpenRouterError("API rate limit exceeded", 429, "RATE_LIMIT");
      mockChat.mockRejectedValue(openRouterError);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.AI_SERVICE_ERROR
      );
    });

    it("should throw AI_SERVICE_ERROR on generic error", async () => {
      // Arrange
      mockChat.mockRejectedValue(new Error("Network timeout"));

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.AI_SERVICE_ERROR
      );
    });

    it("should throw error when AI response has no content", async () => {
      // Arrange
      const invalidResponse = createMockChatResponse({
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: null,
              toolCalls: undefined,
            },
            finishReason: "stop",
          },
        ],
      });
      mockChat.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.AI_SERVICE_ERROR
      );
    });

    it("should throw error when AI response is not valid JSON", async () => {
      // Arrange
      const invalidResponse = createMockChatResponse({
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "This is not JSON",
              toolCalls: undefined,
            },
            finishReason: "stop",
          },
        ],
      });
      mockChat.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.AI_SERVICE_ERROR
      );
    });

    it("should throw error when AI response is missing required fields", async () => {
      // Arrange
      const invalidResponse = createMockChatResponse({
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                title: "Vegan Lasagna",
                // Missing ingredients, instructions, and explanation
              }),
              toolCalls: undefined,
            },
            finishReason: "stop",
          },
        ],
      });
      mockChat.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(aiPreviewService.generateAIPreview(testRecipeId, testUserId)).rejects.toThrow(
        AI_PREVIEW_ERRORS.AI_SERVICE_ERROR
      );
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe("generateAIPreview - edge cases", () => {
    it("should handle very long recipe content", async () => {
      // Arrange
      const longIngredients = Array(100)
        .fill(0)
        .map((_, i) => `Ingredient ${i + 1}`)
        .join("\n");
      const longInstructions = Array(50)
        .fill(0)
        .map((_, i) => `Step ${i + 1}: Do something`)
        .join("\n");

      const longRecipe = createMockRecipe({
        ingredients: longIngredients,
        instructions: longInstructions,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: longRecipe,
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(createMockChatResponse());

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(longIngredients),
            }),
          ]),
        })
      );
    });

    it("should track generation duration in metadata", async () => {
      // Arrange
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      // Simulate slow AI response
      mockChat.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createMockChatResponse()), 100))
      );

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(result.ai_metadata.generation_duration).toBeGreaterThanOrEqual(100);
      expect(result.ai_metadata.generation_duration).toBeLessThan(1000);
    });

    it("should preserve raw AI response in metadata", async () => {
      // Arrange
      const mockChatResponse = createMockChatResponse();

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockRecipe(),
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(mockChatResponse);

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(result.ai_metadata.raw_response).toEqual(mockChatResponse);
    });

    it("should handle special characters in recipe content", async () => {
      // Arrange
      const specialRecipe = createMockRecipe({
        title: 'Mom\'s "Famous" Lasagna & Pasta',
        ingredients: "1/2 cup of this\n3/4 cup of that\n<ingredient>",
        instructions: "Step 1: Mix @ 350°F\nStep 2: Bake for 45' (minutes)",
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: specialRecipe,
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: createMockPreferences(),
            error: null,
          }),
        } as any);

      mockChat.mockResolvedValue(createMockChatResponse());

      // Act
      const result = await aiPreviewService.generateAIPreview(testRecipeId, testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result.original_recipe.title).toBe('Mom\'s "Famous" Lasagna & Pasta');
    });
  });
});
