# API Endpoint Implementation Plan: List User's Recipes

## 1. Endpoint Overview

This endpoint retrieves a paginated list of recipes owned by the authenticated user. It supports filtering by AI-generated status and parent recipe ID, allowing users to view all their recipes or specific subsets (e.g., all AI variations of a particular recipe). The endpoint includes AI metadata when available and provides pagination information for efficient data navigation.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/recipes`
- **Parameters**:
  - **Required**: None 
  - **Optional Query Parameters**:
    - `page` (integer, default: 1, min: 1): Page number for pagination (1-indexed)
    - `limit` (integer, default: 20, min: 1, max: 100): Number of items per page
    - `is_ai_generated` (boolean): Filter by AI-generated recipes (true) or original recipes (false)
    - `parent_recipe_id` (uuid): Filter by parent recipe to find all AI variations
- **Request Body**: None

## 3. Used Types

### DTOs (from src/types.ts):
```typescript
// Response type
RecipeListResponseDTO {
  data: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Individual recipe with metadata
RecipeWithAIMetadataDTO = RecipeEntity & {
  ai_metadata: RecipeAIMetadataEntity | null;
}

// Query parameters
RecipeListQueryParams {
  page?: number;
  limit?: number;
  is_ai_generated?: boolean;
  parent_recipe_id?: string;
}

// Error response
APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}
```

### Validation Schema (to be created):
```typescript
// Zod schema for query parameter validation
const RecipeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  is_ai_generated: z.coerce.boolean().optional(),
  parent_recipe_id: z.string().uuid().optional()
});
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "title": "Recipe Title",
      "ingredients": "Ingredients text...",
      "instructions": "Instructions text...",
      "is_ai_generated": false,
      "parent_recipe_id": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "ai_metadata": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### Error Responses:
- **400 Bad Request**: Invalid query parameters
  ```json
  {
    "error": "Bad Request",
    "message": "Invalid query parameters",
    "details": ["page must be a positive integer", "limit must be between 1 and 100"]
  }
  ```

- **500 Internal Server Error**: Server-side errors
  ```json
  {
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
  }
  ```

## 5. Data Flow

1. **Request Reception**: Astro API route receives GET request at `/api/recipes`
3. **Parameter Extraction**: Extract query parameters from URL
4. **Input Validation**: Validate query parameters using Zod schema
5. **Service Invocation**: Call `recipeService.listUserRecipes()` with validated parameters
6. **Database Query**:
   - Query `recipes` table with RLS (automatically filters by `owner_id = auth.uid()`)
   - Apply filters: `is_ai_generated`, `parent_recipe_id` if provided
   - Left join with `recipe_ai_metadata` table
   - Apply pagination: offset = (page - 1) * limit
   - Order by `created_at DESC` (uses existing index)
7. **Count Query**: Execute separate count query for total records with same filters
8. **Response Formatting**:
   - Calculate `total_pages = ceil(total / limit)`
   - Format as `RecipeListResponseDTO`
9. **Response**: Return 200 with JSON response

## 6. Security Considerations

### Input Validation:
- **Type Safety**: Use Zod schema for runtime validation
- **UUID Format**: Validate `parent_recipe_id` is valid UUID
- **Range Limits**: Enforce `limit` max of 100 to prevent resource exhaustion
- **Positive Integers**: Ensure `page` and `limit` are positive integers

### SQL Injection Prevention:
- **Parameterized Queries**: Supabase client uses parameterized queries automatically
- **No Raw SQL**: Use Supabase query builder methods

## 7. Error Handling

### Client Errors (4xx):

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Invalid page (negative, zero, non-integer) | 400 | `{ error: "Bad Request", message: "Invalid query parameters", details: ["page must be a positive integer"] }` |
| Invalid limit (< 1 or > 100) | 400 | `{ error: "Bad Request", message: "Invalid query parameters", details: ["limit must be between 1 and 100"] }` |
| Invalid UUID format for parent_recipe_id | 400 | `{ error: "Bad Request", message: "Invalid query parameters", details: ["parent_recipe_id must be a valid UUID"] }` |
| Invalid boolean for is_ai_generated | 400 | `{ error: "Bad Request", message: "Invalid query parameters", details: ["is_ai_generated must be a boolean"] }` |

### Server Errors (5xx):

| Scenario | Status Code | Response | Logging |
|----------|-------------|----------|---------|
| Database connection failure | 500 | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log full error with stack trace |
| Query execution error | 500 | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log query details and error |
| Unexpected exception | 500 | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log full error context |

### Error Handling Pattern:
```typescript
// In API route
try {
  // Validation
  const validatedParams = RecipeListQuerySchema.parse(queryParams);

  // Service call
  const result = await recipeService.listUserRecipes(supabase, validatedParams);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: "Bad Request",
      message: "Invalid query parameters",
      details: error.errors.map(e => e.message)
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.error("Error listing recipes:", error);
  return new Response(JSON.stringify({
    error: "Internal Server Error",
    message: "An unexpected error occurred"
  }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Performance Considerations

### Pagination Strategy:
- **Offset-Based Pagination**: Simple offset/limit approach suitable for MVP
- **Max Limit Enforcement**: Cap at 100 to prevent large result sets
- **Separate Count Query**: Use efficient count query with same filters
- **Default Limits**: Reasonable default of 20 items balances UX and performance

### Query Optimization:
- **Select Only Required Fields**: Don't use `SELECT *` unnecessarily
- **Minimize Joins**: Single left join for AI metadata is acceptable
- **Filter Early**: Apply `is_ai_generated` and `parent_recipe_id` filters in WHERE clause

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/lib/schemas/recipeQuerySchemas.ts` (new file)
```typescript
import { z } from "zod";

export const RecipeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  is_ai_generated: z.coerce.boolean().optional(),
  parent_recipe_id: z.string().uuid().optional()
});
```

### Step 2: Implement Service Method
**File**: `src/lib/services/recipe.service.ts`

Create or update the service with:
```typescript
async listUserRecipes(
  supabase: SupabaseClient,
  params: RecipeListQueryParams
): Promise<RecipeListResponseDTO>
```

**Implementation details**:
- Extract validated parameters with defaults
- Build base query on `recipes` table (RLS automatically applies)
- Apply optional filters: `is_ai_generated`, `parent_recipe_id`
- Left join with `recipe_ai_metadata` on `recipe_id`
- Apply ordering: `created_at DESC`
- Calculate offset: `(page - 1) * limit`
- Apply limit
- Execute data query
- Execute separate count query with same filters
- Calculate `total_pages = Math.ceil(total / limit)`
- Format and return `RecipeListResponseDTO`

### Step 3: Create API Route Handler
**File**: `src/pages/api/recipes.ts`
USE DEFAULT_USER for now
```typescript
export const prerender = false;

export const GET: APIRoute = async (context) => {
  // 1. Extract Supabase client from context
  const supabase = context.locals.supabase;

  // 3. Extract and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    is_ai_generated: url.searchParams.get("is_ai_generated"),
    parent_recipe_id: url.searchParams.get("parent_recipe_id")
  };

  // 4. Validate with Zod schema
  try {
    const validatedParams = RecipeListQuerySchema.parse(queryParams);

    // 5. Call service method
    const result = await recipeService.listUserRecipes(supabase, validatedParams);

    // 6. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // 7. Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: "Bad Request",
        message: "Invalid query parameters",
        details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`)
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 8. Handle unexpected errors
    console.error("Error listing recipes:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
```

### Step 4: Update Service Implementation
**File**: `src/lib/services/recipe.service.ts`

Implement the service method:
```typescript
async listUserRecipes(
  supabase: SupabaseClient,
  params: RecipeListQueryParams
): Promise<RecipeListResponseDTO> {
  const { page = 1, limit = 20, is_ai_generated, parent_recipe_id } = params;
  const offset = (page - 1) * limit;

  // Build base query
  let dataQuery = supabase
    .from("recipes")
    .select(`
      *,
      ai_metadata:recipe_ai_metadata(*)
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (is_ai_generated) {
    dataQuery = dataQuery.eq("is_ai_generated", is_ai_generated);
  }

  if (parent_recipe_id) {
    dataQuery = dataQuery.eq("parent_recipe_id", parent_recipe_id);
  }

  // Apply pagination
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute data query
  const { data, error } = await dataQuery;

  if (error) {
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }

  // Build count query with same filters
  let countQuery = supabase
    .from("recipes")
    .select("*", { count: "exact", head: true });

  if (is_ai_generated !== undefined) {
    countQuery = countQuery.eq("is_ai_generated", is_ai_generated);
  }

  if (parent_recipe_id) {
    countQuery = countQuery.eq("parent_recipe_id", parent_recipe_id);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new Error(`Failed to count recipes: ${countError.message}`);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data as RecipeWithAIMetadataDTO[],
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages
    }
  };
}
```

### Step 5: Test the Implementation

**Manual Testing**:
2. Test with no parameters (should use defaults: page=1, limit=20)
3. Test with custom page and limit
4. Test with is_ai_generated=true filter
5. Test with is_ai_generated=false filter
6. Test with valid parent_recipe_id
7. Test with invalid query parameters (negative page, limit > 100, invalid UUID)
8. Test pagination metadata (total, total_pages calculation)
9. Test ordering (should be newest first)
10. Test that AI metadata is included when present

### Step 6: Documentation Updates

Update any relevant API documentation to reflect:
- Endpoint availability
- Query parameter options
- Response structure
- Error codes and messages
