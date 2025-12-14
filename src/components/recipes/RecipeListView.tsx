import { useRecipeList } from "@/components/hooks/useRecipeList";
import { OnboardingBanner } from "./OnboardingBanner";
import { ViewToggle } from "./ViewToggle";
import { RecipeGrid } from "./RecipeGrid";
import { PaginationControls } from "./PaginationControls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { RecipeListViewProps } from "@/types";
import { navigate } from "astro:transitions/client";

/**
 * Main recipe list view component
 * Orchestrates all child components and manages recipe list state
 */
export function RecipeListView({ initialRecipes, hasPreferences }: RecipeListViewProps) {
  const { recipes, pagination, currentView, isLoading, error, switchView, loadMore, clearError } = useRecipeList(
    initialRecipes,
    hasPreferences
  );

  // Handle navigation to profile page
  const handleNavigateToProfile = () => {
    navigate("/profile");
  };

  // Handle banner dismissal (no-op for now, state managed internally)
  const handleBannerDismiss = () => {
    // Banner handles its own dismissal internally
  };

  // Handle retry after error
  const handleRetry = () => {
    clearError();
    // Trigger re-fetch by switching to current view
    switchView(currentView);
  };

  // Handle add recipe navigation
  const handleAddRecipe = () => {
    navigate("/recipes/new");
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Screen reader title */}
      <h1 className="sr-only">My Recipes</h1>

      {/* Onboarding Banner - only show if user has no dietary preferences */}
      {!hasPreferences && (
        <div className="mb-6">
          <OnboardingBanner onNavigateToProfile={handleNavigateToProfile} onDismiss={handleBannerDismiss} />
        </div>
      )}

      {/* Header with View Toggle and Add Recipe button */}
      <div className="flex items-center justify-between mb-6">
        <ViewToggle currentView={currentView} onChange={switchView} />
        <Button onClick={handleAddRecipe}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Recipe
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <AlertDescription className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{error.type === "network" ? "Connection Error" : "Error"}</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Recipe Grid */}
      <RecipeGrid recipes={recipes} isLoading={isLoading} currentView={currentView} />

      {/* Pagination Controls - only show if we have recipes */}
      {recipes.length > 0 && <PaginationControls pagination={pagination} isLoading={isLoading} onLoadMore={loadMore} />}
    </main>
  );
}
