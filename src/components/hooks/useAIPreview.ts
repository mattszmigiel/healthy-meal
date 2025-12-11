import { useState, useCallback } from "react";
import type {
  AIPreviewState,
  AIPreviewResponseDTO,
  NoPreferencesErrorResponse,
  RateLimitErrorResponse,
  APIErrorResponse,
} from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseAIPreviewReturn {
  state: AIPreviewState;
  generate: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse error response and create appropriate AIPreviewError
 */
const parseErrorResponse = async (response: Response): Promise<AIPreviewState> => {
  try {
    // Handle 400 - No dietary preferences
    if (response.status === 400) {
      const errorData = await response.json();
      const noPrefsError = errorData as NoPreferencesErrorResponse;

      if (noPrefsError.error === "No dietary preferences") {
        return {
          status: "error",
          error: { type: "no_preferences" },
        };
      }

      // Other 400 errors
      return {
        status: "error",
        error: {
          type: "unknown",
          message: errorData.message || "Bad request",
        },
      };
    }

    // Handle 404 - Recipe not found
    if (response.status === 404) {
      return {
        status: "error",
        error: { type: "not_found" },
      };
    }

    // Handle 429 - Rate limit exceeded
    if (response.status === 429) {
      const errorData = await response.json();
      const rateLimitError = errorData as RateLimitErrorResponse;

      return {
        status: "error",
        error: {
          type: "rate_limit",
          retryAfter: rateLimitError.retry_after || 60,
        },
      };
    }

    // Handle 503 - AI service unavailable
    if (response.status === 503) {
      return {
        status: "error",
        error: { type: "service_unavailable" },
      };
    }

    // Handle 504 - Request timeout (treated as service unavailable)
    if (response.status === 504) {
      return {
        status: "error",
        error: { type: "service_unavailable" },
      };
    }

    // Handle other errors
    const errorData = await response.json();
    const apiError = errorData as APIErrorResponse;

    return {
      status: "error",
      error: {
        type: "unknown",
        message: apiError.message || "An unexpected error occurred",
      },
    };
  } catch {
    // Failed to parse error response
    return {
      status: "error",
      error: {
        type: "unknown",
        message: `Server error (${response.status})`,
      },
    };
  }
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for generating AI recipe preview
 * Manages state machine for preview generation with comprehensive error handling
 */
export function useAIPreview(recipeId: string): UseAIPreviewReturn {
  const [state, setState] = useState<AIPreviewState>({ status: "idle" });

  const generate = useCallback(async () => {
    if (!recipeId) {
      setState({
        status: "error",
        error: {
          type: "unknown",
          message: "Recipe ID is required",
        },
      });
      return;
    }

    // Set loading state
    setState({ status: "loading" });

    try {
      // Call AI preview endpoint
      const response = await fetch(`/api/recipes/${recipeId}/ai-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle success
      if (response.ok) {
        const data: AIPreviewResponseDTO = await response.json();
        setState({
          status: "success",
          data,
        });
        return;
      }

      // Handle errors
      const errorState = await parseErrorResponse(response);
      setState(errorState);
    } catch (err) {
      // Handle network errors
      console.error("Error generating AI preview:", {
        recipeId,
        error: err,
        timestamp: new Date().toISOString(),
      });

      setState({
        status: "error",
        error: {
          type: "unknown",
          message: err instanceof Error ? err.message : "Network error. Please check your connection.",
        },
      });
    }
  }, [recipeId]);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    state,
    generate,
    reset,
  };
}
