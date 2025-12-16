import { useState, useMemo } from "react";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import type {
  DietaryPreferencesDTO,
  DietaryPreferencesFormState,
  UpdateDietaryPreferencesCommand,
  APIErrorResponse,
  UseDietaryPreferencesReturn,
} from "@/types";

export function useDietaryPreferences(initialPreferences: DietaryPreferencesDTO | null): UseDietaryPreferencesReturn {
  const [preferences, setPreferences] = useState<DietaryPreferencesDTO | null>(initialPreferences);
  const [formState, setFormState] = useState<DietaryPreferencesFormState>({
    diet_type: null,
    allergies: [],
    disliked_ingredients: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    if (!preferences) {
      return true;
    }

    return (
      formState.diet_type !== preferences.diet_type ||
      JSON.stringify([...formState.allergies].sort()) !== JSON.stringify([...(preferences.allergies || [])].sort()) ||
      JSON.stringify([...formState.disliked_ingredients].sort()) !==
        JSON.stringify([...(preferences.disliked_ingredients || [])].sort())
    );
  }, [formState, preferences]);

  const startEditing = () => {
    setFormState({
      diet_type: preferences?.diet_type || null,
      allergies: preferences?.allergies || [],
      disliked_ingredients: preferences?.disliked_ingredients || [],
    });
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormState({
      diet_type: null,
      allergies: [],
      disliked_ingredients: [],
    });
    setError(null);
  };

  const updateFormField = (field: keyof DietaryPreferencesFormState, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const requestBody: Partial<UpdateDietaryPreferencesCommand> = {
        diet_type: formState.diet_type,
        allergies: formState.allergies,
        disliked_ingredients: formState.disliked_ingredients,
      };

      if (Object.keys(requestBody).length === 0) {
        setError("No changes to save");
        return;
      }

      const response = await fetch("/api/profile/dietary-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/");
          return;
        }

        const errorData: APIErrorResponse = await response.json();
        throw new Error(errorData.message || "Failed to update preferences");
      }

      const updatedPreferences: DietaryPreferencesDTO = await response.json();
      setPreferences(updatedPreferences);
      setIsEditing(false);

      toast.success("Preferences updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    preferences,
    formState,
    isEditing,
    isSaving,
    error,
    hasChanges,
    startEditing,
    cancelEditing,
    updateFormField,
    savePreferences,
    resetError,
  };
}
