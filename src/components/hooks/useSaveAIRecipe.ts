import { useState, useCallback } from "react";
import type { SaveAIRecipeCommand, RecipeResponseDTO, APIErrorResponse } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseSaveAIRecipeReturn {
  saving: boolean;
  error: string | null;
  save: (command: SaveAIRecipeCommand) => Promise<string>;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for saving AI-modified recipe as new recipe entry
 * Returns the new recipe ID on success for navigation
 */
export function useSaveAIRecipe(): UseSaveAIRecipeReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (command: SaveAIRecipeCommand): Promise<string> => {
    // Set saving state
    setSaving(true);
    setError(null);

    try {
      // Call POST endpoint
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      // Handle success
      if (response.ok) {
        const recipe: RecipeResponseDTO = await response.json();

        // Clear saving state (success)
        setSaving(false);

        // Return new recipe ID for navigation
        return recipe.id;
      }

      // Handle errors
      const errorData: APIErrorResponse = await response.json();
      const errorMessage = errorData.message || "Failed to save recipe";

      console.error("Error saving AI recipe:", {
        status: response.status,
        error: errorData,
        timestamp: new Date().toISOString(),
      });

      // Set error state
      setSaving(false);
      setError(errorMessage);

      // Throw error so caller can handle it
      throw new Error(errorMessage);
    } catch (err) {
      // Handle network errors
      console.error("Error saving AI recipe:", {
        error: err,
        timestamp: new Date().toISOString(),
      });

      const errorMessage = err instanceof Error ? err.message : "Network error. Please check your connection.";

      // Set error state
      setSaving(false);
      setError(errorMessage);

      // Re-throw error
      throw new Error(errorMessage);
    }
  }, []);

  return {
    saving,
    error,
    save,
  };
}
