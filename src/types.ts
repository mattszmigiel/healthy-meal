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
export interface RecipeListResponseDTO {
  data: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

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
export type UpdateRecipeCommand = Pick<RecipeEntity, "title" | "ingredients" | "instructions" | "updated_at">;

// ============================================================================
// AI RECIPE MODIFICATION DTOs
// ============================================================================

/**
 * Original Recipe Preview - Simplified recipe info for AI preview response
 */
export type OriginalRecipePreview = Pick<RecipeEntity, "id" | "title" | "ingredients" | "instructions">;

/**
 * Modified Recipe Preview - AI-modified recipe with explanation
 * Not saved to database until user confirms
 */
export interface ModifiedRecipePreview {
  title: string;
  ingredients: string;
  instructions: string;
  explanation: string;
}

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
export interface AIPreviewResponseDTO {
  original_recipe: OriginalRecipePreview;
  modified_recipe: ModifiedRecipePreview;
  ai_metadata: AIMetadataInput;
  applied_preferences: AppliedDietaryPreferences;
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Recipe List Query Parameters - Query params for GET /api/recipes
 */
export interface RecipeListQueryParams {
  page?: number;
  limit?: number;
  is_ai_generated?: boolean;
  parent_recipe_id?: string;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Standard API Error Response
 * Consistent error structure across all endpoints
 */
export interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}

/**
 * Conflict Error Response - Specific for optimistic locking failures
 * Used in PUT /api/recipes/:id when updated_at doesn't match
 */
export interface ConflictErrorResponse {
  error: "Conflict";
  message: string;
  current_version: {
    updated_at: string;
  };
}

/**
 * Rate Limit Error Response - Specific for rate limit exceeded
 * Used in POST /api/recipes/:id/ai-preview
 */
export interface RateLimitErrorResponse {
  error: "Rate limit exceeded";
  message: string;
  retry_after: number;
}

/**
 * No Preferences Error Response - Specific for missing dietary preferences
 * Used in POST /api/recipes/:id/ai-preview
 */
export interface NoPreferencesErrorResponse {
  error: "No dietary preferences";
  message: string;
  action: string;
}

// ============================================================================
// RECIPE DETAIL VIEW TYPES
// ============================================================================

/**
 * View model aggregating all data needed for recipe detail view
 */
export interface RecipeDetailViewModel {
  recipe: RecipeResponseDTO;
  variants: RecipeResponseDTO[]; // AI-modified versions (empty if current is AI recipe or no ai-modified versions)
}

/**
 * State for AI preview generation with discriminated union
 */
export type AIPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AIPreviewResponseDTO }
  | { status: "error"; error: AIPreviewError };

/**
 * Detailed error types for AI preview
 */
export type AIPreviewError =
  | { type: "no_preferences" }
  | { type: "rate_limit"; retryAfter: number }
  | { type: "not_found" }
  | { type: "service_unavailable" }
  | { type: "unknown"; message: string };

/**
 * State for delete confirmation dialog
 */
export interface DeleteDialogState {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Command for saving AI-modified recipe
 */
export interface SaveAIRecipeCommand {
  title: string;
  ingredients: string;
  instructions: string;
  is_ai_generated: true;
  parent_recipe_id: string;
  ai_metadata: AIMetadataInput;
}

/**
 * Props for RecipeActionBar component
 */
export interface RecipeActionBarProps {
  isAiGenerated: boolean;
  onModifyWithAI: () => void;
  onDelete: () => void;
}

/**
 * Props for AIIndicator component
 */
export interface AIIndicatorProps {
  parentRecipeId: string;
  parentRecipeTitle?: string;
}

/**
 * Props for AIVariantsList component
 */
export interface AIVariantsListProps {
  variants: RecipeResponseDTO[];
}

/**
 * Props for VariantCard component
 */
export interface VariantCardProps {
  variant: RecipeResponseDTO;
}

/**
 * Props for CompareView component
 */
export interface CompareViewProps {
  parentRecipeId: string;
  modified: RecipeEntity;
}

/**
 * Props for AIPreviewDialog component
 */
export interface AIPreviewDialogProps {
  isOpen: boolean;
  recipeId: string;
  onClose: () => void;
  onSaved: (newRecipeId: string) => void;
}

/**
 * Props for NoPreferencesAlert component
 */
export interface NoPreferencesAlertProps {
  onNavigateToProfile: () => void;
}

/**
 * Props for DeleteConfirmDialog component
 */
export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Props for RecipeContent component
 */
export interface RecipeContentProps {
  recipe: RecipeResponseDTO;
}

/**
 * Props for RecipeDetailView component
 */
export interface RecipeDetailViewProps {
  initialRecipe: RecipeResponseDTO;
  recipeId: string;
}

// ============================================================================
// RECIPE LIST VIEW TYPES
// ============================================================================

/**
 * View type for recipe list - determines which recipes to show
 */
export type ViewType = "my-recipes" | "ai-modified";

/**
 * Error types for recipe list operations
 */
export type RecipeListError =
  | { type: "network"; message: string }
  | { type: "session_timeout"; message: string }
  | { type: "server_error"; message: string }
  | { type: "unknown"; message: string };

/**
 * View model for Recipe List view state
 */
export interface RecipeListViewModel {
  recipes: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  currentView: ViewType;
  isLoading: boolean;
  error: RecipeListError | null;
  hasPreferences: boolean;
}

/**
 * Props for RecipeListView component
 */
export interface RecipeListViewProps {
  initialRecipes: RecipeListResponseDTO;
  hasPreferences: boolean;
}

/**
 * Props for GlobalNavigation component
 */
export interface GlobalNavigationProps {
  userEmail?: string;
  currentPath: string;
}

/**
 * Props for DesktopNavigation component
 */
export interface DesktopNavigationProps {
  userEmail?: string;
  currentPath: string;
}

/**
 * Props for MobileNavigation component
 */
export interface MobileNavigationProps {
  userEmail?: string;
  currentPath: string;
}

/**
 * Props for UserMenu component (desktop dropdown)
 */
export interface UserMenuProps {
  userEmail?: string;
  onLogout: () => void;
}

/**
 * Props for MobileMenu component (slide-out panel)
 */
export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentPath: string;
  onLogout: () => void;
}

/**
 * Props for NavLinks component
 */
export interface NavLinksProps {
  currentPath: string;
  orientation?: "horizontal" | "vertical";
  onLinkClick?: () => void;
}

/**
 * State for mobile menu
 */
export interface MobileMenuState {
  isOpen: boolean;
}

/**
 * Props for ViewToggle component
 */
export interface ViewToggleProps {
  currentView: ViewType;
  onChange: (view: ViewType) => void;
}

/**
 * Props for RecipeGrid component
 */
export interface RecipeGridProps {
  recipes: RecipeWithAIMetadataDTO[];
  isLoading: boolean;
  currentView: ViewType;
}

/**
 * Props for RecipeCard component
 */
export interface RecipeCardProps {
  recipe: RecipeWithAIMetadataDTO;
  showAIBadge: boolean;
}

/**
 * Props for PaginationControls component
 */
export interface PaginationControlsProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  view: ViewType;
  onAddRecipe: () => void;
}

/**
 * Props for OnboardingBanner component
 */
export interface OnboardingBannerProps {
  onNavigateToProfile: () => void;
  onDismiss: () => void;
}

// ============================================================================
// PROFILE VIEW TYPES
// ============================================================================

/**
 * Props for ProfileView component
 * Contains initial data fetched server-side
 */
export interface ProfileViewProps {
  initialPreferences: DietaryPreferencesDTO | null;
  userEmail: string;
}

/**
 * Props for AccountSection component
 */
export interface AccountSectionProps {
  userEmail: string;
}

/**
 * Props for DietaryPreferencesSection component
 */
export interface DietaryPreferencesSectionProps {
  preferences: DietaryPreferencesDTO | null;
  onPreferencesUpdated: (preferences: DietaryPreferencesDTO) => void;
}

/**
 * Props for DietTypeSelect component
 */
export interface DietTypeSelectProps {
  value: DietType | null;
  onChange: (value: DietType | null) => void;
  disabled?: boolean;
  id: string;
}

/**
 * Props for TagInput component
 */
export interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id: string;
  ariaDescribedBy?: string;
}

/**
 * Form state for dietary preferences editing
 */
export interface DietaryPreferencesFormState {
  diet_type: DietType | null;
  allergies: string[];
  disliked_ingredients: string[];
}

/**
 * Return type for useDietaryPreferences hook
 */
export interface UseDietaryPreferencesReturn {
  preferences: DietaryPreferencesDTO | null;
  formState: DietaryPreferencesFormState;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  updateFormField: (field: keyof DietaryPreferencesFormState, value: unknown) => void;
  savePreferences: () => Promise<void>;
  resetError: () => void;
}

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Login Request DTO - Request payload for POST /api/auth/login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Auth Response DTO - Response for successful authentication
 * Used for login endpoint responses
 */
export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
  };
  message: string;
}
