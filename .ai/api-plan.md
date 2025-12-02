# REST API Plan - HealthyMeal Application

## 1. Resources

The API is organized around the following main resources:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Profile | `public.profiles` | User profile information (one-to-one with auth.users) |
| Dietary Preferences | `public.dietary_preferences` | User's dietary restrictions and preferences |
| Recipes | `public.recipes` | User-created and AI-modified recipes |
| AI Metadata | `public.recipe_ai_metadata` | Metadata about AI-generated recipes |

**Note**: Authentication is handled by Supabase Auth (`auth.users`), which manages user registration, login, password recovery, and sessions.

## 2. Endpoints

### 2.1 Profile Management

#### Get Current User Profile

**Endpoint**: `GET /api/profile`

**Description**: Retrieves the authenticated user's profile information.

**Authentication**: Required (JWT token)

**Query Parameters**: None

**Request Body**: None

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Profile not found (should not occur due to trigger)

---


### 2.2 Dietary Preferences Management

#### Get Dietary Preferences

**Endpoint**: `GET /api/profile/dietary-preferences`

**Description**: Retrieves the authenticated user's dietary preferences.

**Authentication**: Required (JWT token)

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
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Dietary preferences not found (should not occur due to trigger)

---

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

### 2.3 Recipe Management

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

#### Create Recipe

**Endpoint**: `POST /api/recipes`

**Description**: Creates a new recipe (original or AI-generated).

**Authentication**: Required (JWT token)

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
- `401 Unauthorized`: User not authenticated
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

---

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

---

### 2.4 AI Recipe Modification

#### Preview AI Recipe Modification

**Endpoint**: `POST /api/recipes/:id/ai-preview`

**Description**: Generates an AI-modified version of a recipe based on the user's dietary preferences. The modified recipe is not saved automatically; the user can review it and choose to save it.

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id` (uuid): Recipe ID to modify

**Query Parameters**: None

**Request Body**: None (uses the recipe content and user's dietary preferences automatically)

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

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider**: Supabase Auth

**Method**: JWT (JSON Web Token) authentication

**Token Storage**: Client stores JWT token (typically in HTTP-only cookie or local storage)

**Token Transmission**: JWT sent in `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### 3.3 Authorization Strategy

**Row-Level Security (RLS)**: All user data access control is enforced at the database level using PostgreSQL RLS policies. This ensures that:

- Users can only access their own profile, dietary preferences, recipes, and AI metadata
- No URL manipulation or API bypass can circumvent access controls
- Authorization is declarative and enforced consistently

**API-Level Checks**: API endpoints must:

1. Extract JWT token from Authorization header
2. Validate token with Supabase Auth
3. Pass authenticated user context to Supabase client
4. Supabase client automatically enforces RLS policies using `auth.uid()`

### 3.4 Session Management

- **Session Duration**: Configurable in Supabase (default: 1 hour with refresh)
- **Refresh Tokens**: Automatically handled by Supabase client
- **Session Expiry**: API returns `401 Unauthorized` for expired sessions
- **Logout**: Client calls `supabase.auth.signOut()` to invalidate session

### 3.5 Public vs Protected Endpoints

**Public Endpoints** (no authentication required):
- None in MVP (all endpoints require authentication)

**Protected Endpoints** (authentication required):
- All `/api/profile/*` endpoints
- All `/api/recipes/*` endpoints

### 3.6 CORS Configuration

- **Allowed Origins**: Configure based on frontend domain (e.g., `https://healthymeal.com`)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Authorization`, `Content-Type`
- **Credentials**: Allow credentials (cookies) for same-origin requests

---

## 4. Validation and Business Logic

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

#### AI Metadata Validation

**Field**: `model`
- Required: Yes (for AI-generated recipes)
- Type: String
- Example: `anthropic/claude-3.5-sonnet`

**Field**: `provider`
- Required: Yes (for AI-generated recipes)
- Type: String
- Example: `openrouter`

**Field**: `generation_duration`
- Required: Yes (for AI-generated recipes)
- Type: Integer (milliseconds)
- Validation: Positive integer

**Field**: `raw_response`
- Required: Yes (for AI-generated recipes)
- Type: JSONB
- Validation: Valid JSON object

### 4.2 Business Logic Implementation

#### Automatic Profile Creation

**Trigger**: User registration via Supabase Auth

**Logic**:
1. Database trigger automatically creates a `profiles` row when a new user is added to `auth.users`
2. Database trigger automatically creates a `dietary_preferences` row when a new profile is created
3. No API endpoint needed; handled entirely by database triggers

#### AI Recipe Modification

**Endpoint**: `POST /api/recipes/:id/ai-preview`

**Logic**:
1. Authenticate user and validate recipe ownership (via RLS)
2. Fetch recipe by ID
3. Fetch user's dietary preferences
4. If no dietary preferences set, return `400 Bad Request`
5. Build AI prompt:
   - Include original recipe (title, ingredients, instructions)
   - Include dietary preferences (diet_type, allergies, disliked_ingredients)
   - Request explanation of changes
6. Call OpenRouter API with prompt
7. Parse AI response to extract modified recipe and explanation
8. Return modified recipe with metadata (not saved to database)
9. Log any errors for troubleshooting

**Error Handling**:
- Timeout: Return `504 Gateway Timeout` if AI service takes >120 seconds
- Service unavailable: Return `503 Service Unavailable` if AI service returns 5xx errors
- Rate limit: Return `429 Too Many Requests` if user exceeds 10 requests/minute

#### Saving AI-Modified Recipe

**Endpoint**: `POST /api/recipes`

**Logic**:
1. Validate recipe data (title, ingredients, instructions, length constraints)
2. If `is_ai_generated` is true:
   - Validate `parent_recipe_id` exists and is owned by user
   - Validate `ai_metadata` is provided
3. Insert recipe into `recipes` table
4. If `ai_metadata` provided, insert into `recipe_ai_metadata` table
5. Return saved recipe with metadata

#### Optimistic Locking for Recipe Updates

**Endpoint**: `PUT /api/recipes/:id`

**Logic**:
1. Client sends `updated_at` timestamp from their cached version
2. API updates recipe with WHERE clause: `WHERE id = :id AND updated_at = :timestamp`
3. If no rows affected (updated_at mismatch), return `409 Conflict` with current version
4. If update succeeds, database trigger updates `updated_at` to current timestamp
5. Return updated recipe with new `updated_at`

#### Recipe Deletion with Cascade

**Endpoint**: `DELETE /api/recipes/:id`

**Logic**:
1. Delete recipe by ID (ownership enforced by RLS)
2. Database automatically cascades delete to `recipe_ai_metadata` if exists
3. Database automatically sets `parent_recipe_id` to NULL in child recipes (AI variants)
4. Return `204 No Content`

### 4.3 Error Handling Standards

All error responses follow this structure:

```json
{
  "error": "Error type",
  "message": "User-friendly error message",
  "details": ["Additional details if applicable"]
}
```

**Error Codes**:
- `400 Bad Request`: Invalid input, validation errors
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized (rare due to RLS)
- `404 Not Found`: Resource not found or not owned by user
- `409 Conflict`: Optimistic locking failure, concurrent modification
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: External service (AI) unavailable
- `504 Gateway Timeout`: External service (AI) timeout

### 4.4 Rate Limiting

**AI Preview Endpoint**: `POST /api/recipes/:id/ai-preview`
- Limit: 10 requests per minute per user
- Reason: Prevent abuse and control costs of AI service calls

**Other Endpoints**: No rate limiting in MVP (can be added later if needed)

### 4.5 Pagination

**Applicable to**: `GET /api/recipes`

**Parameters**:
- `page` (default: 1, min: 1)
- `limit` (default: 20, min: 1, max: 100)

**Response includes pagination metadata**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 4.7 Filtering

**Applicable to**: `GET /api/recipes`

**Parameters**:
- `is_ai_generated` (boolean): Filter by AI-generated or original recipes
- `parent_recipe_id` (uuid): Find all AI variations of a specific recipe

**Example**: `?is_ai_generated=true&parent_recipe_id=uuid`

---

## 5. Additional Considerations

### 5.1 Performance Optimizations

- Database indexes on `recipes(owner_id, created_at DESC)` for efficient recipe list queries
- Database index on `recipes(parent_recipe_id)` for efficient AI variant queries
- Consider caching user's dietary preferences for AI modification requests (cache invalidation on update)

### 5.2 Logging and Monitoring

- Log all AI service calls with request/response for troubleshooting
- Log all authentication failures
- Monitor API response times, especially AI preview endpoint
- Monitor AI service costs and usage

### 5.3 Future Enhancements

- Search and filtering recipes by title, ingredients (requires full-text search)
- Recipe import from external URLs (requires web scraping/parsing)
- Batch operations (delete multiple recipes, export recipes)
- Recipe sharing between users (requires additional tables and permissions)
- Webhook notifications for long-running AI operations

### 5.4 Security Best Practices

- All inputs are validated and sanitized before database operations
- SQL injection prevented by using parameterized queries (Supabase handles this)
- XSS prevention by proper output encoding on frontend
- CSRF protection via token validation (for state-changing operations)
- Rate limiting on expensive operations (AI calls)
- Audit logging for sensitive operations (optional for MVP)

---

## 7. Testing Strategy

### 7.1 Unit Tests

- Test validation functions (recipe validation, dietary preferences validation)
- Test business logic functions (AI prompt building, response parsing)

### 7.2 Integration Tests

- Test each API endpoint with valid and invalid inputs
- Test authentication and authorization (RLS policies)
- Test pagination, sorting, filtering
- Test optimistic locking scenarios
- Mock AI service for predictable testing

### 7.3 End-to-End Tests

- Test complete user flows:
  - User registration → profile setup → recipe creation → AI modification → save
  - Recipe CRUD operations
  - Dietary preferences management