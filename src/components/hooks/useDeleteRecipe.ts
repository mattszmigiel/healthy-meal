import { useState, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import type { DeleteDialogState, APIErrorResponse } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseDeleteRecipeReturn {
  dialogState: DeleteDialogState;
  openDialog: () => void;
  closeDialog: () => void;
  confirmDelete: () => Promise<void>;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for deleting a recipe with confirmation dialog state management
 * Handles the full delete flow including navigation on success
 */
export function useDeleteRecipe(recipeId: string): UseDeleteRecipeReturn {
  const [dialogState, setDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    isDeleting: false,
    error: null,
  });

  const openDialog = useCallback(() => {
    setDialogState({
      isOpen: true,
      isDeleting: false,
      error: null,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      isDeleting: false,
      error: null,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!recipeId) {
      setDialogState((prev) => ({
        ...prev,
        error: "Recipe ID is required",
      }));
      return;
    }

    // Set deleting state
    setDialogState((prev) => ({
      ...prev,
      isDeleting: true,
      error: null,
    }));

    try {
      // Call DELETE endpoint
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      // Handle success
      if (response.ok) {
        // Close dialog
        setDialogState({
          isOpen: false,
          isDeleting: false,
          error: null,
        });

        // Navigate to recipes list
        navigate("/recipes");
        return;
      }

      // Handle errors
      const errorData: APIErrorResponse = await response.json();
      const errorMessage = errorData.message || "Failed to delete recipe";

      console.error("Error deleting recipe:", {
        recipeId,
        status: response.status,
        error: errorData,
        timestamp: new Date().toISOString(),
      });

      setDialogState((prev) => ({
        ...prev,
        isDeleting: false,
        error: errorMessage,
      }));
    } catch (err) {
      // Handle network errors
      console.error("Error deleting recipe:", {
        recipeId,
        error: err,
        timestamp: new Date().toISOString(),
      });

      const errorMessage = err instanceof Error ? err.message : "Network error. Please check your connection.";

      setDialogState((prev) => ({
        ...prev,
        isDeleting: false,
        error: errorMessage,
      }));
    }
  }, [recipeId]);

  return {
    dialogState,
    openDialog,
    closeDialog,
    confirmDelete,
  };
}
