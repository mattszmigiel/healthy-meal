# API Endpoint Implementation Plan: AI Recipe Preview

## 1. Endpoint Overview

**Purpose**: Generate an AI-modified version of a recipe based on the user's dietary preferences without saving it to the database. This allows users to preview the AI modifications and decide whether to save the modified recipe.

**Key Characteristics**:
- Preview-only functionality (no database writes)
- Uses authenticated user's dietary preferences automatically
- Returns both original and modified recipe for comparison
- Includes AI metadata for transparency
- Rate-limited to prevent abuse (10 requests/minute per user)

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/recipes/:id/ai-preview`

### Parameters

**Path Parameters**:
- `id` (UUID, required): The ID of the recipe to modify

**Query Parameters**: None

**Request Body**: None (uses recipe content and user's dietary preferences automatically)

## 3. Used Types

### Response Types
- `AIPreviewResponseDTO` - Main response structure
- `OriginalRecipePreview` - Simplified original recipe info
- `ModifiedRecipePreview` - AI-modified recipe with explanation
- `AIMetadataInput` - AI generation metadata
- `AppliedDietaryPreferences` - Shows which preferences were applied

### Error Response Types
- `NoPreferencesErrorResponse` - For missing dietary preferences (400)
- `RateLimitErrorResponse` - For rate limit exceeded (429)
- `APIErrorResponse` - General error response

### Database Entity Types
- `RecipeEntity` - For fetching the original recipe
- `DietaryPreferencesEntity` - For fetching user preferences

## 4. Response Details

### Success Response (200 OK)
```json
{
  "original_recipe": {
    "id": "uuid",
    "title": "Chocolate Cake",
    "ingredients": "2 cups flour, 1 cup sugar, 3 eggs...",
    "instructions": "Preheat oven to 350°F..."
  },
  "modified_recipe": {
    "title": "Chocolate Cake (Vegan, Gluten-Free)",
    "ingredients": "2 cups almond flour, 1 cup coconut sugar, 3 flax eggs...",
    "instructions": "Preheat oven to 350°F...",
    "explanation": "Modified to be vegan and gluten-free. Key changes:\n- Replaced wheat flour with almond flour\n- Replaced eggs with flax eggs\n- Replaced sugar with coconut sugar"
  },
  "ai_metadata": {
    "model": "anthropic/claude-3.5-sonnet",
    "provider": "openrouter",
    "generation_duration": 3500,
    "raw_response": { /* full AI response */ }
  },
  "applied_preferences": {
    "diet_type": "vegan",
    "allergies": ["gluten"],
    "disliked_ingredients": []
  }
}
```

### Error Responses

**400 Bad Request - Invalid UUID**:
```json
{
  "error": "Invalid input",
  "message": "Recipe ID must be a valid UUID"
}
```

**400 Bad Request - No Dietary Preferences**:
```json
{
  "error": "No dietary preferences",
  "message": "Please set your dietary preferences before modifying recipes.",
  "action": "Navigate to profile settings to add dietary preferences"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found**:
```json
{
  "error": "Not found",
  "message": "Recipe not found or you don't have access to it"
}
```

**429 Too Many Requests**:
```json
{
  "error": "Rate limit exceeded",
  "message": "You've made too many AI modification requests. Please wait before trying again.",
  "retry_after": 60
}
```

**503 Service Unavailable**:
```json
{
  "error": "AI service unavailable",
  "message": "The AI service is temporarily unavailable. Please try again later."
}
```

**504 Gateway Timeout**:
```json
{
  "error": "Request timeout",
  "message": "The AI modification took too long. Please try again."
}
```

## 5. Data Flow

1. **Request Reception**
   - Middleware validates JWT token and extracts user ID
   - Endpoint receives recipe ID from path parameter

2. **Input Validation**
   - Validate recipe ID is valid UUID format using Zod

3. **Rate Limiting Check**
   - Check if user has exceeded rate limit (10 requests/minute)
   - Return 429 if limit exceeded

4. **Recipe Fetch**
   - Query `recipes` table by ID
   - Validate recipe exists
   - Validate recipe belongs to authenticated user (owner_id = user_id)
   - Return 404 if not found or not owned by user

5. **Dietary Preferences Fetch**
   - Query `dietary_preferences` table for user
   - Validate preferences exist and are not all null/empty
   - Return 400 with NoPreferencesErrorResponse if no preferences set

6. **AI Service Call** (Mocked for MVP)
   - Format prompt with original recipe and dietary preferences
   - Call mocked AI service (simulates OpenRouter API call)
   - Mock service returns realistic AI-modified recipe
   - Handle timeout (>120s) with 504 error
   - Handle service unavailability with 503 error

7. **Response Formatting**
   - Format original recipe as OriginalRecipePreview
   - Format modified recipe as ModifiedRecipePreview
   - Create AI metadata object
   - Create applied preferences object
   - Return AIPreviewResponseDTO with 200 status

8. **Error Logging**
   - Log all errors with context (user_id, recipe_id, error message, timestamp)
   - Use application-level logging (not database)

## 6. Security Considerations

### Input Validation
- **UUID Format**: Validate recipe ID is valid UUID (prevent injection)
- **No User Input**: No request body to validate (uses stored preferences)

### Rate Limiting
- **Implementation**: In-memory rate limiter for MVP
- **Limit**: 10 requests per minute per user
- **Storage**: Map<user_id, { count: number, resetAt: timestamp }>
- **Reset**: Rolling window (resets 60 seconds after first request)

### AI Service Security
- **API Key Management**: Store OpenRouter API key in environment variables
- **Request Timeout**: Limit to 120 seconds to prevent hanging requests
- **Response Validation**: Validate AI response structure before using

## 7. Error Handling

### Error Handling Pattern
Use early returns with guard clauses:

```typescript
// 1. Validate input
if (!isValidUUID(id)) {
  return new Response(JSON.stringify({...}), { status: 400 });
}

// 2. Check rate limit
if (isRateLimited(userId)) {
  return new Response(JSON.stringify({...}), { status: 429 });
}

// 3. Fetch and validate recipe
const recipe = await fetchRecipe(id, userId);
if (!recipe) {
  return new Response(JSON.stringify({...}), { status: 404 });
}

// 4. Fetch and validate preferences
const preferences = await fetchPreferences(userId);
if (isEmptyPreferences(preferences)) {
  return new Response(JSON.stringify({...}), { status: 400 });
}

// 5. Call AI service with try-catch
try {
  const aiResponse = await callAIService(...);
  // Happy path - return success
} catch (error) {
  // Handle specific errors (timeout, service unavailable, etc.)
}
```

### Error Scenarios

| Scenario | Status Code | Response Type | Action |
|----------|-------------|---------------|--------|
| Invalid UUID format | 400 | APIErrorResponse | Return validation error |
| Recipe not found | 404 | APIErrorResponse | Return generic not found |
| Recipe not owned by user | 404 | APIErrorResponse | Return generic not found (security) |
| No dietary preferences | 400 | NoPreferencesErrorResponse | Prompt user to set preferences |
| Rate limit exceeded | 429 | RateLimitErrorResponse | Include retry_after header |
| AI service timeout | 504 | APIErrorResponse | Suggest retry |
| AI service unavailable | 503 | APIErrorResponse | Suggest retry later |
| Database error | 500 | APIErrorResponse | Log error, return generic message |

### Logging Strategy
- **Info**: Successful AI preview generation (user_id, recipe_id, duration)
- **Warning**: Rate limit hits, no preferences set
- **Error**: Database errors, AI service failures, timeouts
- **Context**: Always include user_id, recipe_id, timestamp, error stack

## 8. Performance Considerations

### Potential Bottlenecks
1. **AI Service Call**: Most significant latency (2-5 seconds expected)
2. **Database Queries**: Two queries (recipe + preferences) - it can be done with one query using join
3. **Rate Limiting**: In-memory map lookups (negligible)

### Optimization Strategies
1. **Database Queries**:
   - Use indexes: `idx_recipes_owner_created_at_desc` already exists
   - Fetch recipe and preferences in parallel (Promise.all)
   - Select only needed columns (id, title, ingredients, instructions, owner_id)

2. **AI Service**:
   - Set reasonable timeout (120s as specified)
   - For future: Consider caching similar requests
   - For future: Implement request queuing for high load

3. **Rate Limiting**:
   - In-memory storage for MVP (fast)
   - For future: Use Redis for distributed rate limiting
   - Periodic cleanup of expired entries (every 5 minutes)

4. **Response Size**:
   - AI responses can be large (raw_response field)
   - Consider compressing responses for clients that support it

### Monitoring Metrics
- Average AI generation duration
- Rate limit hit rate
- Error rates by type
- P95/P99 latencies

## 9. Implementation Steps

### Step 1: Create Validation Schema
**File**: `src/lib/schemas/ai-preview.schema.ts`
```typescript
import { z } from 'zod';

export const recipeIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Recipe ID must be a valid UUID' })
});
```

### Step 2: Create Rate Limiter Utility
**File**: `src/lib/utils/rate-limiter.ts`
- Implement in-memory rate limiter
- Store user request counts with timestamp
- Implement cleanup for expired entries
- Export `checkRateLimit(userId: string): { allowed: boolean, retryAfter?: number }`

### Step 3: Create Mocked AI Service
**File**: `src/lib/services/mocked-ai.service.ts`
- Create function that simulates AI response
- Accept recipe and preferences as input
- Return realistic modified recipe with explanation
- Simulate realistic latency (1-3 seconds)
- Include mock metadata (model, provider, generation_duration, raw_response)
- Handle timeout simulation for testing

### Step 4: Create AI Preview Service
**File**: `src/lib/services/ai-preview.service.ts`

**Functions**:
```typescript
// Main service function
export async function generateAIPreview(
  recipeId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<AIPreviewResponseDTO>

// Helper: Fetch recipe with ownership validation
async function fetchRecipeWithValidation(
  recipeId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<RecipeEntity | null>

// Helper: Fetch and validate dietary preferences
async function fetchAndValidatePreferences(
  userId: string,
  supabase: SupabaseClient
): Promise<DietaryPreferencesEntity | null>

// Helper: Check if preferences are empty
function hasValidPreferences(
  preferences: DietaryPreferencesEntity
): boolean

// Helper: Format response
function formatPreviewResponse(
  originalRecipe: RecipeEntity,
  modifiedRecipe: any,
  aiMetadata: any,
  preferences: DietaryPreferencesEntity
): AIPreviewResponseDTO
```

**Logic**:
1. Fetch recipe and preferences in parallel (Promise.all)
2. Validate recipe exists and belongs to user
3. Validate preferences exist and are not empty
4. Call mocked AI service
5. Format and return response

### Step 5: Create API Endpoint
**File**: `src/pages/api/recipes/[id]/ai-preview.ts`

**Structure**:
```typescript
import type { APIRoute } from 'astro';
import { recipeIdParamSchema } from '@/lib/schemas/ai-preview.schema';
import { generateAIPreview } from '@/lib/services/ai-preview.service';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export const prerender = false;

export const POST: APIRoute = async (context) => {

  // 2. Validate recipe ID parameter
  // 3. Check rate limit
  // 4. Call service layer
  // 5. Handle errors with appropriate status codes
  // 6. Return formatted response
};
```

**Error Handling**:
- Use try-catch for service call
- Use early returns for validation failures
- Map service errors to appropriate HTTP status codes
- Log all errors with context

### Step 6: Add Error Response Helpers
**File**: `src/lib/utils/api-responses.ts`
```typescript
export function errorResponse(
  status: number,
  error: string,
  message: string,
  additionalFields?: Record<string, any>
): Response

export function noPreferencesResponse(): Response
export function rateLimitResponse(retryAfter: number): Response
export function notFoundResponse(): Response
export function unauthorizedResponse(): Response
export function serviceUnavailableResponse(): Response
export function timeoutResponse(): Response
```

### Step 7: Add Logging Utility
**File**: `src/lib/utils/logger.ts` (if not exists)
- Implement structured logging
- Include timestamp, level, context, message
- Export functions: `logger.info()`, `logger.warn()`, `logger.error()`

### Step 8: Testing Checklist
- [ ] Test with valid recipe ID and preferences
- [ ] Test with invalid UUID format
- [ ] Test with non-existent recipe ID
- [ ] Test with recipe owned by different user
- [ ] Test with no dietary preferences set
- [ ] Test with empty dietary preferences (all null)
- [ ] Test rate limiting (11th request should fail)
- [ ] Test rate limit reset after 60 seconds
- [ ] Test AI service timeout simulation
- [ ] Test AI service unavailability simulation
- [ ] Test unauthenticated request (should be handled by middleware)
- [ ] Verify response structure matches AIPreviewResponseDTO
- [ ] Verify no database writes occur
- [ ] Test parallel requests from same user (rate limiting)
- [ ] Verify error logging for all error scenarios

