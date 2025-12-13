import { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import type { AIPreviewDialogProps } from "@/types";
import { useAIPreview } from "@/components/hooks/useAIPreview";
import { useSaveAIRecipe } from "@/components/hooks/useSaveAIRecipe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NoPreferencesAlert } from "./NoPreferencesAlert";
import { cn } from "@/lib/utils";

/**
 * Spinner/Loading icon SVG component
 */
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

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

const TITLE_MAX_LENGTH = 200;

/**
 * AIPreviewDialog component displays AI modification preview with tabs
 * Handles all error states and allows title editing before saving
 */
export function AIPreviewDialog({ isOpen, recipeId, onClose, onSaved }: AIPreviewDialogProps) {
  const { state: previewState, generate, reset } = useAIPreview(recipeId);
  const { saving, error: saveError, save } = useSaveAIRecipe();

  // Modified recipe title (editable)
  const [modifiedTitle, setModifiedTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  // Generate preview when dialog opens
  useEffect(() => {
    if (isOpen && previewState.status === "idle") {
      generate();
    }
  }, [isOpen, previewState.status, generate]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setModifiedTitle("");
      setTitleError(null);
    }
  }, [isOpen, reset]);

  // Set initial modified title when preview loads
  useEffect(() => {
    if (previewState.status === "success" && !modifiedTitle) {
      setModifiedTitle(previewState.data.modified_recipe.title);
    }
  }, [previewState, modifiedTitle]);

  // Handle title change
  const handleTitleChange = (value: string) => {
    setModifiedTitle(value);
    // Clear error when user starts typing
    if (titleError) {
      setTitleError(null);
    }
  };

  // Validate title
  const validateTitle = (): boolean => {
    const trimmedTitle = modifiedTitle.trim();

    if (trimmedTitle.length === 0) {
      setTitleError("Title is required");
      return false;
    }

    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setTitleError(`Title must be ${TITLE_MAX_LENGTH} characters or less`);
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateTitle() || previewState.status !== "success") {
      return;
    }

    try {
      const newRecipeId = await save({
        title: modifiedTitle.trim(),
        ingredients: previewState.data.modified_recipe.ingredients,
        instructions: previewState.data.modified_recipe.instructions,
        is_ai_generated: true,
        parent_recipe_id: previewState.data.original_recipe.id,
        ai_metadata: previewState.data.ai_metadata,
      });

      // Close dialog and notify parent
      onClose();
      onSaved(newRecipeId);

      // Navigate to new recipe
      navigate(`/recipes/${newRecipeId}`);
    } catch (err) {
      // Error is handled by useSaveAIRecipe hook
      console.error("Failed to save AI recipe:", err);
    }
  };

  // Handle navigate to profile
  const handleNavigateToProfile = () => {
    onClose();
    navigate("/profile");
  };

  // Handle retry
  const handleRetry = () => {
    reset();
    generate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Recipe Preview</DialogTitle>
          <DialogDescription>Review the AI-modified recipe before saving</DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {previewState.status === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <SpinnerIcon className="h-8 w-8 text-primary" />
            <p className="text-muted-foreground">Generating AI modification...</p>
          </div>
        )}

        {/* Error State */}
        {previewState.status === "error" && (
          <div className="space-y-4">
            {/* No Preferences Error */}
            {previewState.error.type === "no_preferences" && (
              <NoPreferencesAlert onNavigateToProfile={handleNavigateToProfile} />
            )}

            {/* Rate Limit Error */}
            {previewState.error.type === "rate_limit" && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold">Too Many Requests</p>
                  <p>
                    You&apos;ve made too many AI modification requests. Please wait {previewState.error.retryAfter}{" "}
                    seconds before trying again.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Service Unavailable Error */}
            {previewState.error.type === "service_unavailable" && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold">Service Temporarily Unavailable</p>
                  <p>The AI service is currently unavailable. Please try again in a few moments.</p>
                  <Button onClick={handleRetry} variant="outline" size="sm" className="mt-2">
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Not Found Error */}
            {previewState.error.type === "not_found" && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Recipe not found</p>
                  <p>The recipe could not be found or you don&apos;t have access to it.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Unknown Error */}
            {previewState.error.type === "unknown" && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold">Error</p>
                  <p>{previewState.error.message}</p>
                  <Button onClick={handleRetry} variant="outline" size="sm" className="mt-2">
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Success State */}
        {previewState.status === "success" && (
          <div className="space-y-4">
            <Tabs defaultValue="modified" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="modified">Modified</TabsTrigger>
                <TabsTrigger value="explanation">Explanation</TabsTrigger>
              </TabsList>

              {/* Original Tab */}
              <TabsContent value="original" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Title</h3>
                    <p className="text-sm">{previewState.data.original_recipe.title}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Ingredients</h3>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm whitespace-pre-wrap">{previewState.data.original_recipe.ingredients}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm whitespace-pre-wrap">{previewState.data.original_recipe.instructions}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Modified Tab */}
              <TabsContent value="modified" className="space-y-4">
                <div className="space-y-4">
                  {/* Editable Title */}
                  <div className="space-y-2">
                    <Label htmlFor="modified-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="modified-title"
                      value={modifiedTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter recipe title"
                      maxLength={TITLE_MAX_LENGTH}
                      aria-invalid={!!titleError}
                      aria-describedby={titleError ? "title-error" : undefined}
                      className={cn(titleError && "border-destructive focus-visible:ring-destructive")}
                    />
                    {titleError && (
                      <p id="title-error" className="text-sm text-destructive" role="alert">
                        {titleError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {modifiedTitle.length} / {TITLE_MAX_LENGTH} characters
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Ingredients</h3>
                    <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
                      <p className="text-sm whitespace-pre-wrap">{previewState.data.modified_recipe.ingredients}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
                      <p className="text-sm whitespace-pre-wrap">{previewState.data.modified_recipe.instructions}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Explanation Tab */}
              <TabsContent value="explanation" className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {previewState.data.modified_recipe.explanation}
                  </p>
                </div>

                {/* Applied Preferences */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Applied Preferences</h3>
                  <div className="space-y-1 text-sm">
                    {previewState.data.applied_preferences.diet_type && (
                      <p>
                        <span className="font-medium">Diet Type:</span>{" "}
                        {previewState.data.applied_preferences.diet_type}
                      </p>
                    )}
                    {previewState.data.applied_preferences.allergies &&
                      previewState.data.applied_preferences.allergies.length > 0 && (
                        <p>
                          <span className="font-medium">Allergies:</span>{" "}
                          {previewState.data.applied_preferences.allergies.join(", ")}
                        </p>
                      )}
                    {previewState.data.applied_preferences.disliked_ingredients &&
                      previewState.data.applied_preferences.disliked_ingredients.length > 0 && (
                        <p>
                          <span className="font-medium">Disliked Ingredients:</span>{" "}
                          {previewState.data.applied_preferences.disliked_ingredients.join(", ")}
                        </p>
                      )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save Error */}
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Dialog Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {previewState.status === "success" && (
            <Button onClick={handleSave} disabled={saving || !modifiedTitle.trim()}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                "Save Recipe"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
