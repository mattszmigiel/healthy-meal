#### Preview AI Recipe Modification

**Endpoint**: `POST /api/recipes/:id/ai-preview`

**Description**: Generates an AI-modified version of a recipe based on the user's dietary preferences. The modified recipe is not saved automatically; the user can review it and choose to save it.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (uuid): Recipe ID to modify

**Query Parameters**: None

**Request Body**: None (uses the recipe content and user's dietary preferences automatically)

**Example Request**:
```bash
POST /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview
Content-Type: application/json
Authorization: Bearer {your-jwt-token}
```

**Example with curl**:
```bash
curl -X POST \
  'http://localhost:3000/api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-jwt-token'
```

**Response** (200 OK):
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
    "raw_response": {
      "id": "gen-123",
      "model": "anthropic/claude-3.5-sonnet",
      "choices": [
        {
          "message": {
            "content": "..."
          }
        }
      ]
    }
  },
  "applied_preferences": {
    "diet_type": "vegan",
    "allergies": ["gluten"],
    "disliked_ingredients": []
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Recipe not found or user doesn't own the recipe
- `400 Bad Request`:
  - Invalid UUID format
  - User has no dietary preferences set
  ```json
  {
    "error": "No dietary preferences",
    "message": "Please set your dietary preferences before modifying recipes.",
    "action": "Navigate to profile settings to add dietary preferences"
  }
  ```
- `503 Service Unavailable`: AI service is unavailable
  ```json
  {
    "error": "AI service unavailable",
    "message": "The AI service is temporarily unavailable. Please try again later."
  }
  ```
- `504 Gateway Timeout`: AI service timeout (>120 seconds)
  ```json
  {
    "error": "Request timeout",
    "message": "The AI modification took too long. Please try again."
  }
  ```
- `429 Too Many Requests`: Rate limit exceeded
  ```json
  {
    "error": "Rate limit exceeded",
    "message": "You've made too many AI modification requests. Please wait before trying again.",
    "retry_after": 60
  }
  ```

**Rate Limiting**: 10 requests per minute per user

**Important Notes**:
- This endpoint does NOT save the modified recipe to the database
- The AI-generated preview is temporary and only returned in the response
- Users must explicitly save the modified recipe using `POST /api/recipes` if they want to keep it
- Rate limiting is enforced to prevent abuse (10 requests/minute per user)
- All dietary preferences (diet_type, allergies, disliked_ingredients) are applied to the modification
- At least one dietary preference must be set (cannot be all null/empty)

**Example Use Case Flow**:
1. User views their original recipe
2. User clicks "Adapt to my diet" button
3. Frontend calls this endpoint to preview modifications
4. User reviews the AI-modified version
5. If satisfied, user clicks "Save" → Frontend calls `POST /api/recipes` with the modified data
6. If not satisfied, user can request another preview or edit manually

#### Recipe Validation

**Field**: `title`
- Required: Yes
- Type: String
- Max length: 200 characters
- Validation: Non-empty, trimmed

**Field**: `ingredients`
- Required: Yes
- Type: String
- Max length: Combined with `instructions` must not exceed 10,000 characters
- Validation: Non-empty, trimmed

**Field**: `instructions`
- Required: Yes
- Type: String
- Max length: Combined with `ingredients` must not exceed 10,000 characters
- Validation: Non-empty, trimmed

**Field**: `is_ai_generated`
- Required: No
- Type: Boolean
- Default: false

**Field**: `parent_recipe_id`
- Required: No
- Type: UUID
- Validation: Must reference an existing recipe owned by the user (if provided)

**Field**: `ai_metadata`
- Required: If `is_ai_generated` is true
- Type: Object
- Validation: Must contain `model`, `provider`, `generation_duration`, `raw_response`

**Endpoint**: `POST /api/recipes/:id/ai-preview`

**Logic**:
1. Validate recipe ID is valid UUID format
2. Check rate limit (10 requests/minute per user)
3. Fetch recipe by ID and validate ownership
4. Fetch user's dietary preferences
5. Validate at least one preference is set (not all null/empty)
6. Call mocked AI service to generate modifications
7. Return modified recipe with metadata (NOT saved to database)
8. Log all operations (success, warnings, errors)

**Implementation Details**:
- Uses in-memory rate limiting (resets on server restart)
- Mocked AI service simulates 1-3 second latency
- Rule-based substitutions for common dietary restrictions
- No actual OpenRouter API integration (mocked for MVP)
- All errors logged with structured logging (timestamp, level, context)

---

## Complete Usage Examples

### Example 1: Successful AI Preview Generation

**Prerequisites**:
```bash
# 1. User has dietary preferences set
GET /api/profile/dietary-preferences
Response:
{
  "user_id": "ce4988b8-5c26-4741-b5c3-fd372088ed89",
  "diet_type": "vegan",
  "allergies": ["gluten", "dairy"],
  "disliked_ingredients": ["mushrooms"],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}

# 2. User has a recipe
GET /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Response:
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Chocolate Cake",
  "ingredients": "2 cups flour, 1 cup sugar, 3 eggs, 1 cup milk, 1/2 cup butter",
  "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Beat eggs and milk\n4. Combine and bake for 30 minutes",
  "is_ai_generated": false,
  "parent_recipe_id": null,
  "owner_id": "ce4988b8-5c26-4741-b5c3-fd372088ed89",
  "created_at": "2025-01-10T08:00:00Z",
  "updated_at": "2025-01-10T08:00:00Z",
  "ai_metadata": null
}
```

**Request**:
```bash
POST /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview
```

**Response** (200 OK):
```json
{
  "original_recipe": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Chocolate Cake",
    "ingredients": "2 cups flour, 1 cup sugar, 3 eggs, 1 cup milk, 1/2 cup butter",
    "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Beat eggs and milk\n4. Combine and bake for 30 minutes"
  },
  "modified_recipe": {
    "title": "Chocolate Cake (Vegan, Gluten-Free, Dairy-Free)",
    "ingredients": "2 cups almond flour, 1 cup sugar, 3 flax eggs, 1 cup almond milk, 1/2 cup vegan butter",
    "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Prepare the flax eggs (1 tbsp flaxseed + 3 tbsp water per egg) and almond milk\n4. Combine and bake for 30 minutes\n\nNote: Ensure all cooking surfaces and utensils are free from cross-contamination with allergens.",
    "explanation": "This recipe has been modified based on your dietary preferences.\n\nKey changes:\n- Modified to be vegan\n- Removed allergens: gluten, dairy\n- Replaced disliked ingredients: mushrooms"
  },
  "ai_metadata": {
    "model": "anthropic/claude-3.5-sonnet",
    "provider": "openrouter",
    "generation_duration": 2347,
    "raw_response": {
      "id": "gen-1705315234567-abc123",
      "model": "anthropic/claude-3.5-sonnet",
      "created": 1705315234,
      "object": "chat.completion",
      "choices": [
        {
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "{\"title\":\"Chocolate Cake (Vegan, Gluten-Free, Dairy-Free)\",\"ingredients\":\"...\",\"instructions\":\"...\",\"explanation\":\"...\"}"
          },
          "finish_reason": "stop"
        }
      ],
      "usage": {
        "prompt_tokens": 450,
        "completion_tokens": 380,
        "total_tokens": 830
      }
    }
  },
  "applied_preferences": {
    "diet_type": "vegan",
    "allergies": ["gluten", "dairy"],
    "disliked_ingredients": ["mushrooms"]
  }
}
```

**Saving the Modified Recipe**:
```bash
POST /api/recipes
Content-Type: application/json

{
  "title": "Chocolate Cake (Vegan, Gluten-Free, Dairy-Free)",
  "ingredients": "2 cups almond flour, 1 cup sugar, 3 flax eggs, 1 cup almond milk, 1/2 cup vegan butter",
  "instructions": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Prepare the flax eggs (1 tbsp flaxseed + 3 tbsp water per egg) and almond milk\n4. Combine and bake for 30 minutes\n\nNote: Ensure all cooking surfaces and utensils are free from cross-contamination with allergens.",
  "is_ai_generated": true,
  "parent_recipe_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ai_metadata": {
    "model": "anthropic/claude-3.5-sonnet",
    "provider": "openrouter",
    "generation_duration": 2347,
    "raw_response": { /* full raw_response from preview */ }
  }
}
```

---

### Example 2: Error - No Dietary Preferences

**Request**:
```bash
POST /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview
```

**Response** (400 Bad Request):
```json
{
  "error": "No dietary preferences",
  "message": "Please set your dietary preferences before modifying recipes.",
  "action": "Navigate to profile settings to add dietary preferences"
}
```

**Solution**:
```bash
# Set dietary preferences first
PUT /api/profile/dietary-preferences
Content-Type: application/json

{
  "diet_type": "vegetarian",
  "allergies": [],
  "disliked_ingredients": []
}
```

---

### Example 3: Error - Rate Limit Exceeded

**Scenario**: User makes 11 requests within 1 minute

**Request** (11th request):
```bash
POST /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview
```

**Response** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "message": "You've made too many AI modification requests. Please wait before trying again.",
  "retry_after": 42
}
```

**Response Headers**:
```
Retry-After: 42
```

**Solution**: Wait 42 seconds (or value in `retry_after`) before retrying

---

### Example 4: Frontend Integration (React)

```typescript
import type { AIPreviewResponseDTO } from '@/types';

async function generateAIPreview(recipeId: string): Promise<AIPreviewResponseDTO> {
  const response = await fetch(`/api/recipes/${recipeId}/ai-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();

    // Handle specific errors
    if (response.status === 400 && error.error === 'No dietary preferences') {
      // Redirect to preferences page
      window.location.href = '/profile/preferences';
      throw new Error('Please set dietary preferences first');
    }

    if (response.status === 429) {
      // Show retry message
      const retryAfter = error.retry_after;
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds`);
    }

    if (response.status === 404) {
      throw new Error('Recipe not found');
    }

    throw new Error(error.message || 'Failed to generate AI preview');
  }

  return response.json();
}

// Usage in component
function RecipeDetailPage({ recipeId }: { recipeId: string }) {
  const [preview, setPreview] = useState<AIPreviewResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateAIPreview(recipeId);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModified = async () => {
    if (!preview) return;

    await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        title: preview.modified_recipe.title,
        ingredients: preview.modified_recipe.ingredients,
        instructions: preview.modified_recipe.instructions,
        is_ai_generated: true,
        parent_recipe_id: preview.original_recipe.id,
        ai_metadata: preview.ai_metadata,
      }),
    });

    // Redirect to new recipe or show success message
  };

  return (
    <div>
      {/* Original recipe display */}
      <button onClick={handleGeneratePreview} disabled={loading}>
        {loading ? 'Generating...' : 'Adapt to My Diet'}
      </button>

      {error && <div className="error">{error}</div>}

      {preview && (
        <div>
          <h3>Modified Recipe</h3>
          <p><strong>Title:</strong> {preview.modified_recipe.title}</p>
          <p><strong>Explanation:</strong> {preview.modified_recipe.explanation}</p>
          {/* Display modified ingredients and instructions */}

          <button onClick={handleSaveModified}>Save This Recipe</button>
          <button onClick={() => setPreview(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing & Debugging

### Verify Rate Limiting
```bash
# Quick test script to trigger rate limit
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/recipes/{recipe-id}/ai-preview
  echo -e "\n---"
done
```

### Check Logs
Logs are output in structured JSON format:

**Success Log**:
```json
{
  "timestamp": "2025-12-07T15:30:45.123Z",
  "level": "info",
  "message": "AI preview generation completed",
  "context": {
    "user_id": "ce4988b8-5c26-4741-b5c3-fd372088ed89",
    "endpoint": "/api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/ai-preview",
    "duration_ms": 2347
  }
}
```

**Error Log**:
```json
{
  "timestamp": "2025-12-07T15:31:22.456Z",
  "level": "error",
  "message": "Database error",
  "context": {
    "user_id": "ce4988b8-5c26-4741-b5c3-fd372088ed89",
    "recipe_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "error_stack": "Error: Database connection failed\n  at..."
  }
}
```

---

## Related Endpoints

- `GET /api/profile/dietary-preferences` - View current dietary preferences
- `PUT /api/profile/dietary-preferences` - Update dietary preferences
- `POST /api/recipes` - Save a new recipe (including AI-modified ones)
- `GET /api/recipes/:id` - View a specific recipe
- `GET /api/recipes` - List all recipes with filtering
