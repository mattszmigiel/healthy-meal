#### Get Dietary Preferences

**Endpoint**: `GET /api/profile/dietary-preferences`

**Description**: Retrieves the authenticated user's dietary preferences.

**Query Parameters**: None

**Request Body**: None

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "diet_type": "vegan",
  "allergies": ["gluten", "dairy"],
  "disliked_ingredients": ["cilantro", "olives"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

**Note**: `diet_type`, `allergies`, and `disliked_ingredients` may be `null` if not set.

**Error Responses**:
- `404 Not Found`: Dietary preferences not found (should not occur due to trigger)
