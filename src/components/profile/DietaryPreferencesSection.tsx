import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { AlertCircle } from "lucide-react";
import { useDietaryPreferences } from "@/components/hooks/useDietaryPreferences";
import { DietTypeSelect } from "./DietTypeSelect";
import { TagInput } from "./TagInput";
import type { DietaryPreferencesSectionProps } from "@/types";

export function DietaryPreferencesSection({
  preferences: initialPreferences,
  onPreferencesUpdated,
}: DietaryPreferencesSectionProps) {
  const {
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
  } = useDietaryPreferences(initialPreferences);

  const handleSave = async () => {
    await savePreferences();
    if (preferences) {
      onPreferencesUpdated(preferences);
    }
  };

  const formatDietType = (dietType: string | null) => {
    if (!dietType) return "Not specified";
    return dietType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dietary Preferences</CardTitle>
            {!isEditing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Diet Type</Label>
                <p className="text-sm text-muted-foreground">{formatDietType(preferences?.diet_type || null)}</p>
              </div>
              <div>
                <Label>Allergies & Intolerances</Label>
                {preferences?.allergies && preferences.allergies.length > 0 ? (
                  <p className="text-sm text-muted-foreground">{preferences.allergies.join(", ")}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">None specified</p>
                )}
              </div>
              <div>
                <Label>Disliked Ingredients</Label>
                {preferences?.disliked_ingredients && preferences.disliked_ingredients.length > 0 ? (
                  <p className="text-sm text-muted-foreground">{preferences.disliked_ingredients.join(", ")}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DietTypeSelect
                value={formState.diet_type}
                onChange={(value) => updateFormField("diet_type", value)}
                disabled={isSaving}
                id="diet-type"
              />
              <TagInput
                label="Allergies & Intolerances"
                value={formState.allergies}
                onChange={(value) => updateFormField("allergies", value)}
                placeholder="Type and press Enter to add"
                disabled={isSaving}
                id="allergies"
              />
              <TagInput
                label="Disliked Ingredients"
                value={formState.disliked_ingredients}
                onChange={(value) => updateFormField("disliked_ingredients", value)}
                placeholder="Type and press Enter to add"
                disabled={isSaving}
                id="disliked-ingredients"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={cancelEditing} variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </>
  );
}
