import { useRef, useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { useRecipeForm } from "@/components/hooks/useRecipeForm";
import { CharacterCounter } from "./CharacterCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// UI-specific constants
const CHARACTER_WARNING_THRESHOLD = 0.9;

export function AddRecipeForm() {
  const {
    formData,
    titleCharCount,
    combinedCharCount,
    errors,
    isSubmitting,
    isSuccessfullySubmitted,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
  } = useRecipeForm();

  // State for cancel confirmation dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // State to bypass beforeunload when intentionally leaving
  const [isCancelling, setIsCancelling] = useState(false);

  // Refs for focus management
  const titleRef = useRef<HTMLInputElement>(null);
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);
  const instructionsRef = useRef<HTMLTextAreaElement>(null);

  // Focus first field with error
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errors.title) {
        titleRef.current?.focus();
      } else if (errors.ingredients) {
        ingredientsRef.current?.focus();
      } else if (errors.instructions) {
        instructionsRef.current?.focus();
      }
    }
  }, [errors]);

  // Data loss prevention
  useEffect(() => {
    const hasData = formData.title.trim() || formData.ingredients.trim() || formData.instructions.trim();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't warn if successfully submitted, cancelling, or if no data
      if (hasData && !isSubmitting && !isSuccessfullySubmitted && !isCancelling) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, isSubmitting, isSuccessfullySubmitted, isCancelling]);

  // Check if submit should be disabled
  const isSubmitDisabled =
    isSubmitting ||
    formData.title.trim().length === 0 ||
    formData.ingredients.trim().length === 0 ||
    formData.instructions.trim().length === 0 ||
    combinedCharCount.isExceeded;

  // Check if form has unsaved data
  const hasUnsavedData = formData.title.trim() || formData.ingredients.trim() || formData.instructions.trim();

  // Handle cancel button click
  const handleCancel = () => {
    if (hasUnsavedData) {
      setShowCancelDialog(true);
    } else {
      setIsCancelling(true);
      navigate("/recipes");
    }
  };

  // Handle confirmed cancel
  const handleConfirmedCancel = () => {
    setIsCancelling(true);
    // Small timeout to ensure state is updated before navigation
    setTimeout(() => {
      navigate("/recipes");
    }, 0);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting}>
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Recipe</h1>
          <p className="text-muted-foreground">Add a new recipe to your collection. Fill in the details below.</p>
        </div>

        {/* General Error Display */}
        {errors.general && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4" role="alert" aria-live="polite">
            <p className="text-sm font-medium text-destructive">{errors.general}</p>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="text-base font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <CharacterCounter
              current={titleCharCount.current}
              max={titleCharCount.max}
              warningThreshold={CHARACTER_WARNING_THRESHOLD}
            />
          </div>
          <Input
            ref={titleRef}
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            onBlur={() => handleFieldBlur("title")}
            placeholder="Enter recipe title"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            aria-required="true"
            className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-destructive" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Ingredients Field */}
        <div className="space-y-2">
          <Label htmlFor="ingredients" className="text-base font-medium">
            Ingredients <span className="text-destructive">*</span>
          </Label>
          <Textarea
            ref={ingredientsRef}
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) => handleFieldChange("ingredients", e.target.value)}
            onBlur={() => handleFieldBlur("ingredients")}
            placeholder="List all ingredients needed for this recipe"
            rows={8}
            aria-invalid={!!errors.ingredients}
            aria-describedby={errors.ingredients ? "ingredients-error" : undefined}
            aria-required="true"
            className={cn(errors.ingredients && "border-destructive focus-visible:ring-destructive")}
            disabled={isSubmitting}
          />
          {errors.ingredients && (
            <p id="ingredients-error" className="text-sm text-destructive" role="alert">
              {errors.ingredients}
            </p>
          )}
        </div>

        {/* Instructions Field */}
        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-base font-medium">
            Instructions <span className="text-destructive">*</span>
          </Label>
          <Textarea
            ref={instructionsRef}
            id="instructions"
            value={formData.instructions}
            onChange={(e) => handleFieldChange("instructions", e.target.value)}
            onBlur={() => handleFieldBlur("instructions")}
            placeholder="Provide step-by-step cooking instructions"
            rows={10}
            aria-invalid={!!errors.instructions}
            aria-describedby={errors.instructions ? "instructions-error" : undefined}
            aria-required="true"
            className={cn(errors.instructions && "border-destructive focus-visible:ring-destructive")}
            disabled={isSubmitting}
          />
          {errors.instructions && (
            <p id="instructions-error" className="text-sm text-destructive" role="alert">
              {errors.instructions}
            </p>
          )}
        </div>

        {/* Combined Character Counter */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Combined content length (ingredients + instructions)</span>
          <CharacterCounter
            current={combinedCharCount.current}
            max={combinedCharCount.max}
            warningThreshold={CHARACTER_WARNING_THRESHOLD}
          />
        </div>

        {/* Combined Length Error */}
        {errors.combined && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3" role="alert" aria-live="polite">
            <p className="text-sm text-destructive">{errors.combined}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitDisabled} className="min-w-[120px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Recipe"
            )}
          </Button>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your recipe will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedCancel}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
