import { RecipeCard } from "./RecipeCard";
import { RecipeCardSkeleton } from "./RecipeCardSkeleton";
import { RecipeListEmptyState } from "./RecipeListEmptyState";
import type { RecipeGridProps } from "@/types";
import { navigate } from "astro:transitions/client";

/**
 * Responsive grid container for recipe cards
 * Handles loading states, empty states, and recipe display
 */
export function RecipeGrid({ recipes, isLoading, currentView }: RecipeGridProps) {
  // Handle navigation to create recipe page
  const handleAddRecipe = () => {
    navigate("/recipes/new");
  };

  // Show loading skeletons
  if (isLoading && recipes.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 20 }).map((_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show empty state when no recipes
  if (!isLoading && recipes.length === 0) {
    return <RecipeListEmptyState view={currentView} onAddRecipe={handleAddRecipe} />;
  }

  // Show recipe cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} showAIBadge={currentView === "ai-modified"} />
      ))}
    </div>
  );
}
