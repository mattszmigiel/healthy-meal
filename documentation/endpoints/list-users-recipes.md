#### List User's Recipes

**Endpoint**: `GET /api/recipes`

**Description**: Retrieves a paginated list of the authenticated user's recipes.

**Authentication**: Required (JWT token)

**Query Parameters**:
- `page` (integer, optional, default: 1): Page number (1-indexed)
- `limit` (integer, optional, default: 20, max: 100): Number of items per page
- `is_ai_generated` (boolean, optional): Filter by AI-generated recipes (`true`) or original recipes (`false`)
- `parent_recipe_id` (uuid, optional): Filter by parent recipe (to find all AI variations of a recipe)

**Request Body**: None

**Response** (200 OK):
```json
{
  "data": [
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
    },
    {
      "id": "uuid",
      "owner_id": "uuid",
      "title": "Vegan Chocolate Cake (Gluten-Free)",
      "ingredients": "2 cups almond flour, 1 cup coconut sugar...",
      "instructions": "Preheat oven to 350°F...",
      "is_ai_generated": true,
      "parent_recipe_id": "uuid",
      "created_at": "2024-01-16T11:20:00Z",
      "updated_at": "2024-01-16T11:20:00Z",
      "ai_metadata": {
        "recipe_id": "uuid",
        "owner_id": "uuid",
        "model": "anthropic/claude-3.5-sonnet",
        "provider": "openrouter",
        "created_at": "2024-01-16T11:20:00Z",
        "generation_duration": 3500,
        "raw_response": { "..." }
      }
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

**Note**: `ai_metadata` is included in the response if the recipe is AI-generated.

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Invalid query parameters

---