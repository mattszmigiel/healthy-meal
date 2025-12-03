import type { supabaseClient } from "@/db/supabase.client";
import type { UpdateDietaryPreferencesCommand, DietaryPreferencesDTO } from "@/types";

type SupabaseClient = typeof supabaseClient;

/**
 * Service for managing dietary preferences
 */
export class DietaryPreferencesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves dietary preferences for a user
   *
   * @param userId - The authenticated user's ID
   * @returns The user's dietary preferences
   * @throws Error with specific codes for different failure scenarios
   */
  async getDietaryPreferences(userId: string): Promise<DietaryPreferencesDTO> {
    // Query dietary preferences with RLS enforcement
    const { data, error } = await this.supabase.from("dietary_preferences").select("*").eq("user_id", userId).single();

    // Handle errors
    if (error) {
      // PGRST116 = no rows returned (not found)
      if (error.code === "PGRST116") {
        throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
      }
      console.error("Error fetching dietary preferences:", error);
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
    }

    return data;
  }

  /**
   * Updates dietary preferences for a user
   * Performs a partial update - only provided fields are updated
   *
   * @param userId - The authenticated user's ID
   * @param command - The update command containing fields to update
   * @returns The updated dietary preferences
   * @throws Error with specific codes for different failure scenarios
   */
  async updateDietaryPreferences(
    userId: string,
    command: UpdateDietaryPreferencesCommand
  ): Promise<DietaryPreferencesDTO> {
    // Build update object with only provided fields
    const updateData: Partial<UpdateDietaryPreferencesCommand> = {};

    if (command.diet_type !== undefined) {
      updateData.diet_type = command.diet_type;
    }
    if (command.allergies !== undefined) {
      updateData.allergies = command.allergies;
    }
    if (command.disliked_ingredients !== undefined) {
      updateData.disliked_ingredients = command.disliked_ingredients;
    }

    // Perform update with RLS enforcement
    const { data, error } = await this.supabase
      .from("dietary_preferences")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    // Handle errors
    if (error) {
      // PGRST116 = no rows returned (not found)
      if (error.code === "PGRST116") {
        throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
      }
      console.error("Error updating dietary preferences:", error);
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
    }

    return data;
  }
}
