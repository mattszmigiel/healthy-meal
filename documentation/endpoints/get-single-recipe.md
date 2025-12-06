#### Get Single Recipe

**Endpoint**: `GET /api/recipes/:id`

**Description**: Retrieves a single recipe by ID.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (uuid): Recipe ID

**Query Parameters**: None

**Request Body**: None

**Response** (200 OK):
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
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Recipe not found or user doesn't own the recipe
- `400 Bad Request`: Invalid UUID format

---

### 4.1 Validation Rules

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
