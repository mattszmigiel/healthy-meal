/**
 * Type Definitions for HealthyMeal Application
 *
 * This file contains all DTOs (Data Transfer Objects) and Command Models
 * used throughout the application for API communication and data transfer.
 * All types are derived from the database schema in src/db/database.types.ts
 */

import type { Database } from "@/db/database.types";

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================
// These types represent the actual database table structures and are derived
// directly from the generated Supabase types

/**
 * Profile entity - Represents a user profile (one-to-one with auth.users)
 */
export type ProfileEntity = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Dietary Preferences entity - Represents user dietary restrictions and preferences
 */
export type DietaryPreferencesEntity = Database["public"]["Tables"]["dietary_preferences"]["Row"];

/**
 * Recipe entity - Represents a user-created or AI-modified recipe
 */
export type RecipeEntity = Database["public"]["Tables"]["recipes"]["Row"];

/**
 * Recipe AI Metadata entity - Metadata about AI-generated recipes
 */
export type RecipeAIMetadataEntity = Database["public"]["Tables"]["recipe_ai_metadata"]["Row"];

/**
 * Diet Type enum - All possible diet types
 */
export type DietType = Database["public"]["Enums"]["diet_type"];

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Profile DTO - Response for GET /api/profile
 * Direct mapping from ProfileEntity
 */
export type ProfileDTO = ProfileEntity;

// ============================================================================
// DIETARY PREFERENCES DTOs
// ============================================================================

/**
 * Dietary Preferences DTO - Response for GET /api/profile/dietary-preferences
 * Direct mapping from DietaryPreferencesEntity
 */
export type DietaryPreferencesDTO = DietaryPreferencesEntity;

/**
 * Update Dietary Preferences Command - Request for PUT /api/profile/dietary-preferences
 * Allows updating any combination of dietary preference fields
 */
export type UpdateDietaryPreferencesCommand = Pick<
  DietaryPreferencesEntity,
  "diet_type" | "allergies" | "disliked_ingredients"
>;

// ============================================================================
// RECIPE DTOs
// ============================================================================

/**
 * Recipe with AI Metadata DTO - Recipe with optional AI metadata joined
 * Used in recipe list and single recipe responses when AI metadata exists
 */
export type RecipeWithAIMetadataDTO = RecipeEntity & {
  ai_metadata: RecipeAIMetadataEntity | null;
};

/**
 * Recipe List Response DTO - Response for GET /api/recipes
 * Includes pagination metadata
 */
export type RecipeListResponseDTO = {
  data: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

/**
 * Single Recipe Response DTO - Response for GET /api/recipes/:id
 * Same structure as RecipeWithAIMetadataDTO but as explicit type for clarity
 */
export type RecipeResponseDTO = RecipeWithAIMetadataDTO;

/**
 * AI Metadata Input - Input structure for AI metadata when creating recipes
 * Excludes auto-generated fields (recipe_id, owner_id, created_at)
 */
export type AIMetadataInput = Pick<
  RecipeAIMetadataEntity,
  "model" | "provider" | "generation_duration" | "raw_response"
>;

/**
 * Create Recipe Command - Request for POST /api/recipes
 * Excludes auto-generated fields (id, owner_id, created_at, updated_at)
 */
export type CreateRecipeCommand = Pick<
  RecipeEntity,
  "title" | "ingredients" | "instructions" | "is_ai_generated" | "parent_recipe_id"
> & {
  ai_metadata?: AIMetadataInput | null;
};

/**
 * Update Recipe Command - Request for PUT /api/recipes/:id
 * Only allows updating content fields, includes updated_at for optimistic locking
 */
export type UpdateRecipeCommand = Pick<
  RecipeEntity,
  "title" | "ingredients" | "instructions" | "updated_at"
>;

// ============================================================================
// AI RECIPE MODIFICATION DTOs
// ============================================================================

/**
 * Original Recipe Preview - Simplified recipe info for AI preview response
 */
export type OriginalRecipePreview = Pick<
  RecipeEntity,
  "id" | "title" | "ingredients" | "instructions"
>;

/**
 * Modified Recipe Preview - AI-modified recipe with explanation
 * Not saved to database until user confirms
 */
export type ModifiedRecipePreview = {
  title: string;
  ingredients: string;
  instructions: string;
  explanation: string;
};

/**
 * Applied Dietary Preferences - Shows which preferences were applied to modification
 */
export type AppliedDietaryPreferences = Pick<
  DietaryPreferencesEntity,
  "diet_type" | "allergies" | "disliked_ingredients"
>;

/**
 * AI Preview Response DTO - Response for POST /api/recipes/:id/ai-preview
 * Provides preview of AI-modified recipe without saving
 */
export type AIPreviewResponseDTO = {
  original_recipe: OriginalRecipePreview;
  modified_recipe: ModifiedRecipePreview;
  ai_metadata: AIMetadataInput;
  applied_preferences: AppliedDietaryPreferences;
};

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Recipe List Query Parameters - Query params for GET /api/recipes
 */
export type RecipeListQueryParams = {
  page?: number;
  limit?: number;
  is_ai_generated?: boolean;
  parent_recipe_id?: string;
};

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Standard API Error Response
 * Consistent error structure across all endpoints
 */
export type APIErrorResponse = {
  error: string;
  message: string;
  details?: string[];
};

/**
 * Conflict Error Response - Specific for optimistic locking failures
 * Used in PUT /api/recipes/:id when updated_at doesn't match
 */
export type ConflictErrorResponse = {
  error: "Conflict";
  message: string;
  current_version: {
    updated_at: string;
  };
};

/**
 * Rate Limit Error Response - Specific for rate limit exceeded
 * Used in POST /api/recipes/:id/ai-preview
 */
export type RateLimitErrorResponse = {
  error: "Rate limit exceeded";
  message: string;
  retry_after: number;
};

/**
 * No Preferences Error Response - Specific for missing dietary preferences
 * Used in POST /api/recipes/:id/ai-preview
 */
export type NoPreferencesErrorResponse = {
  error: "No dietary preferences";
  message: string;
  action: string;
};
