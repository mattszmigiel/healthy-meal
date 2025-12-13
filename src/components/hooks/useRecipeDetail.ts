import { useState, useEffect, useCallback } from "react";
import type { RecipeDetailViewModel, RecipeResponseDTO, RecipeListResponseDTO, APIErrorResponse } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseRecipeDetailReturn {
  data: RecipeDetailViewModel | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch AI-modified variants for a recipe
 * Returns empty array if recipe is AI-generated or fetch fails
 */
const fetchVariants = async (recipeId: string, isAiGenerated: boolean): Promise<RecipeResponseDTO[]> => {
  if (isAiGenerated) {
    return [];
  }

  try {
    const response = await fetch(`/api/recipes?parent_recipe_id=${recipeId}`);
    if (!response.ok) {
      return [];
    }

    const variantsData: RecipeListResponseDTO = await response.json();
    return variantsData.data;
  } catch (err) {
    console.error("Error fetching variants:", err);
    return [];
  }
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for fetching and managing recipe detail data
 * Fetches main recipe and its AI-modified variants in parallel
 */
export function useRecipeDetail(recipeId: string): UseRecipeDetailReturn {
  const [data, setData] = useState<RecipeDetailViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipeDetail = useCallback(async () => {
    if (!recipeId) {
      setError(new Error("Recipe ID is required"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch main recipe
      const recipeResponse = await fetch(`/api/recipes/${recipeId}`);

      // Handle recipe fetch errors
      if (!recipeResponse.ok) {
        if (recipeResponse.status === 404) {
          throw new Error("Recipe not found or you don't have access to it");
        }

        const errorData: APIErrorResponse = await recipeResponse.json();
        throw new Error(errorData.message || "Failed to fetch recipe");
      }

      // Parse recipe data
      const recipe: RecipeResponseDTO = await recipeResponse.json();

      // Fetch variants (only if recipe is not AI-generated)
      const variants = await fetchVariants(recipeId, recipe.is_ai_generated);

      // Set data
      setData({
        recipe,
        variants,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Error fetching recipe detail:", {
        recipeId,
        error: err,
        timestamp: new Date().toISOString(),
      });
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  // Fetch data on mount and when recipeId changes
  useEffect(() => {
    fetchRecipeDetail();
  }, [fetchRecipeDetail]);

  // Provide refresh function to re-fetch data after mutations
  const refresh = useCallback(async () => {
    await fetchRecipeDetail();
  }, [fetchRecipeDetail]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
