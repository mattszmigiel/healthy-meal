import type { supabaseClient } from "@/db/supabase.client";
import type { Json } from "@/db/database.types";
import type {
  AIPreviewResponseDTO,
  RecipeEntity,
  DietaryPreferencesEntity,
  OriginalRecipePreview,
  ModifiedRecipePreview,
  AppliedDietaryPreferences,
  AIMetadataInput,
} from "@/types";
import { generateMockedAIPreview } from "./mocked-ai.service";
import { logger, getErrorStack } from "@/lib/utils/logger";

type SupabaseClient = typeof supabaseClient;

/**
 * Service error codes for AI Preview operations
 */
export const AI_PREVIEW_ERRORS = {
  RECIPE_NOT_FOUND: "RECIPE_NOT_FOUND",
  NO_PREFERENCES: "NO_PREFERENCES",
  DATABASE_ERROR: "DATABASE_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
} as const;

/**
 * Service for generating AI recipe previews
 */
export class AIPreviewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates an AI preview of a modified recipe based on user's dietary preferences
   *
   * @param recipeId - The ID of the recipe to modify
   * @param userId - The authenticated user's ID
   * @returns Preview with original recipe, modified recipe, AI metadata, and applied preferences
   * @throws Error with specific error codes for different failure scenarios
   */
  async generateAIPreview(recipeId: string, userId: string): Promise<AIPreviewResponseDTO> {
    // Fetch recipe and preferences in parallel for better performance
    const [recipe, preferences] = await Promise.all([
      this.fetchRecipeWithValidation(recipeId, userId),
      this.fetchAndValidatePreferences(userId),
    ]);

    // Validate recipe exists and user has access
    if (!recipe) {
      throw new Error(AI_PREVIEW_ERRORS.RECIPE_NOT_FOUND);
    }

    // Validate preferences exist and have at least one value
    if (!preferences || !this.hasValidPreferences(preferences)) {
      throw new Error(AI_PREVIEW_ERRORS.NO_PREFERENCES);
    }

    // Call mocked AI service to generate modified recipe
    let aiResponse;
    try {
      aiResponse = await generateMockedAIPreview(recipe, preferences);
    } catch (error) {
      logger.error("AI service call failed", {
        user_id: userId,
        recipe_id: recipeId,
        error_stack: getErrorStack(error),
      });
      throw new Error(AI_PREVIEW_ERRORS.AI_SERVICE_ERROR);
    }

    // Format and return response
    return this.formatPreviewResponse(
      recipe,
      aiResponse.modifiedRecipe,
      {
        ...aiResponse.metadata,
        raw_response: aiResponse.metadata.raw_response as unknown as Json,
      },
      preferences
    );
  }

  /**
   * Fetches a recipe and validates that it belongs to the user
   * Uses RLS for automatic ownership filtering
   *
   * @param recipeId - The recipe ID to fetch
   * @param userId - The user ID for ownership validation
   * @returns Recipe entity or null if not found/unauthorized
   * @throws Error if database operation fails
   */
  private async fetchRecipeWithValidation(recipeId: string, userId: string): Promise<RecipeEntity | null> {
    const { data, error } = await this.supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .eq("owner_id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows returned (not found or RLS filtered)
      if (error.code === "PGRST116") {
        return null;
      }
      // Re-throw other errors
      throw new Error(AI_PREVIEW_ERRORS.DATABASE_ERROR);
    }

    return data;
  }

  /**
   * Fetches dietary preferences for a user
   *
   * @param userId - The user ID
   * @returns Dietary preferences entity or null if not found
   * @throws Error if database operation fails
   */
  private async fetchAndValidatePreferences(userId: string): Promise<DietaryPreferencesEntity | null> {
    const { data, error } = await this.supabase.from("dietary_preferences").select("*").eq("user_id", userId).single();

    if (error) {
      // PGRST116 = no rows returned (not found)
      if (error.code === "PGRST116") {
        return null;
      }
      // Re-throw other errors
      throw new Error(AI_PREVIEW_ERRORS.DATABASE_ERROR);
    }

    return data;
  }

  /**
   * Checks if dietary preferences contain at least one non-null/non-empty value
   *
   * @param preferences - The dietary preferences to validate
   * @returns true if preferences are valid, false if all fields are null/empty
   */
  private hasValidPreferences(preferences: DietaryPreferencesEntity): boolean {
    // Check if diet_type is set
    if (preferences.diet_type !== null) {
      return true;
    }

    // Check if allergies array has items
    if (preferences.allergies !== null && preferences.allergies.length > 0) {
      return true;
    }

    // Check if disliked_ingredients array has items
    if (preferences.disliked_ingredients !== null && preferences.disliked_ingredients.length > 0) {
      return true;
    }

    // All preferences are null or empty
    return false;
  }

  /**
   * Formats the AI preview response into the expected DTO structure
   *
   * @param originalRecipe - The original recipe entity
   * @param modifiedRecipe - The AI-modified recipe
   * @param aiMetadata - The AI generation metadata
   * @param preferences - The user's dietary preferences
   * @returns Formatted AI preview response
   */
  private formatPreviewResponse(
    originalRecipe: RecipeEntity,
    modifiedRecipe: {
      title: string;
      ingredients: string;
      instructions: string;
      explanation: string;
    },
    aiMetadata: {
      model: string;
      provider: string;
      generation_duration: number;
      raw_response: Json;
    },
    preferences: DietaryPreferencesEntity
  ): AIPreviewResponseDTO {
    // Format original recipe
    const original: OriginalRecipePreview = {
      id: originalRecipe.id,
      title: originalRecipe.title,
      ingredients: originalRecipe.ingredients,
      instructions: originalRecipe.instructions,
    };

    // Format modified recipe
    const modified: ModifiedRecipePreview = {
      title: modifiedRecipe.title,
      ingredients: modifiedRecipe.ingredients,
      instructions: modifiedRecipe.instructions,
      explanation: modifiedRecipe.explanation,
    };

    // Format AI metadata
    const metadata: AIMetadataInput = {
      model: aiMetadata.model,
      provider: aiMetadata.provider,
      generation_duration: aiMetadata.generation_duration,
      raw_response: aiMetadata.raw_response,
    };

    // Format applied preferences
    const appliedPreferences: AppliedDietaryPreferences = {
      diet_type: preferences.diet_type,
      allergies: preferences.allergies,
      disliked_ingredients: preferences.disliked_ingredients,
    };

    return {
      original_recipe: original,
      modified_recipe: modified,
      ai_metadata: metadata,
      applied_preferences: appliedPreferences,
    };
  }
}
