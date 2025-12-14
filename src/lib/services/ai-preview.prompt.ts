import type { RecipeEntity, DietaryPreferencesEntity } from "@/types";

/**
 * Builds a prompt for the AI to modify a recipe based on dietary preferences
 *
 * @param recipe - The original recipe
 * @param preferences - User's dietary preferences
 * @returns Formatted prompt string for AI recipe modification
 *
 * @example
 * ```typescript
 * const prompt = buildRecipeModificationPrompt(recipe, preferences);
 * const response = await openRouterService.chat({
 *   messages: [{ role: "user", content: prompt }]
 * });
 * ```
 */
export function buildRecipeModificationPrompt(recipe: RecipeEntity, preferences: DietaryPreferencesEntity): string {
  const preferenceParts: string[] = [];

  if (preferences.diet_type) {
    preferenceParts.push(`Diet type: ${preferences.diet_type}`);
  }

  if (preferences.allergies && preferences.allergies.length > 0) {
    preferenceParts.push(`Allergies: ${preferences.allergies.join(", ")}`);
  }

  if (preferences.disliked_ingredients && preferences.disliked_ingredients.length > 0) {
    preferenceParts.push(`Disliked ingredients: ${preferences.disliked_ingredients.join(", ")}`);
  }

  const preferencesText = preferenceParts.join("\n");

  return `Please modify the following recipe based on these dietary preferences:

${preferencesText}

Original Recipe:
Title: ${recipe.title}

Ingredients:
${recipe.ingredients}

Instructions:
${recipe.instructions}

Please provide a modified version of this recipe that accommodates the dietary preferences above. Return your response as a JSON object with the following structure:
{
  "title": "Modified recipe title (include dietary preference indicators like 'Vegan', 'Gluten-Free', etc.)",
  "ingredients": "Complete list of modified ingredients",
  "instructions": "Complete cooking instructions with any necessary adjustments",
  "explanation": "Detailed explanation of the changes made and why (include specific ingredient substitutions)"
}

Important:
- Make realistic and practical substitutions
- Maintain the essence and appeal of the original dish
- Provide clear explanations for all changes
- Ensure the modified recipe is complete and ready to use
- If multiple dietary preferences apply, address all of them`;
}

/**
 * System prompt for the AI recipe modification
 * Defines the AI's role and behavior when modifying recipes
 */
export const RECIPE_MODIFICATION_SYSTEM_PROMPT =
  "You are a professional chef and nutritionist. Modify recipes based on dietary preferences while maintaining taste and quality. Always provide detailed explanations for changes.";
