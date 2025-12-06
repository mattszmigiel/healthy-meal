# API Endpoint Implementation Plan: Delete Recipe

## 1. Endpoint Overview

The DELETE recipe endpoint allows authenticated users to permanently delete a recipe they own.

**Key Features**:
- Permanent deletion of user-owned recipes
- Automatic cleanup of associated AI metadata (database-level cascade)
- Returns 204 No Content on success (no response body)

## 2. Request Details

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/recipes/:id`

### Path Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `id` | UUID | Yes | Recipe identifier | Must be valid UUID v4 format |

### Query Parameters

None

### Request Body

None (DELETE requests have no body)

## 3. Used Types

### Validation Schema

```typescript
import { z } from "zod";

const RecipeIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" }),
});
```

### Response Types

- **Success Response**: No DTO needed (204 returns empty body)
- **Error Response**: `APIErrorResponse` from `@/types`

```typescript
import type { APIErrorResponse } from "@/types";
```

### Service Method Signature

```typescript
async deleteRecipe(recipeId: string): Promise<boolean>
```

## 4. Response Details

### Success Response (204 No Content)

**Status Code**: `204 No Content`

**Headers**:
- No Content-Type header (empty body)

**Body**: Empty

**Meaning**: Recipe was successfully deleted

### Error Responses

#### 400 Bad Request - Invalid UUID Format

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

**Headers**: `Content-Type: application/json`

**Cause**: Path parameter `id` is not a valid UUID

#### 404 Not Found - Recipe Not Found

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**Headers**: `Content-Type: application/json`

**Cause**: Recipe doesn't exist

#### 500 Internal Server Error - Database Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Headers**: `Content-Type: application/json`

**Cause**: Unexpected database or server error

## 5. Data Flow

```
1. Request arrives at DELETE /api/recipes/:id
   ↓
3. Extract recipe ID from path params
   ↓
4. Validate UUID format with Zod
   ↓ (if invalid → 400 Bad Request)
   ↓
5. Get Supabase client from context.locals
   ↓
6. Call RecipeService.deleteRecipe(id)
   ↓
7. Service executes DELETE query on recipes table
   │ - RLS policy ensures only owner can delete
   │ - Database CASCADE deletes recipe_ai_metadata automatically
   ↓
8. Check affected row count
   ↓ (if 0 rows → 404 Not Found)
   ↓
9. Return 204 No Content (empty body)
```

### Database Operations

**Primary Operation**:
```sql
DELETE FROM public.recipes
WHERE id = $1
```

**Cascading Effects** (automatic, via FK constraints):
- `recipe_ai_metadata` rows with matching `recipe_id` are automatically deleted (ON DELETE CASCADE)
- Child recipes with `parent_recipe_id` pointing to deleted recipe have their `parent_recipe_id` set to NULL (ON DELETE SET NULL)

## 6. Security Considerations

### Input Validation
- **UUID Validation**: Zod schema validates format before database query
- **Prevents**: SQL injection, malformed queries
- **Error Handling**: Returns 400 with clear message for invalid format

### Data Integrity
- **Cascading Deletes**: Database handles cleanup via FK constraints
- **Transaction Safety**: Single DELETE operation is atomic
- **No Orphaned Data**: AI metadata automatically cleaned up

### Security Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| Unauthorized deletion | RLS policy restricts to owner only |
| Recipe enumeration | 404 returned for both "not found" and "unauthorized" |
| SQL injection | UUID validation + parameterized queries |
| Cascading delete abuse | Intentional design; users should be able to delete their data |

## 7. Performance Considerations

### Database Performance
- **Index Usage**: Primary key index on `recipes.id` (implicit)
- **Query Complexity**: O(1) - single row deletion by primary key

### Optimization Strategies
- **No N+1 Queries**: Single DELETE operation
- **No Additional Reads**: Service doesn't fetch before delete
- **Cascading Handled by DB**: More efficient than application-level cleanup

### Potential Bottlenecks
- **None Expected**: Simple single-row deletion is fast

## 8. Implementation Steps

### Step 1: Add Service Method to RecipeService

**File**: `src/lib/services/recipe.service.ts`

**Action**: Add new method to existing `RecipeService` class

```typescript
/**
 * Deletes a recipe by ID
 * RLS policy ensures only the owner can delete their recipe
 * @param recipeId - The unique identifier of the recipe to delete
 * @returns true if recipe was deleted, false if not found or unauthorized
 * @throws Error if database operation fails (excluding not found)
 */
async deleteRecipe(recipeId: string): Promise<boolean> {
  const { error, count } = await this.supabase
    .from("recipes")
    .delete({ count: "exact" })
    .eq("id", recipeId);

  if (error) {
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }

  // count === 0 means recipe not found or RLS filtered (user doesn't own it)
  // count === 1 means recipe was successfully deleted
  return (count ?? 0) > 0;
}
```

**Notes**:
- Use `{ count: "exact" }` to get affected row count
- Return `false` if count is 0 (not found or RLS filtered)
- Throw error only for actual database failures
- Cascading deletes handled automatically by database

### Step 2: Implement DELETE Handler in API Route

**File**: `src/pages/api/recipes/[id].ts`

**Action**: Add DELETE export to existing file (already has GET handler)

```typescript
/**
 * DELETE /api/recipes/:id
 * Deletes a recipe by ID
 * Returns 204 if successful, 404 if not found or not owned by user (RLS filtered)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Extract recipe ID from path params
    const recipeId = params.id;

    // Validate UUID format
    const validation = RecipeIdParamSchema.safeParse({ id: recipeId });
    if (!validation.success) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid recipe ID format",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Delete recipe via service
    const service = new RecipeService(supabase);
    const deleted = await service.deleteRecipe(validation.data.id);

    // Handle not found (includes RLS filtered)
    if (!deleted) {
      const errorResponse: APIErrorResponse = {
        error: "Not Found",
        message: "Recipe not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response with empty body
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error deleting recipe:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Notes**:
- Reuse existing `RecipeIdParamSchema` from GET handler in same file
- Follow same error handling pattern as GET handler
- 204 response has `null` body and no Content-Type header
- Same 404 message for "not found" and "unauthorized" (security best practice)

### Step 3: Manual Testing Checklist

**Test Cases**:

1. **✓ Happy Path - Delete Own Recipe**
   - Create a recipe as authenticated user
   - DELETE `/api/recipes/:id` with valid UUID
   - Expected: 204 No Content, empty body
   - Verify: Recipe no longer in database, AI metadata also deleted

2. **✓ Invalid UUID Format**
   - DELETE `/api/recipes/not-a-uuid`
   - Expected: 400 Bad Request with error message

3. **✓ Recipe Not Found**
   - DELETE `/api/recipes/00000000-0000-0000-0000-000000000000`
   - Expected: 404 Not Found

4. **✓ Delete Another User's Recipe**
   - Create recipe as User A
   - Attempt to delete as User B
   - Expected: 404 Not Found (RLS filters it out)

5. **✓ Unauthenticated Request**
   - DELETE without auth token
   - Expected: 401 Unauthorized (handled by middleware)

6. **✓ Cascading Delete Verification**
   - Create recipe with AI metadata
   - DELETE the recipe
   - Verify: AI metadata row also deleted from `recipe_ai_metadata` table

7. **✓ Parent Recipe Deletion**
   - Create parent recipe and child recipe (AI variant)
   - DELETE parent recipe
   - Verify: Child recipe's `parent_recipe_id` set to NULL

### Step 4: Integration Points

**Dependencies**:
- Existing `RecipeService` class (add method)
- Existing `RecipeIdParamSchema` validation (reuse from GET handler)
- Existing `APIErrorResponse` type
- Supabase client from `context.locals.supabase`

**No Changes Required**:
- Database schema (already supports DELETE with proper constraints)
- RLS policies (already defined for DELETE operation)
- Middleware (already handles authentication)
- Type definitions (no new types needed)

### Step 5: Documentation

**Update Documentation**:
- Implementation plan already created: `.ai/delete-recipe-endpoint.md`
- API specification already exists: `documentation/endpoints/delete-recipe.md`

**No Additional Docs Needed**: Endpoint is straightforward and follows existing patterns

## 9. Final Verification

### Code Checklist
- [ ] Service method added to `RecipeService`
- [ ] DELETE handler added to `/api/recipes/[id].ts`
- [ ] UUID validation using Zod
- [ ] Proper error responses (400, 404, 500)
- [ ] 204 No Content on success
- [ ] Error logging with console.error
- [ ] Follows project error handling pattern (early returns)

### Security Checklist
- [ ] Authentication required (via middleware)
- [ ] Authorization via RLS (no application-level checks needed)
- [ ] Input validation (UUID format)
- [ ] No information leakage (same 404 for unauthorized and not found)

### Testing Checklist
- [ ] All manual test cases pass
- [ ] Cascading deletes verified
- [ ] RLS policy blocks unauthorized deletes
- [ ] Error responses have correct format
