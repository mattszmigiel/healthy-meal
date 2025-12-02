#### Update Dietary Preferences

**Endpoint**: `PUT /api/profile/dietary-preferences`

**Description**: Updates the authenticated user's dietary preferences.

**Authentication**: Required (JWT token)

**Query Parameters**: None

**Request Body**:
```json
{
  "diet_type": "vegan",
  "allergies": ["gluten", "dairy"],
  "disliked_ingredients": ["cilantro", "olives"]
}
```

**Field Details**:
- `diet_type` (string, optional): One of: `omnivore`, `vegetarian`, `vegan`, `pescatarian`, `keto`, `paleo`, `low_carb`, `low_fat`, `mediterranean`, `other`, or `null`
- `allergies` (array of strings, optional): List of allergies/intolerances
- `disliked_ingredients` (array of strings, optional): List of ingredients the user dislikes

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

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Invalid input data (e.g., invalid diet_type, non-array for allergies)
- `404 Not Found`: Dietary preferences not found

---

#### Dietary Preferences Validation

**Field**: `diet_type`
- Required: No
- Type: String (ENUM)
- Allowed values: `omnivore`, `vegetarian`, `vegan`, `pescatarian`, `keto`, `paleo`, `low_carb`, `low_fat`, `mediterranean`, `other`, or `null`

**Field**: `allergies`
- Required: No
- Type: Array of strings
- Validation: Each element must be a non-empty string

**Field**: `disliked_ingredients`
- Required: No
- Type: Array of strings
- Validation: Each element must be a non-empty string
