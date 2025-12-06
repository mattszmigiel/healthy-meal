import type { DietaryPreferencesEntity, RecipeEntity } from "@/types";

/**
 * OpenRouter API response structure
 * Represents the format returned by the OpenRouter API
 */
interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Mocked AI response structure matching OpenRouter API format
 */
interface MockedAIResponse {
  modifiedRecipe: {
    title: string;
    ingredients: string;
    instructions: string;
    explanation: string;
  };
  metadata: {
    model: string;
    provider: string;
    generation_duration: number;
    raw_response: OpenRouterResponse;
  };
}

/**
 * Simulates realistic latency for AI processing
 * Returns a random delay between 1-3 seconds
 */
async function simulateLatency(): Promise<void> {
  const minDelay = 1000; // 1 second
  const maxDelay = 3000; // 3 seconds
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Generates a realistic explanation of recipe modifications based on dietary preferences
 */
function generateExplanation(preferences: DietaryPreferencesEntity): string {
  const modifications: string[] = [];

  if (preferences.diet_type) {
    modifications.push(`Modified to be ${preferences.diet_type}`);
  }

  if (preferences.allergies && preferences.allergies.length > 0) {
    const allergyList = preferences.allergies.join(", ");
    modifications.push(`Removed allergens: ${allergyList}`);
  }

  if (preferences.disliked_ingredients && preferences.disliked_ingredients.length > 0) {
    const dislikedList = preferences.disliked_ingredients.join(", ");
    modifications.push(`Replaced disliked ingredients: ${dislikedList}`);
  }

  const header = "This recipe has been modified based on your dietary preferences.";
  const changes = modifications.length > 0 ? "\n\nKey changes:\n- " + modifications.join("\n- ") : "";

  return header + changes;
}

/**
 * Applies dietary preference modifications to recipe title
 */
function modifyTitle(originalTitle: string, preferences: DietaryPreferencesEntity): string {
  const suffixes: string[] = [];

  if (preferences.diet_type && preferences.diet_type !== "omnivore") {
    // Capitalize first letter
    const capitalized = preferences.diet_type.charAt(0).toUpperCase() + preferences.diet_type.slice(1);
    suffixes.push(capitalized);
  }

  if (preferences.allergies && preferences.allergies.length > 0) {
    const allergyFree = preferences.allergies
      .map((allergy) => {
        // Format allergy name (e.g., "gluten" -> "Gluten-Free")
        return allergy.charAt(0).toUpperCase() + allergy.slice(1) + "-Free";
      })
      .join(", ");
    suffixes.push(allergyFree);
  }

  if (suffixes.length === 0) {
    return `${originalTitle} (Modified)`;
  }

  return `${originalTitle} (${suffixes.join(", ")})`;
}

/**
 * Applies dietary preference modifications to ingredients
 */
function modifyIngredients(originalIngredients: string, preferences: DietaryPreferencesEntity): string {
  let modified = originalIngredients;

  // Apply diet-specific modifications
  if (preferences.diet_type === "vegan") {
    // Common vegan substitutions
    modified = modified.replace(/\beggs?\b/gi, "flax eggs");
    modified = modified.replace(/\bmilk\b/gi, "almond milk");
    modified = modified.replace(/\bbutter\b/gi, "vegan butter");
    modified = modified.replace(/\bcheese\b/gi, "vegan cheese");
    modified = modified.replace(/\bhoney\b/gi, "maple syrup");
  } else if (preferences.diet_type === "vegetarian") {
    modified = modified.replace(/\bchicken\b/gi, "tofu");
    modified = modified.replace(/\bbeef\b/gi, "tempeh");
    modified = modified.replace(/\bpork\b/gi, "mushrooms");
  }

  // Apply allergy substitutions
  if (preferences.allergies?.includes("gluten")) {
    modified = modified.replace(/\bflour\b/gi, "almond flour");
    modified = modified.replace(/\ball-purpose flour\b/gi, "gluten-free flour blend");
    modified = modified.replace(/\bwheat flour\b/gi, "rice flour");
  }

  if (preferences.allergies?.includes("dairy")) {
    modified = modified.replace(/\bmilk\b/gi, "oat milk");
    modified = modified.replace(/\bcream\b/gi, "coconut cream");
    modified = modified.replace(/\bbutter\b/gi, "coconut oil");
  }

  if (preferences.allergies?.includes("nuts")) {
    modified = modified.replace(/\balmond\b/gi, "sunflower seed");
    modified = modified.replace(/\bwalnuts?\b/gi, "pumpkin seeds");
    modified = modified.replace(/\bpeanuts?\b/gi, "seeds");
  }

  // Apply disliked ingredient substitutions
  if (preferences.disliked_ingredients) {
    for (const disliked of preferences.disliked_ingredients) {
      const regex = new RegExp(`\\b${disliked}\\b`, "gi");
      modified = modified.replace(regex, `[substitute for ${disliked}]`);
    }
  }

  return modified;
}

/**
 * Applies dietary preference modifications to instructions
 */
function modifyInstructions(originalInstructions: string, preferences: DietaryPreferencesEntity): string {
  let modified = originalInstructions;

  // Adjust cooking instructions for vegan ingredients
  if (preferences.diet_type === "vegan") {
    modified = modified.replace(
      /\bbeat the eggs\b/gi,
      "prepare the flax eggs (1 tbsp flaxseed + 3 tbsp water per egg)"
    );
    modified = modified.replace(/\bmelt the butter\b/gi, "melt the vegan butter");
  }

  // Add notes about allergen-free cooking
  if (preferences.allergies && preferences.allergies.length > 0) {
    modified += "\n\nNote: Ensure all cooking surfaces and utensils are free from cross-contamination with allergens.";
  }

  return modified;
}

/**
 * Generates a mocked AI response with realistic recipe modifications
 *
 * This service simulates the OpenRouter API response without making actual API calls.
 * It applies rule-based modifications based on dietary preferences and returns
 * a structure matching the expected AI response format.
 *
 * @param recipe - The original recipe to modify
 * @param preferences - User's dietary preferences to apply
 * @returns Promise resolving to mocked AI response with modified recipe
 *
 * @example
 * ```typescript
 * const response = await generateMockedAIPreview(recipe, preferences);
 * console.log(response.modifiedRecipe.title);
 * console.log(response.metadata.generation_duration);
 * ```
 */
export async function generateMockedAIPreview(
  recipe: RecipeEntity,
  preferences: DietaryPreferencesEntity
): Promise<MockedAIResponse> {
  // Simulate realistic AI processing time
  const startTime = Date.now();
  await simulateLatency();
  const endTime = Date.now();
  const generationDuration = endTime - startTime;

  // Apply modifications based on preferences
  const modifiedTitle = modifyTitle(recipe.title, preferences);
  const modifiedIngredients = modifyIngredients(recipe.ingredients, preferences);
  const modifiedInstructions = modifyInstructions(recipe.instructions, preferences);
  const explanation = generateExplanation(preferences);

  // Create mock OpenRouter-style response
  const rawResponse = {
    id: `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    model: "anthropic/claude-3.5-sonnet",
    created: Math.floor(Date.now() / 1000),
    object: "chat.completion",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            title: modifiedTitle,
            ingredients: modifiedIngredients,
            instructions: modifiedInstructions,
            explanation: explanation,
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: Math.floor(recipe.ingredients.length / 4 + recipe.instructions.length / 4),
      completion_tokens: Math.floor(
        modifiedIngredients.length / 4 + modifiedInstructions.length / 4 + explanation.length / 4
      ),
      total_tokens: 0, // Will be calculated
    },
  };

  // Calculate total tokens
  rawResponse.usage.total_tokens = rawResponse.usage.prompt_tokens + rawResponse.usage.completion_tokens;

  return {
    modifiedRecipe: {
      title: modifiedTitle,
      ingredients: modifiedIngredients,
      instructions: modifiedInstructions,
      explanation: explanation,
    },
    metadata: {
      model: "anthropic/claude-3.5-sonnet",
      provider: "openrouter",
      generation_duration: generationDuration,
      raw_response: rawResponse,
    },
  };
}

/**
 * Simulates a timeout error for testing purposes
 * Throws an error after 120 seconds
 */
export async function simulateTimeout(): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 120000));
  throw new Error("AI service timeout: Request exceeded 120 seconds");
}

/**
 * Simulates service unavailability for testing purposes
 */
export function simulateServiceUnavailable(): never {
  throw new Error("AI service unavailable: The AI service is temporarily down");
}
