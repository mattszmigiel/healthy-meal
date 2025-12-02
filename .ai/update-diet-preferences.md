# API Endpoint Implementation Plan: Update Dietary Preferences

## 1. Endpoint Overview

This endpoint allows authenticated users to update their dietary preferences, including diet type, allergies, and disliked ingredients. The update is partial - users can update any combination of fields without affecting other fields. The endpoint enforces Row-Level Security (RLS) at the database level to ensure users can only modify their own preferences.

**Key Features:**
- Partial updates supported (update any combination of fields)
- All fields are optional
- Automatic timestamp management via database trigger
- RLS enforcement ensures data isolation per user

## 2. Request Details

- **HTTP Method:** `PUT`
- **URL Structure:** `/api/profile/dietary-preferences`
- **Authentication:** Required (JWT Bearer token)
- **Content-Type:** `application/json`

### Query Parameters
None

### Request Headers
- `Authorization: Bearer <jwt_token>` (required)
- `Content-Type: application/json` (required)

### Request Body
All fields are optional, but at least one field must be provided:

```typescript
{
  "diet_type"?: string | null,           // One of the allowed enum values or null
  "allergies"?: string[],                // Array of allergy/intolerance strings
  "disliked_ingredients"?: string[]      // Array of disliked ingredient strings
}
```

**Field Constraints:**
- `diet_type`: Must be one of: `"omnivore"`, `"vegetarian"`, `"vegan"`, `"pescatarian"`, `"keto"`, `"paleo"`, `"low_carb"`, `"low_fat"`, `"mediterranean"`, `"other"`, or `null`
- `allergies`: Must be an array of strings (can be empty array)
- `disliked_ingredients`: Must be an array of strings (can be empty array)

## 3. Used Types

### Command Model (Input)
```typescript
// From src/types.ts
UpdateDietaryPreferencesCommand = Pick<
  DietaryPreferencesEntity,
  "diet_type" | "allergies" | "disliked_ingredients"
>
```

### Response DTO (Output)
```typescript
// From src/types.ts
DietaryPreferencesDTO = DietaryPreferencesEntity
// Contains: user_id, diet_type, allergies, disliked_ingredients, created_at, updated_at
```

### Error Response
```typescript
// From src/types.ts
APIErrorResponse = {
  error: string;
  message: string;
  details?: string[];
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "user_id": "uuid-string",
  "diet_type": "vegan",
  "allergies": ["gluten", "dairy"],
  "disliked_ingredients": ["cilantro", "olives"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

### Error Responses

**400 Bad Request** - Invalid input data
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": [
    "diet_type must be one of: omnivore, vegetarian, vegan, pescatarian, keto, paleo, low_carb, low_fat, mediterranean, other, or null"
  ]
}
```

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found** - Dietary preferences not found (edge case)
```json
{
  "error": "Not Found",
  "message": "Dietary preferences not found for user"
}
```

**500 Internal Server Error** - Server-side error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

```
1. Client sends PUT request
   ↓
2. Astro middleware (src/middleware/index.ts)
   - Extracts JWT from Authorization header
   - Validates token with Supabase Auth
   - Attaches authenticated Supabase client to context.locals.supabase
   - Extracts user ID and attaches to context.locals.user
   ↓
3. API Route (src/pages/api/profile/dietary-preferences.ts)
   - Checks authentication (401 if not authenticated)
   - Validates request body with Zod schema (400 if invalid)
   - Extracts UpdateDietaryPreferencesCommand from validated data
   ↓
4. Service Layer (src/lib/services/dietaryPreferencesService.ts)
   - Receives command and authenticated user ID
   - Calls Supabase client to update dietary_preferences table
   - RLS policies ensure user can only update their own record
   - Database trigger automatically updates updated_at timestamp
   ↓
5. Database (Supabase/PostgreSQL)
   - RLS policy checks: user_id = auth.uid()
   - Updates allowed fields only
   - Trigger sets updated_at = NOW()
   - Returns updated row
   ↓
6. Service Layer
   - Transforms database result to DietaryPreferencesDTO
   - Returns DTO to API route
   ↓
7. API Route
   - Returns 200 OK with DietaryPreferencesDTO as JSON
   - Or returns appropriate error response
```

## 6. Security Considerations

### Authentication
- **Mechanism:** JWT token validation via Supabase Auth
- **Middleware:** Token extraction and validation handled in Astro middleware
- **Session Management:** Supabase handles token refresh and expiration
- **Error Handling:** Return 401 for missing, invalid, or expired tokens

### Authorization
- **Row-Level Security (RLS):** Database-level enforcement
- **Policy:** `user_id = auth.uid()` ensures users can only update their own preferences
- **API-Level Check:** Verify user is authenticated before processing request
- **No URL Manipulation:** RLS prevents access to other users' data even if user_id is manipulated

### Input Validation
- **Zod Schema Validation:**
  - Validate diet_type against allowed enum values + null
  - Validate allergies is array of strings
  - Validate disliked_ingredients is array of strings
  - Ensure at least one field is provided
- **Sanitization:** Zod handles type coercion and validation
- **SQL Injection Prevention:** Supabase uses parameterized queries

### Data Validation
- **Type Safety:** TypeScript types + Zod runtime validation
- **Enum Validation:** diet_type must match database enum
- **Array Validation:** Ensure arrays contain only strings
- **Null Handling:** Explicitly allow null for diet_type

## 7. Error Handling

### Error Scenarios and Status Codes

| Scenario | Status Code | Error Response | Cause |
|----------|-------------|----------------|-------|
| Missing Authorization header | 401 | `{"error": "Unauthorized", "message": "Authentication required"}` | No JWT token provided |
| Invalid JWT token | 401 | `{"error": "Unauthorized", "message": "Invalid authentication token"}` | Malformed or invalid token |
| Expired JWT token | 401 | `{"error": "Unauthorized", "message": "Authentication token expired"}` | Token past expiration time |
| Empty request body | 400 | `{"error": "Bad Request", "message": "At least one field must be provided"}` | No fields to update |
| Invalid diet_type | 400 | `{"error": "Bad Request", "message": "Invalid diet_type", "details": [...]}` | Value not in enum |
| Non-array allergies | 400 | `{"error": "Bad Request", "message": "allergies must be an array"}` | Wrong type provided |
| Non-array disliked_ingredients | 400 | `{"error": "Bad Request", "message": "disliked_ingredients must be an array"}` | Wrong type provided |
| Dietary preferences not found | 404 | `{"error": "Not Found", "message": "Dietary preferences not found"}` | Edge case - should not happen due to trigger |
| Database connection error | 500 | `{"error": "Internal Server Error", "message": "An unexpected error occurred"}` | Supabase unavailable |
| RLS policy violation | 500 | `{"error": "Internal Server Error", "message": "An unexpected error occurred"}` | Should not happen if auth is correct |

### Error Logging Strategy
- **Client Errors (4xx):** Log minimal info (endpoint, status, user_id if available)
- **Server Errors (5xx):** Log full error details (stack trace, request info, user_id)
- **Sensitive Data:** Never log JWT tokens or auth headers
- **Logging Location:** Application-level logs (console in dev, structured logs in production)

## 8. Performance Considerations

### Optimization Strategies
- **Single Database Query:** Update performed in one query, no N+1 issues
- **Indexed Lookup:** user_id is primary key (inherently indexed)
- **RLS Efficiency:** RLS policies use indexed columns (user_id)
- **Minimal Data Transfer:** Only return necessary fields in response

### Caching Considerations
- **No Response Caching:** Data is user-specific and frequently updated
- **JWT Caching:** Handled by Supabase client SDK

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File:** `src/lib/schemas/dietaryPreferencesSchemas.ts` (create new file)

```typescript
import { z } from "zod";

const DIET_TYPES = [
  "omnivore",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
  "low_carb",
  "low_fat",
  "mediterranean",
  "other",
] as const;

export const updateDietaryPreferencesSchema = z
  .object({
    diet_type: z.enum(DIET_TYPES).nullable().optional(),
    allergies: z.array(z.string()).optional(),
    disliked_ingredients: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return (
        data.diet_type !== undefined ||
        data.allergies !== undefined ||
        data.disliked_ingredients !== undefined
      );
    },
    {
      message: "At least one field must be provided",
    }
  );
```

### Step 2: Create Service Layer
**File:** `src/lib/services/dietaryPreferencesService.ts` (create new file)

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  UpdateDietaryPreferencesCommand,
  DietaryPreferencesDTO,
} from "@/types";

export class DietaryPreferencesService {
  constructor(private supabase: SupabaseClient) {}

  async updateDietaryPreferences(
    userId: string,
    command: UpdateDietaryPreferencesCommand
  ): Promise<DietaryPreferencesDTO> {
    // Build update object with only provided fields
    const updateData: Partial<UpdateDietaryPreferencesCommand> = {};

    if (command.diet_type !== undefined) {
      updateData.diet_type = command.diet_type;
    }
    if (command.allergies !== undefined) {
      updateData.allergies = command.allergies;
    }
    if (command.disliked_ingredients !== undefined) {
      updateData.disliked_ingredients = command.disliked_ingredients;
    }

    const { data, error } = await this.supabase
      .from("dietary_preferences")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .singl/ee();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - preferences not found
        throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
      }
      console.error("Error updating dietary preferences:", error);
      throw new Error("DATABASE_ERROR");
    }

    if (!data) {
      throw new Error("DIETARY_PREFERENCES_NOT_FOUND");
    }

    return data;
  }
}
```

### Step 3: Create API Route
**File:** `src/pages/api/profile/dietary-preferences.ts` (create new file)

```typescript
import type { APIRoute } from "astro";
import { updateDietaryPreferencesSchema } from "@/lib/schemas/dietaryPreferencesSchemas";
import { DietaryPreferencesService } from "@/lib/services/dietaryPreferencesService";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    const errorResponse: APIErrorResponse = {
      error: "Unauthorized",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDietaryPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: APIErrorResponse = {
        error: "Bad Request",
        message: "Invalid input data",
        details: validationResult.error.errors.map((e) => e.message),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update dietary preferences via service
    const service = new DietaryPreferencesService(locals.supabase);
    const updatedPreferences = await service.updateDietaryPreferences(
      locals.user.id,
      validationResult.data
    );

    return new Response(JSON.stringify(updatedPreferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof Error) {
      if (error.message === "DIETARY_PREFERENCES_NOT_FOUND") {
        const errorResponse: APIErrorResponse = {
          error: "Not Found",
          message: "Dietary preferences not found for user",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log server errors
    console.error("Unexpected error updating dietary preferences:", error);

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

### Step 4: Update Middleware (if needed)
**File:** `src/middleware/index.ts`

Verify that middleware:
- Extracts JWT from Authorization header
- Validates token with Supabase Auth
- Attaches authenticated Supabase client to `context.locals.supabase`
- Attaches user object to `context.locals.user`

If middleware doesn't exist or needs updates, create/update accordingly.

### Step 6: Documentation
- Add JSDoc comments to service methods
- Document error codes and meanings
- Add usage examples in API documentation
