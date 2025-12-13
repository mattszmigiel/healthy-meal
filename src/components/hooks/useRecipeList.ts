import { useState, useEffect, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import type {
  RecipeListResponseDTO,
  RecipeWithAIMetadataDTO,
  RecipeListError,
  ViewType,
  APIErrorResponse,
} from "@/types";

interface UseRecipeListReturn {
  recipes: RecipeWithAIMetadataDTO[];
  pagination: RecipeListResponseDTO["pagination"];
  currentView: ViewType;
  isLoading: boolean;
  error: RecipeListError | null;
  hasPreferences: boolean;
  switchView: (view: ViewType) => void;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing recipe list state and interactions
 * Handles data fetching, pagination, view switching, and error states
 */
export function useRecipeList(
  initialRecipes: RecipeListResponseDTO,
  initialHasPreferences: boolean
): UseRecipeListReturn {
  const [recipes, setRecipes] = useState<RecipeWithAIMetadataDTO[]>(initialRecipes.data);
  const [pagination, setPagination] = useState(initialRecipes.pagination);
  const [currentView, setCurrentView] = useState<ViewType>("my-recipes");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RecipeListError | null>(null);
  const [hasPreferences] = useState(initialHasPreferences);

  // Initialize view from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "ai-modified" || viewParam === "my-recipes") {
      setCurrentView(viewParam);
    }
  }, []);

  // Update URL when view changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", currentView);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [currentView]);

  /**
   * Categorizes fetch errors into specific error types
   */
  const categorizeError = useCallback(async (response: Response): Promise<RecipeListError> => {
    if (response.status === 401) {
      return { type: "session_timeout", message: "Your session has expired" };
    }

    if (response.status === 500) {
      try {
        const errorData: APIErrorResponse = await response.json();
        return { type: "server_error", message: errorData.message };
      } catch {
        return { type: "server_error", message: "Something went wrong on our end" };
      }
    }

    return { type: "unknown", message: "An error occurred. Please try again." };
  }, []);

  /**
   * Fetches recipes with current filters
   */
  const fetchRecipes = useCallback(
    async (view: ViewType, page: number): Promise<RecipeListResponseDTO | null> => {
      const isAiGenerated = view === "ai-modified";
      const url = `/api/recipes?page=${page}&limit=20&is_ai_generated=${isAiGenerated}`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            // Session timeout - redirect to login
            navigate("/login?returnUrl=/recipes");
            return null;
          }

          const errorResponse = await categorizeError(response);
          setError(errorResponse);
          return null;
        }

        const data: RecipeListResponseDTO = await response.json();
        return data;
      } catch {
        setError({
          type: "network",
          message: "Unable to connect. Please check your internet connection.",
        });
        return null;
      }
    },
    [categorizeError]
  );

  /**
   * Switches between my-recipes and ai-modified views
   */
  const switchView = useCallback(
    async (view: ViewType) => {
      if (view === currentView) return;

      setCurrentView(view);
      setIsLoading(true);
      setError(null);

      const data = await fetchRecipes(view, 1);

      if (data) {
        setRecipes(data.data);
        setPagination(data.pagination);
      }

      setIsLoading(false);
    },
    [currentView, fetchRecipes]
  );

  /**
   * Loads next page of recipes and appends to current list
   */
  const loadMore = useCallback(async () => {
    if (pagination.page >= pagination.total_pages || isLoading) return;

    setIsLoading(true);
    setError(null);

    const nextPage = pagination.page + 1;
    const data = await fetchRecipes(currentView, nextPage);

    if (data) {
      setRecipes((prev) => [...prev, ...data.data]);
      setPagination(data.pagination);
    }

    setIsLoading(false);
  }, [pagination, isLoading, currentView, fetchRecipes]);

  /**
   * Clears current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    recipes,
    pagination,
    currentView,
    isLoading,
    error,
    hasPreferences,
    switchView,
    loadMore,
    clearError,
  };
}
