# API Endpoint Implementation Plan: Create Recipe

## 1. Endpoint Overview

This endpoint allows authenticated users to create new recipes in the system. It supports both user-created recipes and AI-generated recipes. When a recipe is AI-generated, the endpoint also stores associated AI metadata including the model used, provider, generation duration, and raw response.

**Purpose**: Create a new recipe with optional AI metadata
**Method**: POST
**URL**: `/api/recipes`
**Authentication**: No authentication

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/recipes`
- **Content-Type**: `application/json`

### Parameters

**Required Fields**:
- `title` (string): Recipe title, max 200 characters
- `ingredients` (string): Recipe ingredients list
- `instructions` (string): Recipe preparation instructions
- `is_ai_generated` (boolean): Flag indicating if recipe was AI-generated

**Optional Fields**:
- `parent_recipe_id` (string | null): UUID of parent recipe (for AI-modified recipes)
- `ai_metadata` (object | null): AI generation metadata (required if `is_ai_generated` is true)
  - `model` (string): AI model name
  - `provider` (string): AI provider name
  - `generation_duration` (number): Generation time in milliseconds
  - `raw_response` (object): Raw AI response as JSONB

### Request Body Example

```json
{
  "title": "Vegan Chocolate Cake",
  "ingredients": "2 cups flour\n1 cup sugar\n...",
  "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n...",
  "is_ai_generated": true,
  "parent_recipe_id": "123e4567-e89b-12d3-a456-426614174000",
  "ai_metadata": {
    "model": "gpt-4",
    "provider": "openai",
    "generation_duration": 2500,
    "raw_response": {
      "id": "chatcmpl-123",
      "choices": [...]
    }
  }
}
```

### Validation Rules

1. **Title Validation**:
   - Required, non-empty string
   - Maximum 200 characters
   - Trim whitespace

2. **Ingredients Validation**:
   - Required, non-empty string
   - Trim whitespace

3. **Instructions Validation**:
   - Required, non-empty string
   - Trim whitespace

4. **Combined Content Length**:
   - `ingredients.length + instructions.length ≤ 10,000` characters

5. **is_ai_generated Validation**:
   - Required boolean value

6. **parent_recipe_id Validation**:
   - Optional, must be valid UUID format if provided
   - Must reference an existing recipe owned by the authenticated user

7. **ai_metadata Validation**:
   - Required if `is_ai_generated` is `true`
   - Must be `null` or omitted if `is_ai_generated` is `false`
   - When provided:
     - `model`: required, non-empty string
     - `provider`: required, non-empty string
     - `generation_duration`: required, positive integer
     - `raw_response`: required, valid JSON object

## 3. Used Types

### Input Type
- **CreateRecipeCommand**: Request body structure (defined in `src/types.ts`)

### Output Type
- **RecipeResponseDTO**: Response structure (alias for `RecipeWithAIMetadataDTO`)

### Supporting Types
- **AIMetadataInput**: AI metadata structure
- **RecipeEntity**: Database recipe entity
- **RecipeAIMetadataEntity**: Database AI metadata entity

### Error Types
- **APIErrorResponse**: Standard error response structure

## 4. Response Details

### Success Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Vegan Chocolate Cake",
  "ingredients": "2 cups flour\n1 cup sugar\n...",
  "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n...",
  "is_ai_generated": true,
  "parent_recipe_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2025-12-02T10:30:00.000Z",
  "updated_at": "2025-12-02T10:30:00.000Z",
  "ai_metadata": {
    "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "123e4567-e89b-12d3-a456-426614174000",
    "model": "gpt-4",
    "provider": "openai",
    "created_at": "2025-12-02T10:30:00.000Z",
    "generation_duration": 2500,
    "raw_response": {
      "id": "chatcmpl-123",
      "choices": [...]
    }
  }
}
```

### Error Responses

**400 Bad Request** - Validation errors:
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    "Title must not exceed 200 characters",
    "Combined ingredients and instructions must not exceed 10,000 characters"
  ]
}
```

**404 Not Found** - Parent recipe not found:
```json
{
  "error": "Not Found",
  "message": "Parent recipe not found or you don't have access to it"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while creating the recipe"
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception**: Astro API route receives POST request
3. **Input Validation**: Validate request body using Zod schema
4. **Parent Recipe Verification** (if applicable): Check parent recipe exists and belongs to user
5. **Service Invocation**: Call `RecipeService.createRecipe()`
6. **Database Transaction**:
   - Insert recipe into `public.recipes` table
   - If AI-generated, insert metadata into `public.recipe_ai_metadata` table
7. **Data Retrieval**: Fetch created recipe with joined AI metadata
8. **Response**: Return 201 with created recipe data

### Detailed Service Flow

```
API Route (src/pages/api/recipes.ts) 
  ↓
[2] Validate request body with Zod schema
  ↓
[3] If parent_recipe_id provided:
    - Query parent recipe by ID and owner_id
    - Return 404 if not found
  ↓
[4] Call RecipeService.createRecipe()
  ↓
RecipeService (src/lib/services/recipe.service.ts)
  ↓
[5] Insert into public.recipes:
    - Generate UUID for id
    - Set owner_id from authenticated user
    - Set title, ingredients, instructions
    - Set is_ai_generated, parent_recipe_id
    - Set created_at, updated_at (auto-generated)
  ↓
[6] If ai_metadata provided:
    - Insert into public.recipe_ai_metadata
    - Set recipe_id (from step 5)
    - Set owner_id
    - Set model, provider, generation_duration, raw_response
  ↓
[7] Query created recipe with left join to recipe_ai_metadata
  ↓
[8] Return RecipeResponseDTO
  ↓
API Route
  ↓
[9] Return Response with status 201 and recipe data
```

### Database Interactions

1. **Query**: Fetch parent recipe (if parent_recipe_id provided)
   ```sql
   SELECT id FROM public.recipes
   WHERE id = $1 AND owner_id = $2
   ```

2. **Insert**: Create recipe record
   ```sql
   INSERT INTO public.recipes (
     owner_id, title, ingredients, instructions,
     is_ai_generated, parent_recipe_id
   )
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *
   ```

3. **Insert**: Create AI metadata record (if applicable)
   ```sql
   INSERT INTO public.recipe_ai_metadata (
     recipe_id, owner_id, model, provider,
     generation_duration, raw_response
   )
   VALUES ($1, $2, $3, $4, $5, $6)
   ```

4. **Query**: Fetch created recipe with AI metadata
   ```sql
   SELECT r.*,
          row_to_json(ram.*) as ai_metadata
   FROM public.recipes r
   LEFT JOIN public.recipe_ai_metadata ram ON r.id = ram.recipe_id
   WHERE r.id = $1
   ```

## 6. Security Considerations

### Authentication & Authorization

3. **Parent Recipe Ownership**:
   - Verify parent recipe exists AND belongs to authenticated user
   - Prevent referencing other users' recipes as parents

### Input Validation & Sanitization

1. **Zod Schema Validation**:
   - Enforce all type constraints at API boundary
   - Validate string lengths before database insertion
   - Validate UUID format for parent_recipe_id

2. **SQL Injection Prevention**:
   - Use Supabase parameterized queries (built-in protection)
   - Never construct raw SQL with user input

3. **XSS Prevention**:
   - Store recipe content as-is in database
   - Frontend must handle output encoding/sanitization
   - No HTML processing on backend

### Data Integrity

1. **Foreign Key Constraints**:
   - Database enforces owner_id → profiles.user_id
   - Database enforces parent_recipe_id → recipes.id
   - Database enforces recipe_id → recipes.id (for AI metadata)

2. **Check Constraints**:
   - Database enforces title length ≤ 200
   - Database enforces ingredients + instructions ≤ 10,000
   - Validate in API layer before database attempt for better error messages

3. **Transactional Consistency**:
   - If AI metadata insert fails, recipe insert should also fail
   - Use Supabase transactions or handle rollback appropriately

## 7. Error Handling

### Error Scenarios & Status Codes

| Scenario | Status Code | Error Response | Handling |
|----------|-------------|----------------|----------|
| Missing required fields | 400 | Validation Error with field details | Zod validation |
| Title exceeds 200 chars | 400 | Validation Error | Zod validation |
| Content exceeds 10,000 chars | 400 | Validation Error | Zod validation |
| Invalid UUID format | 400 | Validation Error | Zod validation |
| is_ai_generated=true but no ai_metadata | 400 | Validation Error | Zod validation |
| is_ai_generated=false but ai_metadata provided | 400 | Validation Error | Zod validation |
| Parent recipe not found | 404 | Not Found | Database query |
| Parent recipe belongs to other user | 404 | Not Found | Database query (hidden by RLS) |
| Database constraint violation | 500 | Internal Server Error | Try-catch, log error |
| Unexpected server error | 500 | Internal Server Error | Try-catch, log error |

### Error Response Structure

All errors follow the `APIErrorResponse` type:

```typescript
{
  error: string;      // Error type/category
  message: string;    // User-friendly message
  details?: string[]; // Optional validation details
}
```

### Error Logging Strategy

1. **Client Errors (4xx)**:
   - Log validation errors at DEBUG level
   - Include user_id and request body (sanitized)
   - No need for stack traces

2. **Server Errors (5xx)**:
   - Log at ERROR level with full stack trace
   - Include user_id, request body, and database error
   - Consider using Supabase logging or external service

3. **Sensitive Data**:
   - Do not log passwords or tokens
   - Sanitize raw_response before logging if it contains sensitive data

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Writes**:
   - Two sequential inserts for AI-generated recipes
   - Consider using Supabase RPC or batch insert if performance issues arise

2. **Parent Recipe Validation**:
   - Additional SELECT query before insert
   - Minimal impact for single-record validation

3. **Response Data Fetch**:
   - LEFT JOIN to fetch AI metadata
   - Indexed on primary keys, should be fast

### Optimization Strategies

1. **Database Indexes**:
   - Primary key indexes (automatic): recipes.id, recipe_ai_metadata.recipe_id
   - Foreign key indexes may be needed: recipes.parent_recipe_id (already planned in db-plan.md)

2. **Query Optimization**:
   - Use single query with LEFT JOIN to fetch recipe + AI metadata
   - Avoid N+1 queries

3. **Caching**:
   - Not applicable for POST endpoint (creates new data)
   - Parent recipe validation could cache user's recipe IDs, but likely premature optimization

4. **Connection Pooling**:
   - Supabase handles connection pooling automatically
   - Ensure proper cleanup of Supabase client instances

### Scalability Notes

- RLS policies add minimal overhead for single-user queries
- Recipe creation is naturally partitioned by user (owner_id)
- No cross-user dependencies or locks
- AI metadata JSONB field allows flexible schema without migrations

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/lib/schemas/recipe.schema.ts`

```typescript
import { z } from "zod";

export const createRecipeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters"),
    ingredients: z
      .string()
      .trim()
      .min(1, "Ingredients are required"),
    instructions: z
      .string()
      .trim()
      .min(1, "Instructions are required"),
    is_ai_generated: z.boolean(),
    parent_recipe_id: z
      .string()
      .uuid("Invalid parent recipe ID format")
      .nullable()
      .optional(),
    ai_metadata: z
      .object({
        model: z.string().min(1, "Model is required"),
        provider: z.string().min(1, "Provider is required"),
        generation_duration: z
          .number()
          .int()
          .positive("Generation duration must be positive"),
        raw_response: z.record(z.any()),
      })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      const totalLength = data.ingredients.length + data.instructions.length;
      return totalLength <= 10000;
    },
    {
      message:
        "Combined ingredients and instructions must not exceed 10,000 characters",
      path: ["ingredients"],
    }
  )
  .refine(
    (data) => {
      if (data.is_ai_generated && !data.ai_metadata) {
        return false;
      }
      return true;
    },
    {
      message: "AI metadata is required when is_ai_generated is true",
      path: ["ai_metadata"],
    }
  )
  .refine(
    (data) => {
      if (!data.is_ai_generated && data.ai_metadata) {
        return false;
      }
      return true;
    },
    {
      message: "AI metadata should not be provided when is_ai_generated is false",
      path: ["ai_metadata"],
    }
  );
```

### Step 2: Create Recipe Service

**File**: `src/lib/services/recipe.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateRecipeCommand,
  RecipeResponseDTO,
} from "@/types";

export class RecipeService {
  /**
   * Creates a new recipe with optional AI metadata
   * @throws Error if database operation fails
   */
  static async createRecipe(
    supabase: SupabaseClient,
    userId: string,
    command: CreateRecipeCommand
  ): Promise<RecipeResponseDTO> {
    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
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
      const { error: metadataError } = await supabase
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
        await supabase.from("recipes").delete().eq("id", recipe.id);
        throw new Error(
          `Failed to create AI metadata: ${metadataError.message}`
        );
      }
    }

    // Fetch complete recipe with AI metadata
    const { data: completeRecipe, error: fetchError } = await supabase
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
      ai_metadata: completeRecipe.ai_metadata?.[0] ?? null,
    };
  }

  /**
   * Validates that parent recipe exists and belongs to user
   * @returns true if valid, false if not found or unauthorized
   */
  static async validateParentRecipe(
    supabase: SupabaseClient,
    userId: string,
    parentRecipeId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", parentRecipeId)
      .eq("owner_id", userId)
      .maybeSingle();

    return !error && data !== null;
  }
}
```

### Step 3: Create API Route

**File**: `src/pages/api/recipes.ts`

```typescript
import type { APIRoute } from "astro";
import { createRecipeSchema } from "@/lib/schemas/recipe.schema";
import { RecipeService } from "@/lib/services/recipe.service";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {

    const body = await context.request.json();
    const validationResult = createRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message);
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid request data",
          details: errors,
        } satisfies APIErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command = validationResult.data;

    // Validate parent recipe if provided
    if (command.parent_recipe_id) {
      const isValid = await RecipeService.validateParentRecipe(
        supabase,
        user.id,
        command.parent_recipe_id
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Parent recipe not found or you don't have access to it",
          } satisfies APIErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create recipe
    const recipe = await RecipeService.createRecipe(
      supabase,
      user.id,
      command
    );

    return new Response(JSON.stringify(recipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating the recipe",
      } satisfies APIErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```