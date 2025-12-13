import type { RecipeContentProps } from "@/types";
import { AIIndicator } from "./AIIndicator";

/**
 * Format date to readable format: "Month DD, YYYY"
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * RecipeContent component displays the complete recipe information
 * including title, metadata, ingredients, and instructions
 */
export function RecipeContent({ recipe }: RecipeContentProps) {
  const createdDate = formatDate(recipe.created_at);
  const updatedDate = formatDate(recipe.updated_at);
  const showUpdatedDate = recipe.created_at !== recipe.updated_at;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-4xl font-bold tracking-tight">{recipe.title}</h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Created:</span> {createdDate}
        </div>
        {showUpdatedDate && (
          <div>
            <span className="font-medium">Updated:</span> {updatedDate}
          </div>
        )}
      </div>

      {/* AI Indicator - Only shown for AI-generated recipes */}
      {recipe.is_ai_generated && recipe.parent_recipe_id && <AIIndicator parentRecipeId={recipe.parent_recipe_id} />}

      {/* Ingredients Section */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Ingredients</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="whitespace-pre-wrap text-foreground">{recipe.ingredients}</p>
        </div>
      </section>

      {/* Instructions Section */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Instructions</h2>
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="whitespace-pre-wrap text-foreground">{recipe.instructions}</p>
        </div>
      </section>
    </div>
  );
}
