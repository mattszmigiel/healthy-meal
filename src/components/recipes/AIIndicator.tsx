import { useState, useEffect } from "react";
import type { AIIndicatorProps, RecipeResponseDTO } from "@/types";
import { Badge } from "@/components/ui/badge";

/**
 * Robot/AI icon SVG component
 */
function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="10" x="3" y="11" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" x2="8" y1="16" y2="16" />
      <line x1="16" x2="16" y1="16" y2="16" />
    </svg>
  );
}

/**
 * AIIndicator component displays a badge and link for AI-generated recipes
 * Shows the relationship to the parent/original recipe
 */
export function AIIndicator({ parentRecipeId, parentRecipeTitle }: AIIndicatorProps) {
  const [title, setTitle] = useState<string | null>(parentRecipeTitle || null);
  const [loading, setLoading] = useState(!parentRecipeTitle);
  const [error, setError] = useState(false);

  // Fetch parent recipe title if not provided
  useEffect(() => {
    if (parentRecipeTitle || !parentRecipeId) {
      return;
    }

    const fetchParentTitle = async () => {
      try {
        const response = await fetch(`/api/recipes/${parentRecipeId}`);

        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const recipe: RecipeResponseDTO = await response.json();
        setTitle(recipe.title);
      } catch (err) {
        console.error("Error fetching parent recipe title:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchParentTitle();
  }, [parentRecipeId, parentRecipeTitle]);

  if (!parentRecipeId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1.5">
          <RobotIcon className="h-3.5 w-3.5" />
          <span>AI Modified</span>
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {loading ? (
          <span>Loading original recipe...</span>
        ) : error ? (
          <span>
            Adapted from:{" "}
            <a
              href={`/recipes/${parentRecipeId}`}
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Original Recipe
            </a>
          </span>
        ) : (
          <span>
            Adapted from:{" "}
            <a
              href={`/recipes/${parentRecipeId}`}
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              {title}
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
