# Registration Backend Integration - Implementation Plan

## Current State Analysis

### Already Implemented ✅

- **RegisterForm component** with React Hook Form + Zod validation (src/components/auth/RegisterForm.tsx)
- **Register page** (src/pages/register.astro)
- **Client-side validation schema** (RegisterFormSchema in src/lib/schemas/auth.schema.ts)
- **Server-side validation schema** (RegisterRequestSchema in src/lib/schemas/auth.schema.ts)
- **AuthService class** with login() and logout() methods (src/lib/services/auth.service.ts)
- **Login and Logout API endpoints** (src/pages/api/auth/login.ts, src/pages/api/auth/logout.ts)
- **Middleware** with session management and route protection (src/middleware/index.ts)
- **Supabase SSR client** configuration (src/db/supabase.client.ts)
- **Error handling infrastructure** (src/lib/errors/auth.errors.ts, src/lib/utils/api-responses.ts)
- **AuthResponseDTO type** (reusable for registration in src/types.ts)
- **Database triggers and RLS policies** (confirmed configured in Supabase)

### Missing ❌

- **AuthService.register()** method
- **/api/auth/register** API endpoint

## Implementation Requirements (Based on User Requirements)

1. **Email Verification**: Disabled - users get immediate access after registration
2. **Error Messages**: Generic messages to prevent email enumeration
3. **Post-Registration**: Redirect to `/recipes?welcome=true`
4. **Rate Limiting**: Rely on Supabase's built-in rate limiting (no custom implementation)
5. **Database**: Already configured with triggers and RLS policies

## Files to Create/Modify

### 1. Update `src/lib/services/auth.service.ts` (auth.service.ts:32)

**Add `register()` method:**
- Signature: `async register(email: string, password: string): Promise<AuthResponseDTO>`
- Call `supabase.auth.signUp()` with email confirmation disabled
- Handle errors and map to custom error classes
- Use generic messages (not revealing if email exists for security)
- Follow the same pattern as `login()` method

**Implementation Details:**
```typescript
async register(email: string, password: string): Promise<AuthResponseDTO> {
  const { data, error } = await this.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, // No email confirmation for MVP
    }
  });

  if (error) {
    // Use generic message to prevent email enumeration
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      throw new AuthenticationError('Registration failed. Please try again or login if you already have an account.');
    }

    if (error.message.includes('Password')) {
      throw new AuthenticationError('Password does not meet requirements');
    }

    throw new AuthenticationError('Registration failed. Please try again.');
  }

  if (!data.user) {
    throw new AuthenticationError('Registration failed. Please try again.');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
    },
    message: 'Account created successfully',
  };
}
```

### 2. Create `src/pages/api/auth/register.ts`

**Follow existing pattern from login.ts:**
- Set `export const prerender = false`
- Validate request with RegisterRequestSchema from Zod
- Instantiate AuthService with `locals.supabase`
- Call `authService.register()`
- Return 201 on success with AuthResponseDTO
- Use `handleAuthError()` for error responses

**Implementation Details:**
```typescript
/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password.
 * Auto-creates session and logs user in immediately.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (minimum 8 characters)
 *
 * Success Response (201):
 * - user: { id, email }
 * - message: "Account created successfully"
 *
 * Error Responses:
 * - 400: Invalid request body or registration failed
 * - 429: Too many registration attempts (Supabase rate limiting)
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";

import { RegisterRequestSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { handleAuthError, validationErrorResponse } from "@/lib/utils/api-responses";

// Disable static generation for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        "Invalid request body",
        validationResult.error.errors.map((e) => e.message)
      );
    }

    const { email, password } = validationResult.data;

    // Instantiate AuthService with Supabase client from locals
    const authService = new AuthService(locals.supabase);

    // Register user (session cookies set automatically by Supabase)
    const result = await authService.register(email, password);

    // Return successful registration response with 201 Created
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle authentication errors with centralized error handler
    return handleAuthError(error);
  }
};
```

### 3. Integration with Supabase Auth

**Use Supabase documentation for best practices:**
- Configure `signUp()` options to disable email confirmation
- Ensure session cookies are set automatically via SSR client
- Database trigger auto-creates profile entry in `public.profiles` table
- RLS policies enforce data isolation

**Supabase Configuration (already done):**
- Email confirmation: Disabled for MVP
- Session management: Cookie-based (SSR mode)
- Database triggers: Auto-create profile on user registration
- RLS policies: Users can only access their own data

## Implementation Steps

1. **Add `register()` method to AuthService** (src/lib/services/auth.service.ts)
   - Implement error handling with generic messages
   - Map Supabase errors to custom error classes
   - Return AuthResponseDTO on success

2. **Create `/api/auth/register` endpoint** (src/pages/api/auth/register.ts)
   - Follow established API pattern from login.ts
   - Use RegisterRequestSchema for validation
   - Return 201 on success
   - Use handleAuthError() for errors

3. **Test the complete flow:**
   - Successful registration → auto-login → redirect to /recipes?welcome=true
   - Duplicate email → generic error message (no email enumeration)
   - Weak password → validation error with clear message
   - Network errors → user-friendly error message
   - Integration with existing RegisterForm component

4. **Verify integration points:**
   - RegisterForm calls POST /api/auth/register correctly
   - Session cookies are set on successful registration
   - Middleware recognizes authenticated user
   - Redirect to /recipes?welcome=true works
   - Database trigger creates profile entry

## Security Considerations

- **Password Security**: Hashed with bcrypt by Supabase, minimum 8 characters enforced
- **Email Enumeration Prevention**: Generic error messages don't reveal if email exists
- **Session Security**: HttpOnly cookies prevent XSS attacks
- **Rate Limiting**: Supabase built-in rate limiting prevents spam registrations
- **Database Isolation**: RLS policies ensure users only access their own data
