import { useState } from "react";
import { navigate } from "astro:transitions/client";
import type { RecipeDetailViewProps } from "@/types";
import { useRecipeDetail } from "@/components/hooks/useRecipeDetail";
import { useDeleteRecipe } from "@/components/hooks/useDeleteRecipe";
import { RecipeContent } from "./RecipeContent";
import { RecipeActionBar } from "./RecipeActionBar";
import { AIVariantsList } from "./AIVariantsList";
import { CompareView } from "./CompareView";
import { AIPreviewDialog } from "./AIPreviewDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Alert Triangle icon SVG component
 */
function AlertTriangleIcon({ className }: { className?: string }) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * RecipeDetailView component - Main container for recipe detail page
 * Orchestrates all child components and manages state
 */
export function RecipeDetailView({ initialRecipe, recipeId }: RecipeDetailViewProps) {
  // Data fetching
  const { data: viewModel, loading, error, refresh } = useRecipeDetail(recipeId);

  // Delete management
  const {
    dialogState: deleteDialogState,
    openDialog: openDeleteDialog,
    closeDialog: closeDeleteDialog,
    confirmDelete,
  } = useDeleteRecipe(recipeId);

  // AI Preview dialog state
  const [aiPreviewDialogOpen, setAiPreviewDialogOpen] = useState(false);

  // Use initial recipe until viewModel is loaded
  const recipe = viewModel?.recipe || initialRecipe;
  const variants = viewModel?.variants || [];

  // Handlers
  const handleModifyWithAI = () => {
    setAiPreviewDialogOpen(true);
  };

  const handleEdit = () => {
    navigate(`/recipes/${recipeId}/edit`);
  };

  const handleDelete = () => {
    openDeleteDialog();
  };

  const handleAIPreviewClose = () => {
    setAiPreviewDialogOpen(false);
  };

  const handleAIPreviewSaved = async () => {
    // Refresh data to show new variant
    await refresh();
  };

  // Loading skeleton
  if (loading && !initialRecipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !initialRecipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Recipe</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error.message}</p>
            {error.message.includes("not found") ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/recipes")}>
                Go to Recipes
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                Try Again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground" data-testid="recipe-breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <a
                href="/recipes"
                className="hover:text-foreground transition-colors"
                data-testid="breadcrumb-recipes-link"
              >
                Recipes
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium truncate">
              {recipe.title}
            </li>
          </ol>
        </nav>

        {/* Action Bar */}
        <RecipeActionBar
          isAiGenerated={recipe.is_ai_generated}
          onModifyWithAI={handleModifyWithAI}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Recipe Content */}
        <RecipeContent recipe={recipe} />

        {/* AI Variants List - Only for original recipes with variants */}
        {!recipe.is_ai_generated && variants.length > 0 && <AIVariantsList variants={variants} />}

        {/* Compare View - Only for AI-generated recipes */}
        {recipe.is_ai_generated && recipe.parent_recipe_id && (
          <CompareView parentRecipeId={recipe.parent_recipe_id} modified={recipe} />
        )}
      </div>

      {/* AI Preview Dialog */}
      <AIPreviewDialog
        isOpen={aiPreviewDialogOpen}
        recipeId={recipeId}
        onClose={handleAIPreviewClose}
        onSaved={handleAIPreviewSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogState.isOpen}
        isDeleting={deleteDialogState.isDeleting}
        error={deleteDialogState.error}
        recipeTitle={recipe.title}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
