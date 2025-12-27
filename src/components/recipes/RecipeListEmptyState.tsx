import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types";

/**
 * Empty state component for recipe list
 * Displays contextual messaging and CTA based on current view
 */
export function RecipeListEmptyState({ view, onAddRecipe }: EmptyStateProps) {
  const isMyRecipes = view === "my-recipes";

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="recipe-list-empty-state"
    >
      <div className="max-w-md space-y-4">
        {/* Icon placeholder - could add an illustration here */}
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold" data-testid="empty-state-heading">
          {isMyRecipes ? "No recipes yet" : "No AI-modified recipes yet"}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground" data-testid="empty-state-description">
          {isMyRecipes
            ? "Get started by adding your first recipe. You can create your own recipes and then use AI to modify them based on your dietary preferences."
            : "AI-modified recipes are created from your original recipes. Start by adding a recipe, then use the AI modification feature to create personalized variants."}
        </p>

        {/* CTA Button - only for My Recipes view */}
        {isMyRecipes && (
          <Button onClick={onAddRecipe} size="lg" className="mt-6" data-testid="add-first-recipe-button">
            Add Your First Recipe
          </Button>
        )}

        {/* Tip for My Recipes view */}
        {isMyRecipes && (
          <p className="text-sm text-muted-foreground mt-4">
            Tip: Set your dietary preferences in your profile to get better AI modifications
          </p>
        )}
      </div>
    </div>
  );
}
