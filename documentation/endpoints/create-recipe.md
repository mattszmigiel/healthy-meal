#### Create Recipe

**Endpoint**: `POST /api/recipes`

**Description**: Creates a new recipe (original or AI-generated).

**Authentication**: No

**Query Parameters**: None

**Request Body**:
```json
{
  "title": "Vegan Chocolate Cake",
  "ingredients": "2 cups flour, 1 cup sugar...",
  "instructions": "Preheat oven to 350°F...",
  "is_ai_generated": false,
  "parent_recipe_id": null,
  "ai_metadata": null
}
```

**For AI-Generated Recipes**:
```json
{
  "title": "Vegan Chocolate Cake (Gluten-Free)",
  "ingredients": "2 cups almond flour, 1 cup coconut sugar...",
  "instructions": "Preheat oven to 350°F...",
  "is_ai_generated": true,
  "parent_recipe_id": "uuid",
  "ai_metadata": {
    "model": "anthropic/claude-3.5-sonnet",
    "provider": "openrouter",
    "generation_duration": 3500,
    "raw_response": { "..." }
  }
}
```

**Field Details**:
- `title` (string, required): Recipe title (max 200 characters)
- `ingredients` (string, required): Recipe ingredients in text format
- `instructions` (string, required): Recipe instructions in text format
- Combined length of `ingredients` and `instructions` must not exceed 10,000 characters
- `is_ai_generated` (boolean, optional, default: false): Whether this is an AI-generated recipe
- `parent_recipe_id` (uuid, optional): ID of the original recipe if this is an AI modification
- `ai_metadata` (object, optional): Required if `is_ai_generated` is true

**Response** (201 Created):
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

**Error Responses**:
- `400 Bad Request`: Invalid input data (validation errors)
  ```json
  {
    "error": "Validation failed",
    "details": [
      "Title must not exceed 200 characters",
      "Combined ingredients and instructions must not exceed 10,000 characters"
    ]
  }
  ```