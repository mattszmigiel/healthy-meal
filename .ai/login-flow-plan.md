# Login Backend Integration Implementation Plan

## Overview
Integrate the existing login UI (login.astro + LoginForm.tsx) with Supabase Auth backend. This plan focuses ONLY on the login flow - registration and password reset are deferred to future work.

## Scope
✅ **In Scope**:
- Login endpoint ONLY (POST /api/auth/login)
- Session management via middleware
- Route protection (redirect to login if unauthenticated)
- Update existing APIs to use real user sessions
- Database RLS policies for data isolation

❌ **Out of Scope** (deferred):
- Logout endpoint
- Registration endpoint
- Password reset endpoints
- User registration UI integration
- Profile creation triggers (will use existing test user)

## Technical Decisions (User-Approved)
1. **Route Protection**: Middleware handles ALL protection centrally with public path whitelist
2. **Supabase Client**: Factory function `createSupabaseServerClient(cookies)` in middleware
3. **Authorization**: RLS policies only (Supabase enforces data isolation)
4. **Database**: Supabase CLI migration file for RLS policies
5. **Site URL**: Dynamic detection via `Astro.url.origin` in API routes

## Testing Approach
Since registration is deferred, testing will use an **existing test user** in the Supabase database. The test user should already have a profile and some test data.

## Implementation Phases

### Phase 1: Backend Infrastructure Setup

#### 1.1 Install Dependencies
**File**: `package.json`
- Install `@supabase/ssr` package for SSR cookie handling
- Command: `npm install @supabase/ssr`

#### 1.2 Update Supabase Client Configuration
**File**: `src/db/supabase.client.ts`
- Add `createSupabaseServerClient(cookies: AstroCookies)` factory function
- Import `createServerClient` from `@supabase/ssr`
- Keep existing `supabaseClient` export for backward compatibility
- Remove `DEFAULT_USER` constant (will be replaced by real sessions)

**Pattern to follow**:
```typescript
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(url, key, {
    cookies: {
      get(key) { return cookies.get(key)?.value },
      set(key, value, options) { cookies.set(key, value, options) },
      remove(key, options) { cookies.delete(key, options) }
    }
  });
}
```

#### 1.3 Update TypeScript Environment Types
**File**: `src/env.d.ts`
- Add `user` and `session` properties to `App.Locals` interface
- Types: `User | null` and `Session | null` from `@supabase/supabase-js`

#### 1.4 Enhance Middleware
**File**: `src/middleware/index.ts`
- Create Supabase client using new factory function
- Extract session via `supabase.auth.getSession()`
- Populate `locals.user` and `locals.session`
- Implement route protection with public path whitelist
- Redirect unauthenticated users: `/login?returnUrl={encoded_path}`
- Redirect authenticated users away from auth pages to `/recipes`
- Validate `returnUrl` parameter (must start with `/`)

**Public paths whitelist**:
- `/`
- `/login`
- `/register`
- `/reset-password`
- `/api/auth/*`

**Protection logic**:
- Page routes: Redirect to login with returnUrl
- Auth pages: Redirect authenticated users to /recipes
- API routes: Will handle their own responses (middleware just provides session)

#### 1.5 Create Custom Error Classes
**File**: `src/lib/errors/auth.errors.ts` (new file)
- `AuthenticationError` - Generic auth failures
- `UnauthorizedError` - Invalid credentials (401)
- `ConflictError` - Email already exists (409)
- `RateLimitError` - Too many attempts (429)

**Pattern**: Simple Error subclasses with name property

#### 1.6 Update API Response Helpers
**File**: `src/lib/utils/api-responses.ts`
- Add `handleAuthError(error: unknown): Response` function
- Map custom error classes to appropriate HTTP responses
- Return user-friendly error messages

#### 1.7 Create AuthService
**File**: `src/lib/services/auth.service.ts` (new file)
- Constructor: Inject `SupabaseClient` dependency
- Define `AUTH_ERRORS` constant object for error codes
- Implement method (login only):
  - `async login(email, password): Promise<AuthResponseDTO>`

**Implementation notes**:
- Use `supabase.auth.signInWithPassword()` for login
- Throw errors with specific codes from `AUTH_ERRORS` constant
- Generic error messages for security (don't reveal if email exists)
- Return user info and success message

#### 1.8 Add Auth DTOs to Types
**File**: `src/types.ts`
- Add authentication-related types (login flow only):
  - `AuthResponseDTO` - Login success response with user info and message
  - `LoginRequestDTO` - Login payload (email, password)

### Phase 2: API Endpoint Implementation (Login Only)

#### 2.1 Create Login Endpoint
**File**: `src/pages/api/auth/login.ts` (new file)
- Export `prerender = false`
- Implement `POST` handler
- Validate request body with `LoginRequestSchema`
- Instantiate `AuthService` with `locals.supabase`
- Call `service.login(email, password)`
- Return `AuthResponseDTO` on success
- Session cookies set automatically by Supabase

**Error handling**:
- `INVALID_CREDENTIALS` → 401 with generic message "Invalid email or password"
- Validation errors → 400 with field-specific messages
- Rate limit → 429 (if implemented)
- Other errors → 500 with generic message

**Response format**:
```typescript
{
  user: { id: string, email: string },
  message: "Login successful"
}
```

### Phase 3: Database Setup (RLS Policies Only)

#### 3.1 Create Supabase Migration File
**File**: `supabase/migrations/YYYYMMDDHHMMSS_enable_rls.sql` (new file)
- Use Supabase CLI: `supabase migration new enable_rls`
- Enable RLS on all tables
- Create RLS policies for:
  - `profiles` (users view own profile)
  - `dietary_preferences` (users CRUD own preferences)
  - `recipes` (users CRUD own recipes)
  - `recipe_ai_metadata` (users view/insert own metadata)

**Note**: Profile creation trigger NOT included (deferred to registration implementation)

**RLS policy pattern** (using `auth.uid()` function):
```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ai_metadata ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Users can view own records"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

#### 3.2 Update Existing API Endpoints
**Files to update**:
- `src/pages/api/recipes.ts`
- `src/pages/api/recipes/[id].ts`
- `src/pages/api/recipes/[id]/ai-preview.ts`
- `src/pages/api/profile/dietary-preferences.ts`

**Changes**:
- Replace `DEFAULT_USER` with `locals.user!.id`
- Use non-null assertion (middleware guarantees user exists)
- Remove hardcoded user ID references
- Services already accept `userId` parameter - just pass real ID

**Pattern**:
```typescript
const userId = locals.user!.id;  // Safe due to middleware
const service = new ServiceName(locals.supabase);
const result = await service.method(userId, data);
```

### Phase 4: Frontend Updates

#### 4.1 Update Landing Page
**File**: `src/pages/index.astro`
- Add `export const prerender = false`
- Check if user is authenticated via `Astro.locals.user`
- If authenticated, redirect to `/recipes`
- Keep existing UI for unauthenticated users

#### 4.2 Update Authenticated Layout
**File**: `src/layouts/AuthenticatedLayout.astro`
- Remove hardcoded `userEmail = "test"`
- Extract real email: `const userEmail = Astro.locals.user!.email`
- Middleware ensures user exists (non-null assertion safe)
- Pass real email to GlobalNavigation component

#### 4.3 Verify Existing Auth Pages
**Files** (already implemented, just verify):
- `src/pages/login.astro` - UI ready
- `src/components/auth/LoginForm.tsx` - Already calls `/api/auth/login`
- `src/lib/schemas/auth.schema.ts` - Validation schemas ready

**No changes needed** - frontend already calls the correct endpoints

### Phase 5: Testing Checklist (Login Only)

#### 5.1 Backend Testing
- [ ] Install @supabase/ssr package successfully
- [ ] Middleware creates SSR client with cookies
- [ ] Middleware extracts session correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] Login page redirects authenticated users to /recipes
- [ ] AuthService login method works correctly

#### 5.2 API Endpoint Testing (with existing test user)
- [ ] POST /api/auth/login with valid credentials (200 success)
- [ ] POST /api/auth/login with invalid credentials (401 error)
- [ ] POST /api/auth/login with malformed data (400 validation error)
- [ ] POST /api/auth/login sets session cookies correctly
- [ ] Login response includes user ID and email

#### 5.3 Database Testing
- [ ] Migration runs successfully
- [ ] RLS policies prevent cross-user data access
- [ ] Logged-in user can only see their own recipes
- [ ] Logged-in user can only modify their own preferences
- [ ] Different user cannot access first user's data

#### 5.4 Integration Testing
- [ ] Full login flow (login → redirect to /recipes)
- [ ] Login with returnUrl parameter (login → redirect to returnUrl)
- [ ] returnUrl validation (reject non-relative paths, redirect to /recipes)
- [ ] Protected page access when unauthenticated (redirect to login with returnUrl)
- [ ] Session persistence across page navigations
- [ ] Existing recipe APIs work with real user session
- [ ] Multiple tabs maintain session correctly
- [ ] Browser refresh preserves session

## Critical Files Reference

**New Files** (to create - login only):
- `src/lib/services/auth.service.ts` - Login method only
- `src/lib/errors/auth.errors.ts` - Custom error classes
- `src/pages/api/auth/login.ts` - Login endpoint
- `supabase/migrations/YYYYMMDDHHMMSS_enable_rls.sql` - RLS policies

**Files to Update**:
- `src/db/supabase.client.ts` - Add SSR factory function
- `src/env.d.ts` - Add user/session to Locals interface
- `src/middleware/index.ts` - Session extraction + route protection
- `src/lib/utils/api-responses.ts` - Add auth error handler
- `src/types.ts` - Add auth DTOs (login only)
- `src/pages/index.astro` - Redirect if authenticated
- `src/layouts/AuthenticatedLayout.astro` - Use real user email
- `src/pages/api/recipes.ts` - Use real user ID instead of DEFAULT_USER
- `src/pages/api/recipes/[id].ts` - Use real user ID instead of DEFAULT_USER
- `src/pages/api/recipes/[id]/ai-preview.ts` - Use real user ID instead of DEFAULT_USER
- `src/pages/api/profile/dietary-preferences.ts` - Use real user ID instead of DEFAULT_USER

**Existing Files** (verified, no changes needed):
- `src/pages/login.astro` - Already complete
- `src/components/auth/LoginForm.tsx` - Already calls /api/auth/login
- `src/lib/schemas/auth.schema.ts` - LoginFormSchema and LoginRequestSchema ready

**Deferred Files** (not implementing yet):
- `src/pages/api/auth/logout.ts` - Logout endpoint (deferred)
- `src/pages/register.astro` - Registration UI (deferred)
- `src/components/auth/RegisterForm.tsx` - Registration form (deferred)
- `src/pages/reset-password.astro` - Password reset UI (deferred)
- `src/pages/api/auth/register.ts` - Registration endpoint (deferred)
- `src/pages/api/auth/reset-password-*.ts` - Password reset endpoints (deferred)

## Implementation Order (Login Only)

1. **Backend Infrastructure** (Phase 1.1 - 1.8)
   - Install @supabase/ssr package
   - Update Supabase client with SSR factory
   - Update TypeScript environment types
   - Enhance middleware for session + route protection
   - Create auth error classes
   - Update API response helpers
   - Create AuthService (login method only)
   - Add auth DTOs to types

2. **Database Setup** (Phase 3.1)
   - Create and run RLS migration
   - Verify RLS policies work

3. **API Endpoint** (Phase 2.1)
   - Create login endpoint only

4. **Update Existing APIs** (Phase 3.2)
   - Replace DEFAULT_USER with real user IDs from session
   - Update all recipe endpoints
   - Update profile endpoints

5. **Frontend Updates** (Phase 4.1 - 4.3)
   - Update landing page redirect
   - Update authenticated layout

## Success Criteria (Login Only)

✅ User can log in with existing test credentials via POST /api/auth/login
✅ Login returns AuthResponseDTO with user info and success message
✅ Session cookies are set automatically by Supabase after login
✅ Protected routes redirect unauthenticated users to /login?returnUrl=...
✅ Login page redirects authenticated users to /recipes
✅ returnUrl parameter works correctly after login (redirects to intended page)
✅ returnUrl validation prevents open redirect attacks (must start with /)
✅ Authenticated users see only their own data (RLS enforced)
✅ RLS policies prevent cross-user data access
✅ Session persists across page navigations and browser refreshes
✅ Existing recipe/profile APIs work with real sessions (not DEFAULT_USER)
✅ No DEFAULT_USER references remain in updated code
✅ Middleware handles session extraction and route protection correctly
✅ Multiple browser tabs maintain session state consistently
