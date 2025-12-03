import type { supabaseClient } from "@/db/supabase.client";
import type {
  CreateRecipeCommand,
  RecipeListQueryParams,
  RecipeListResponseDTO,
  RecipeResponseDTO,
  RecipeWithAIMetadataDTO,
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
  async createRecipe(userId: string, command: CreateRecipeCommand): Promise<RecipeResponseDTO> {
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
      const { error: metadataError } = await this.supabase.from("recipe_ai_metadata").insert({
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
        throw new Error(`Failed to create AI metadata: ${metadataError.message}`);
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
        ? (completeRecipe.ai_metadata[0] ?? null)
        : completeRecipe.ai_metadata,
    };
  }

  /**
   * Validates that parent recipe exists and belongs to user
   * @returns true if valid, false if not found or unauthorized
   */
  async validateParentRecipe(userId: string, parentRecipeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("recipes")
      .select("id")
      .eq("id", parentRecipeId)
      .eq("owner_id", userId)
      .maybeSingle();

    return !error && data !== null;
  }

  /**
   * Retrieves a paginated list of recipes for a user with optional filters
   * @param userId - The ID of the user whose recipes to fetch
   * @param params - Query parameters (page, limit, filters)
   * @returns Paginated list of recipes with AI metadata
   * @throws Error if database operation fails
   */
  async listUserRecipes(userId: string, params: RecipeListQueryParams): Promise<RecipeListResponseDTO> {
    const { page = 1, limit = 20, is_ai_generated, parent_recipe_id } = params;
    const offset = (page - 1) * limit;

    // Build base query for data with user filter (RLS also applies)
    let dataQuery = this.supabase
      .from("recipes")
      .select(
        `
        *,
        ai_metadata:recipe_ai_metadata(*)
      `,
        { count: "exact" }
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    // Apply optional filters
    if (is_ai_generated !== undefined) {
      dataQuery = dataQuery.eq("is_ai_generated", is_ai_generated);
    }

    if (parent_recipe_id) {
      dataQuery = dataQuery.eq("parent_recipe_id", parent_recipe_id);
    }

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute data query
    const { data, error, count } = await dataQuery;

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Transform data to ensure ai_metadata is single object or null (not array)
    const transformedData: RecipeWithAIMetadataDTO[] = data.map((recipe) => ({
      ...recipe,
      ai_metadata: Array.isArray(recipe.ai_metadata) ? (recipe.ai_metadata[0] ?? null) : recipe.ai_metadata,
    }));

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }
}
