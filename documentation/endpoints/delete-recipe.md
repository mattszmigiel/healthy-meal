#### Delete Recipe

**Endpoint**: `DELETE /api/recipes/:id`

**Description**: Deletes a recipe.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (uuid): Recipe ID

**Query Parameters**: None

**Request Body**: None

**Response** (204 No Content): Empty body

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Recipe not found or user doesn't own the recipe
- `400 Bad Request`: Invalid UUID format
