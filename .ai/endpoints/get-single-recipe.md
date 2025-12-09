# API Endpoint Implementation Plan: Get Single Recipe

## 1. Endpoint Overview

This endpoint retrieves a single recipe by its unique identifier. It returns the complete recipe details including optional AI metadata if the recipe was AI-generated. ensuring users can only access their own recipes.

**Purpose**: Fetch detailed information about a specific recipe for viewing or editing.

**Key Features**:
- Retrieves recipe with AI metadata (if applicable) in a single query
- Returns 404 for non-existent

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/recipes/:id`

### Path Parameters:
- **Required**:
  - `id` (string, UUID format): The unique identifier of the recipe to retrieve

### Query Parameters:
- None

### Request Headers:
- `Authorization`: JWT token (handled by Astro middleware)

### Request Body:
- None (GET request)

## 3. Used Types

### Response Types:
```typescript
import type { RecipeResponseDTO, APIErrorResponse } from '@/types';
```

- **RecipeResponseDTO**: Complete recipe with optional AI metadata
  - Structure: `RecipeEntity & { ai_metadata: RecipeAIMetadataEntity | null }`
  - Fields: `id`, `owner_id`, `title`, `ingredients`, `instructions`, `is_ai_generated`, `parent_recipe_id`, `created_at`, `updated_at`, `ai_metadata`

### Validation Schema:
```typescript
import { z } from 'zod';

const RecipeIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "Vegan Chocolate Cake",
  "ingredients": "2 cups flour, 1 cup sugar...",
  "instructions": "Preheat oven to 350°F...",
  "is_ai_generated": false,
  "parent_recipe_id": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "ai_metadata": null
}
```

For AI-generated recipes, `ai_metadata` will contain:
```json
{
  "recipe_id": "uuid",
  "owner_id": "uuid",
  "model": "gpt-4",
  "provider": "openai",
  "created_at": "2024-01-15T10:30:00Z",
  "generation_duration": 1234,
  "raw_response": { ... }
}
```

### Error Responses:

**400 Bad Request** - Invalid UUID format:
```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

**404 Not Found** - Recipe not found or not owned by user:
```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**500 Internal Server Error** - Server-side errors:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

```
Client Request (GET /api/recipes/:id)
    ↓
API Route Handler (/src/pages/api/recipes/[id].ts)
    ↓
1. Extract and validate recipe ID from params
    ↓
2. Get Supabase client from context.locals.supabase
    ↓
3. Call RecipesService.getRecipeById(supabase, id)
    ↓
RecipesService (/src/lib/services/recipes.service.ts)
    ↓
4. Query Supabase:
   - SELECT recipes.*, recipe_ai_metadata.*
   - FROM recipes
   - LEFT JOIN recipe_ai_metadata ON recipes.id = recipe_ai_metadata.recipe_id
   - WHERE recipes.id = :id
    ↓
5. Supabase returns data (or empty if not found)
    ↓
6. Service returns result to route handler
    ↓
API Route Handler
    ↓
7. If no data: return 404
8. If data exists: return 200 with RecipeResponseDTO
    ↓
Client receives response
```

## 6. Security Considerations

### Input Validation:
- Validate UUID format using Zod schema before database query
- Prevents injection attacks and malformed requests
- Reject invalid UUIDs with 400 Bad Request

### Information Disclosure Prevention:
- Return for non-existent recipes 
- Generic error messages to client, detailed logs server-side only

### SQL Injection Prevention:
- Supabase client uses parameterized queries automatically
- No raw SQL concatenation
- UUID validation adds additional layer of protection

## 7. Error Handling

### Error Scenarios and Responses:

| Scenario | Status Code | Error Type | Message | Handling |
|----------|-------------|------------|---------|----------|
| Invalid UUID format | 400 | Bad Request | "Invalid recipe ID format" | Validate with Zod, early return |
| Recipe not found | 404 | Not Found | "Recipe not found" | Check if query returns no rows |
| Recipe owned by another user | 404 | Not Found | "Recipe not found" | RLS filters it out, appears as no rows |
| Database connection error | 500 | Internal Server Error | "An unexpected error occurred" | Catch database errors, log details |
| Unexpected exceptions | 500 | Internal Server Error | "An unexpected error occurred" | Global try-catch, log stack trace |

### Error Handling Pattern:
```typescript
// Early return for validation errors
if (!validationResult.success) {
  return new Response(JSON.stringify({ error: "Bad Request", message: "..." }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}

// Service layer returns null for not found
const recipe = await RecipesService.getRecipeById(supabase, id);
if (!recipe) {
  return new Response(JSON.stringify({ error: "Not Found", message: "Recipe not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

// Try-catch for unexpected errors
try {
  // ... logic
} catch (error) {
  console.error("Error fetching recipe:", error);
  return new Response(JSON.stringify({ error: "Internal Server Error", message: "An unexpected error occurred" }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Performance Considerations

### Database Query Optimization:
- **Single Query with LEFT JOIN**: Fetch recipe and AI metadata in one query to minimize round trips
- **Indexed Lookup**: Primary key lookup on `recipes.id` is O(log n) with automatic B-tree index

### Potential Bottlenecks:
- **AI Metadata JSONB Field**: `raw_response` field could be large for complex AI responses
  - Mitigation: This is acceptable for single record fetch; consider pagination for lists

### Response Size:
- Typical response: 1-5 KB (recipe text + metadata)
- Large responses (>10KB): Rare, only if ingredients/instructions are very detailed
- No pagination needed (single record)

## 9. Implementation Steps

### Step 1: Create Recipes Service (if not exists)
**File**: `/src/lib/services/recipes.service.ts`

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { RecipeResponseDTO } from '@/types';

export class RecipesService {
  /**
   * Fetches a single recipe by ID with AI metadata
   * Returns null if recipe not found or user doesn't own it (RLS filtered)
   */
  static async getRecipeById(
    supabase: SupabaseClient,
    recipeId: string
  ): Promise<RecipeResponseDTO | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ai_metadata:recipe_ai_metadata(*)
      `)
      .eq('id', recipeId)
      .single();

    if (error) {
      // Handle "not found" vs actual errors
      if (error.code === 'PGRST116') {
        // No rows returned (not found or RLS filtered)
        return null;
      }
      // Re-throw actual errors
      throw error;
    }

    // Transform ai_metadata from array to object or null
    return {
      ...data,
      ai_metadata: data.ai_metadata?.[0] || null
    } as RecipeResponseDTO;
  }
}
```

### Step 2: Create Validation Schema
**File**: `/src/pages/api/recipes/[id].ts` (at top of file)

```typescript
import { z } from 'zod';

const RecipeIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});
```

### Step 3: Implement GET Handler
**File**: `/src/pages/api/recipes/[id].ts`

```typescript
import type { APIContext } from 'astro';
import { RecipesService } from '@/lib/services/recipes.service';
import type { RecipeResponseDTO, APIErrorResponse } from '@/types';

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    // Step 3.1: Extract recipe ID from path params
    const recipeId = context.params.id;

    // Step 3.2: Validate UUID format
    const validation = RecipeIdParamSchema.safeParse({ id: recipeId });
    if (!validation.success) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid recipe ID format"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Step 3.3: Get Supabase client from context
    const supabase = context.locals.supabase;

    // Step 3.4: Fetch recipe with AI metadata
    const recipe = await RecipesService.getRecipeById(supabase, validation.data.id);

    // Step 3.5: Handle not found (includes RLS filtered)
    if (!recipe) {
      const errorResponse: APIErrorResponse = {
        error: "Not Found",
        message: "Recipe not found"
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Step 3.6: Return success response
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Step 3.7: Handle unexpected errors
    console.error("Error fetching recipe:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred"
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
```

### Step 5: Test Validation
- Test with invalid UUID format (e.g., "abc123") → expect 400
- Test with valid UUID format → proceed to database query

### Step 6: Test Database Queries
- Test fetching own recipe → expect 200 with recipe data
- Test fetching another user's recipe → expect 404 (RLS filtered)
- Test fetching non-existent recipe → expect 404

### Step 7: Test AI Metadata Join
- Create recipe without AI metadata → expect `ai_metadata: null`
- Create recipe with AI metadata → expect full AI metadata object

### Step 8: Test Error Scenarios
- Simulate database connection error → expect 500
- Test with malformed responses → expect 500

### Step 10: Update Documentation
- Ensure endpoint matches specification in `/documentation/endpoints/get-single-recipe.md`
- Add any implementation notes or deviations
- Update API documentation with actual response examples

## 10. Additional Notes

### Service Layer Benefits:
- **Reusability**: Service can be used by other endpoints (e.g., edit recipe page)
- **Testability**: Business logic separated from HTTP concerns
- **Maintainability**: Database query logic in one place

### Future Enhancements:
- **Recipe Variants**: Include count of AI-generated variants (`parent_recipe_id` references)
