import type { supabaseClient } from "@/db/supabase.client";
import type {
  CreateRecipeCommand,
  RecipeResponseDTO,
} from "@/types";

type SupabaseClient = typeof supabaseClient;

/**
 * Service for managing recipes
 */
export class RecipeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new recipe with optional AI metadata
   * @throws Error if database operation fails
   */
  async createRecipe(
    userId: string,
    command: CreateRecipeCommand
  ): Promise<RecipeResponseDTO> {
    // Insert recipe
    const { data: recipe, error: recipeError } = await this.supabase
      .from("recipes")
      .insert({
        owner_id: userId,
        title: command.title,
        ingredients: command.ingredients,
        instructions: command.instructions,
        is_ai_generated: command.is_ai_generated,
        parent_recipe_id: command.parent_recipe_id ?? null,
      })
      .select()
      .single();

    if (recipeError) {
      throw new Error(`Failed to create recipe: ${recipeError.message}`);
    }

    // Insert AI metadata if provided
    if (command.ai_metadata) {
      const { error: metadataError } = await this.supabase
        .from("recipe_ai_metadata")
        .insert({
          recipe_id: recipe.id,
          owner_id: userId,
          model: command.ai_metadata.model,
          provider: command.ai_metadata.provider,
          generation_duration: command.ai_metadata.generation_duration,
          raw_response: command.ai_metadata.raw_response,
        });

      if (metadataError) {
        // Rollback: delete the recipe if metadata insert fails
        await this.supabase.from("recipes").delete().eq("id", recipe.id);
        throw new Error(
          `Failed to create AI metadata: ${metadataError.message}`
        );
      }
    }

    // Fetch complete recipe with AI metadata
    const { data: completeRecipe, error: fetchError } = await this.supabase
      .from("recipes")
      .select(
        `
        *,
        ai_metadata:recipe_ai_metadata(*)
      `
      )
      .eq("id", recipe.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch created recipe: ${fetchError.message}`);
    }

    // Transform to DTO format
    return {
      ...completeRecipe,
      ai_metadata: Array.isArray(completeRecipe.ai_metadata)
        ? completeRecipe.ai_metadata[0] ?? null
        : completeRecipe.ai_metadata,
    };
  }

  /**
   * Validates that parent recipe exists and belongs to user
   * @returns true if valid, false if not found or unauthorized
   */
  async validateParentRecipe(
    userId: string,
    parentRecipeId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("recipes")
      .select("id")
      .eq("id", parentRecipeId)
      .eq("owner_id", userId)
      .maybeSingle();

    return !error && data !== null;
  }
}
