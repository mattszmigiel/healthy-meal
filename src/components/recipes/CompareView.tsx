import { useState, useEffect } from "react";
import type { CompareViewProps, RecipeResponseDTO } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * ChevronDown icon SVG component
 */
function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * CompareView component displays original and AI-modified recipes side-by-side
 * Allows users to see exactly what changed in the AI modification
 */
export function CompareView({ parentRecipeId, modified }: CompareViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parentRecipe, setParentRecipe] = useState<RecipeResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch parent recipe when opening the compare view
  useEffect(() => {
    if (isOpen && !parentRecipe && !loading && !error) {
      const fetchParentRecipe = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/recipes/${parentRecipeId}`);
          if (!response.ok) {
            setError(true);
            setLoading(false);
            return;
          }

          const recipe: RecipeResponseDTO = await response.json();
          setParentRecipe(recipe);
        } catch (err) {
          console.error("Error fetching parent recipe for comparison:", err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchParentRecipe();
    }
  }, [isOpen, parentRecipeId, parentRecipe, loading, error]);

  // Use fetched parent recipe - need to fetch before displaying
  const originalRecipe = parentRecipe;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          aria-expanded={isOpen}
          aria-controls="compare-content"
        >
          <span className="font-semibold">Compare with Original</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent id="compare-content" className="space-y-4">
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading original recipe...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>Failed to load original recipe for comparison.</p>
          </div>
        )}

        {!loading && !error && originalRecipe && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Original</h3>
                <Badge variant="outline">Before</Badge>
              </div>

              {/* Original Ingredients */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Ingredients</h4>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap">{originalRecipe.ingredients}</p>
                </div>
              </div>

              {/* Original Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Instructions</h4>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap">{originalRecipe.instructions}</p>
                </div>
              </div>
            </div>

            {/* Modified Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">AI Modified</h3>
                <Badge variant="secondary">After</Badge>
              </div>

              {/* Modified Ingredients */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Ingredients</h4>
                <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
                  <p className="text-sm whitespace-pre-wrap">{modified.ingredients}</p>
                </div>
              </div>

              {/* Modified Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Instructions</h4>
                <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
                  <p className="text-sm whitespace-pre-wrap">{modified.instructions}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
