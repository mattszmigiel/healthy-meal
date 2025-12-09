import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createRecipeSchema } from "@/lib/schemas/recipe.schema";
import type { CreateRecipeCommand, RecipeResponseDTO, APIErrorResponse } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AddRecipeFormData {
  title: string;
  ingredients: string;
  instructions: string;
}

export interface FormErrors {
  title?: string;
  ingredients?: string;
  instructions?: string;
  combined?: string;
  general?: string;
}

export interface CharacterCountInfo {
  current: number;
  max: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface UseRecipeFormReturn {
  // Form data
  formData: AddRecipeFormData;

  // Character counting
  titleCharCount: CharacterCountInfo;
  combinedCharCount: CharacterCountInfo;

  // Error state
  errors: FormErrors;

  // Loading state
  isSubmitting: boolean;
  isSuccessfullySubmitted: boolean;

  // Actions
  handleFieldChange: (field: keyof AddRecipeFormData, value: string) => void;
  handleFieldBlur: (field: keyof AddRecipeFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate character count information for a given text and max limit
 */
const calculateCharCount = (text: string, max: number, warningThreshold = 0.9): CharacterCountInfo => {
  const current = text.length;
  const percentage = (current / max) * 100;
  const isWarning = percentage >= warningThreshold * 100 && percentage < 100;
  const isExceeded = percentage > 100;

  return {
    current,
    max,
    percentage,
    isWarning,
    isExceeded,
  };
};

/**
 * Validate a single field using the full schema
 */
const validateField = (field: keyof AddRecipeFormData, formData: AddRecipeFormData): string | undefined => {
  // Create a minimal valid object for validation
  const testData = {
    title: formData.title,
    ingredients: formData.ingredients,
    instructions: formData.instructions,
    is_ai_generated: false,
    parent_recipe_id: null,
    ai_metadata: null,
  };

  const result = createRecipeSchema.safeParse(testData);

  if (!result.success) {
    const fieldError = result.error.errors.find((err) => err.path[0] === field);
    return fieldError?.message;
  }

  return undefined;
};

/**
 * Parse server validation errors and map to form fields
 */
const handleServerValidationErrors = (error: APIErrorResponse): FormErrors => {
  const newErrors: FormErrors = {};

  if (error.details) {
    error.details.forEach((detail) => {
      const lowerDetail = detail.toLowerCase();
      if (lowerDetail.includes("title")) {
        newErrors.title = detail;
      } else if (lowerDetail.includes("ingredients")) {
        newErrors.ingredients = detail;
      } else if (lowerDetail.includes("instructions")) {
        newErrors.instructions = detail;
      } else if (lowerDetail.includes("combined")) {
        newErrors.combined = detail;
      } else {
        newErrors.general = detail;
      }
    });
  } else {
    newErrors.general = error.message;
  }

  return newErrors;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useRecipeForm(): UseRecipeFormReturn {
  // State management
  const [formData, setFormData] = useState<AddRecipeFormData>({
    title: "",
    ingredients: "",
    instructions: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);

  // Computed values
  const titleCharCount = useMemo(() => calculateCharCount(formData.title, 200), [formData.title]);

  const combinedCharCount = useMemo(
    () => calculateCharCount(formData.ingredients + formData.instructions, 10000),
    [formData.ingredients, formData.instructions]
  );

  // Handler: Field change
  const handleFieldChange = useCallback((field: keyof AddRecipeFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error when user starts typing
    setErrors((prev) => {
      const updated: FormErrors = {};
      // Copy all errors except the field being edited
      (Object.keys(prev) as (keyof FormErrors)[]).forEach((key) => {
        if (key !== field) {
          // Also clear combined error if typing in ingredients or instructions
          if ((field === "ingredients" || field === "instructions") && key === "combined") {
            return;
          }
          updated[key] = prev[key];
        }
      });
      return updated;
    });
  }, []);

  // Handler: Field blur
  const handleFieldBlur = useCallback(
    (field: keyof AddRecipeFormData) => {
      const error = validateField(field, formData);
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    },
    [formData]
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const requestData = {
      title: formData.title,
      ingredients: formData.ingredients,
      instructions: formData.instructions,
      is_ai_generated: false,
      parent_recipe_id: null,
      ai_metadata: null,
    };

    const result = createRecipeSchema.safeParse(requestData);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!newErrors[field]) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  // Handler: Form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!validateForm()) {
        return;
      }

      // Set loading state
      setIsSubmitting(true);

      try {
        // Construct request body
        const requestBody: CreateRecipeCommand = {
          title: formData.title.trim(),
          ingredients: formData.ingredients.trim(),
          instructions: formData.instructions.trim(),
          is_ai_generated: false,
          parent_recipe_id: null,
          ai_metadata: null,
        };

        // Make API call
        const response = await fetch("/api/recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Handle response
        if (response.ok) {
          const recipe: RecipeResponseDTO = await response.json();

          // Mark as successfully submitted to prevent beforeunload warning
          setIsSuccessfullySubmitted(true);

          // Success: show toast and navigate to recipe detail page
          toast.success("Recipe saved successfully");

          // Navigate after a brief delay to show the toast
          setTimeout(() => {
            window.location.href = `/recipes/${recipe.id}`;
          }, 500);
        } else {
          // Error: parse and display
          const error: APIErrorResponse = await response.json();

          if (response.status === 400) {
            // Validation error from server
            setErrors(handleServerValidationErrors(error));
          } else {
            // General server error
            setErrors({
              general: error.message || "An error occurred while saving the recipe",
            });
          }
        }
      } catch {
        // Network error
        setErrors({
          general: "Network error. Please check your connection and try again.",
        });
      } finally {
        // Clear loading state
        setIsSubmitting(false);
      }
    },
    [formData, validateForm]
  );

  // Handler: Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      ingredients: "",
      instructions: "",
    });
    setErrors({});
  }, []);

  return {
    formData,
    titleCharCount,
    combinedCharCount,
    errors,
    isSubmitting,
    isSuccessfullySubmitted,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    resetForm,
  };
}
