# Authentication System Architecture Specification

## Document Overview

This specification defines the complete authentication architecture for HealthyMeal application, covering user registration, login, logout, and password recovery functionality. The design leverages Supabase Auth integrated with Astro's SSR capabilities.

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure

The authentication system introduces three new pages and modifies existing layouts to support authenticated and unauthenticated states.

#### 1.1.1 New Authentication Pages

**Login Page** (`/src/pages/login.astro`)
- **Path**: `/login`
- **Layout**: Uses base `Layout.astro` (NOT `AuthenticatedLayout.astro` or `LandingLayout.astro`)
- **Server-Side Logic**:
  - Check if user is already authenticated via middleware-provided session
  - If authenticated, redirect to `/recipes`
  - Extract `returnUrl` query parameter if present for post-login redirect
  - **SECURITY**: Validate returnUrl is a relative path (starts with `/`) to prevent open redirect attacks
  - Set `export const prerender = false` to enable SSR
- **Client Components**:
  - `LoginForm` (React component) - handles form state, validation, and submission
- **Static Elements** (Astro):
  - Centered card layout with HealthyMeal logo
  - Links to `/register` and `/reset-password`
- **Data Flow**:
  - Form submits to client-side handler
  - Client calls `POST /api/auth/login`
  - On success, navigates to `/recipes` or `returnUrl` using Astro's `navigate()`
  - On error, displays error in form

**Registration Page** (`/src/pages/register.astro`)
- **Path**: `/register`
- **Layout**: Uses base `Layout.astro`
- **Server-Side Logic**:
  - Check if user is already authenticated
  - If authenticated, redirect to `/recipes`
  - Set `export const prerender = false`
- **Client Components**:
  - `RegisterForm` (React component) - handles registration flow
- **Static Elements** (Astro):
  - Centered card layout
  - Password requirements display
  - Link to `/login`
- **Data Flow**:
  - Form submits to client-side handler
  - Client calls `POST /api/auth/register`
  - On success, user is auto-logged in and redirected to `/recipes`
  - Welcome banner or onboarding modal can be triggered via query parameter
  - On error, displays validation errors in form

**Password Reset Page** (`/src/pages/reset-password.astro`)
- **Path**: `/reset-password`
- **Layout**: Uses base `Layout.astro`
- **Server-Side Logic**:
  - Check for `access_token` and `type=recovery` in URL hash (Supabase redirect format)
  - If present, extract token and display "Set New Password" mode
  - Otherwise, display "Request Reset Link" mode
  - Set `export const prerender = false`
- **Client Components**:
  - `ResetPasswordForm` (React component) - dual-mode form
- **Static Elements** (Astro):
  - Centered card layout
  - Conditional heading based on mode
  - Link back to `/login`
- **Data Flow**:
  - **Request Mode**: Submits email to `POST /api/auth/reset-password-request`
  - **Reset Mode**: Submits new password to `POST /api/auth/reset-password-confirm` with token
  - Generic success messages to prevent email enumeration
  - Redirect to `/login` after successful password update

#### 1.1.2 Modified Layouts

**LandingLayout.astro**
- **Current State**: Has static header with Login/Sign Up links
- **Modifications Required**: None - already supports unauthenticated state
- **Header Navigation**:
  - Logo links to `/`
  - "Log In" button → `/login`
  - "Sign Up" button → `/register`

**AuthenticatedLayout.astro**
- **Current State**: Shows GlobalNavigation with hardcoded user email
- **Modifications Required**:
  - Extract user session from middleware (`context.locals.user`)
  - If no session, redirect to `/login?returnUrl={current_path}`
  - Pass actual user email from session to GlobalNavigation
  - Remove hardcoded `userEmail = "test"`
- **Navigation**: GlobalNavigation component handles authenticated state

**Layout.astro** (Base Layout)
- **Current State**: Base layout without navigation
- **Modifications Required**: None - serves as foundation for all layouts
- **Usage**: Will be used directly by auth pages (login, register, reset-password)

#### 1.1.3 Modified Pages

**Landing Page** (`/src/pages/index.astro`)
- **Current State**: Uses LandingLayout with hero and features
- **Modifications Required**:
  - Add server-side check for authenticated user
  - If authenticated, redirect to `/recipes`
  - Ensures logged-in users land on their recipe dashboard

**Recipes Page** (`/src/pages/recipes.astro`)
- **Current State**: Uses AuthenticatedLayout, hardcoded DEFAULT_USER
- **Modifications Required**:
  - Remove DEFAULT_USER constant usage
  - Extract user ID from session via `context.locals.user.id`
  - Use session user ID in API calls (via cookies, not URL params)
  - API will extract user from session server-side

**Recipe Detail Page** (`/src/pages/recipes/[id].astro`)
- **Current State**: Likely uses AuthenticatedLayout
- **Modifications Required**: Same as recipes page

**New Recipe Page** (`/src/pages/recipes/new.astro`)
- **Current State**: Likely uses AuthenticatedLayout
- **Modifications Required**: Same as recipes page

**Profile Page** (`/src/pages/profile.astro`)
- **Current State**: Hardcoded test email `test@example.com`
- **Modifications Required**:
  - Extract user email from session: `context.locals.user.email`
  - Remove hardcoded email
  - Pass session email to ProfileView component

### 1.2 React Components (Client-Side)

All form components use React Hook Form with Zod validation and follow established patterns from existing components.

#### 1.2.1 LoginForm Component

**File**: `/src/components/auth/LoginForm.tsx`

**Responsibilities**:
- Render email and password input fields
- Client-side validation (email format, required fields)
- Submit credentials to login API endpoint
- Display loading state during authentication
- Display error messages (generic for security)
- Navigate to returnUrl or `/recipes` on success

**Form Fields**:
- Email (type="email", required)
- Password (type="password", required)

**Validation Rules**:
- Email: Valid email format, required
- Password: Required (no minimum length check on login for UX)

**Error Handling**:
- Network errors: "Unable to connect. Please try again."
- 401 Unauthorized: "Invalid email or password"
- 429 Rate Limited: "Too many attempts. Please try again later."
- Other errors: "An error occurred. Please try again."

**Custom Hook**: `useLogin` - encapsulates login logic
- State: `{ isLoading, error }`
- Method: `login(email, password, returnUrl?)`
- Uses `fetch()` to call `/api/auth/login`
- Handles response and navigation

**Accessibility**:
- Form labels with `htmlFor` attributes
- Error messages with `aria-live="polite"`
- Submit button disabled during loading
- Focus management (focus on error message when appears)

#### 1.2.2 RegisterForm Component

**File**: `/src/components/auth/RegisterForm.tsx`

**Responsibilities**:
- Render registration form with email and password fields
- Display password requirements near password field
- Real-time password validation feedback
- Submit registration data to API
- Display validation errors clearly
- Auto-login and redirect on success

**Form Fields**:
- Email (type="email", required)
- Password (type="password", required)
- Confirm Password (type="password", required)

**Validation Rules** (aligned with PRD requirements):
- Email: Valid format, required
- Password:
  - Minimum 8 characters (required)
  - At least one uppercase letter (required for security)
  - At least one number (required for security)
  - At least one special character (required for security)
  - Note: PRD specifies minimum 8 chars only, but we enforce complexity for security
- Confirm Password: Must match password field

**Password Requirements Display**:
- Static text shown near password field
- Optionally show real-time feedback with checkmarks for met requirements
- Accessible via `aria-describedby` from password input

**Error Handling**:
- 400 Validation Error: Display field-specific errors
- 409 Email Already Exists: "An account with this email already exists"
  - **SECURITY NOTE**: This reveals email existence (email enumeration). Consider using generic message "Registration failed" for consistency with password reset flow.
- 429 Rate Limited: "Too many registration attempts. Please try again later."
- Network/Server Errors: Generic message

**Custom Hook**: `useRegister`
- State: `{ isLoading, errors, passwordStrength }`
- Method: `register(email, password)`
- Validates password strength
- Calls `/api/auth/register`
- Triggers auto-login flow on success

**Accessibility**:
- Password requirements linked via `aria-describedby`
- Error announcements via `aria-live`
- Progressive disclosure of password requirements

#### 1.2.3 ResetPasswordForm Component

**File**: `/src/components/auth/ResetPasswordForm.tsx`

**Responsibilities**:
- Dual-mode component (request link / set new password)
- Render appropriate fields based on mode
- Submit to appropriate API endpoint
- Display success/error messages
- Navigate to login on completion

**Mode Detection**:
- Receives `mode` prop from parent Astro page
- `mode: "request"` - show email field
- `mode: "reset"` - show password fields and token

**Request Mode Fields**:
- Email (type="email", required)

**Reset Mode Fields**:
- New Password (type="password", required)
- Confirm New Password (type="password", required)
- Hidden token field (from URL)

**Validation Rules**:
- Request Mode: Email format validation
- Reset Mode: Same password rules as registration

**Error Handling**:
- Request Mode: Always show success message (prevent email enumeration)
  - Actual message: "If an account exists with this email, you will receive a password reset link."
- Reset Mode:
  - 400 Invalid/Expired Token: "This reset link is invalid or has expired. Please request a new one."
  - 400 Weak Password: Display password requirement errors
  - Network/Server Errors: Generic message

**Custom Hook**: `useResetPassword`
- State: `{ isLoading, error, mode, isSuccess }`
- Methods:
  - `requestReset(email)`
  - `confirmReset(token, newPassword)`
- Handles both flows with appropriate API calls

**Accessibility**:
- Mode-specific headings with appropriate ARIA levels
- Success/error announcements
- Clear instructions for each mode

#### 1.2.4 Modified GlobalNavigation Component

**File**: `/src/components/navigation/GlobalNavigation.tsx`

**Current State**: Receives `userEmail` prop, shows user menu with logout

**Modifications Required**:
- Already supports authenticated state
- Ensure `userEmail` prop is passed from AuthenticatedLayout (now from session)
- `useLogout` hook already exists and calls `/api/auth/logout` - needs update to use Supabase

**No major changes needed** - existing structure supports auth flow

### 1.3 Validation and Error Messages

#### 1.3.1 Client-Side Validation (Zod Schemas)

**LoginFormSchema** (`/src/lib/schemas/auth.schema.ts`):
```typescript
{
  email: string().email("Please enter a valid email address"),
  password: string().min(1, "Password is required")
}
```

**RegisterFormSchema** (`/src/lib/schemas/auth.schema.ts`):
```typescript
{
  email: string().email("Please enter a valid email address"),
  password: string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password should contain at least one uppercase letter")
    .regex(/[0-9]/, "Password should contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password should contain at least one special character"),
  confirmPassword: string()
}
.refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})
```

**ResetPasswordRequestSchema**:
```typescript
{
  email: string().email("Please enter a valid email address")
}
```

**ResetPasswordConfirmSchema**:
```typescript
{
  token: string().min(1, "Reset token is required"),
  password: string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password should contain at least one uppercase letter")
    .regex(/[0-9]/, "Password should contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password should contain at least one special character"),
  confirmPassword: string()
}
.refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})
```

#### 1.3.2 Error Message Catalog

**Authentication Errors**:
- Invalid credentials: "Invalid email or password"
- Account locked: "Too many failed attempts. Please try again in 15 minutes."
- Email not verified: "Please verify your email address before logging in." (future)

**Registration Errors**:
- Email exists: "An account with this email already exists"
- Invalid email: "Please enter a valid email address"
- Weak password: Specific requirement messages
- Password mismatch: "Passwords do not match"

**Password Reset Errors**:
- Generic success: "If an account exists with this email, you will receive a reset link shortly."
- Invalid token: "This reset link is invalid or has expired. Please request a new one."
- Expired token: "This reset link has expired. Reset links are valid for 1 hour."
- Network error: "Unable to process your request. Please try again."

**Session Errors**:
- Session expired: "Your session has expired. Please log in again."
- Unauthorized access: "Please log in to access this page."

### 1.4 User Flow Scenarios

#### 1.4.1 Registration Flow
1. User navigates to `/register` (or clicks "Sign Up" from landing)
2. If already authenticated → redirect to `/recipes`
3. User fills registration form (email, password, confirm password)
4. Client validates form with Zod schema
5. Submit to `POST /api/auth/register`
6. On success:
   - Session automatically created by Supabase
   - Cookie set automatically
   - Navigate to `/recipes?welcome=true`
   - OnboardingBanner component detects query param and shows welcome message
7. On error: Display error messages in form

#### 1.4.2 Login Flow
1. User navigates to `/login` (or clicks "Log In")
2. If already authenticated → redirect to `/recipes`
3. User fills login form (email, password)
4. Submit to `POST /api/auth/login`
5. On success:
   - Session created, cookie set
   - Navigate to `returnUrl` or `/recipes`
6. On error: Display generic error message

#### 1.4.3 Logout Flow
1. User clicks "Log Out" in UserMenu
2. `useLogout` hook calls `POST /api/auth/logout`
3. Server invalidates session and clears cookie
4. Client navigates to `/` (landing page)
5. Subsequent requests to protected pages redirect to login

#### 1.4.4 Password Reset Flow (Request)
1. User navigates to `/reset-password` (or clicks "Forgot password?" on login)
2. User enters email address
3. Submit to `POST /api/auth/reset-password-request`
4. Server sends reset email via Supabase (if account exists)
5. Generic success message displayed
6. User checks email for reset link

#### 1.4.5 Password Reset Flow (Confirm)
1. User clicks link in email → redirects to `/reset-password#access_token=XXX&type=recovery`
2. Page detects token in URL hash
3. Form displays in "reset" mode with password fields
4. User enters new password and confirmation
5. Submit to `POST /api/auth/reset-password-confirm` with token
6. On success: Navigate to `/login` with success message
7. On error: Display error (expired/invalid token, weak password)

#### 1.4.6 Protected Page Access (Unauthenticated)
1. User navigates to `/recipes` (or any protected page)
2. Middleware detects no session
3. Redirect to `/login?returnUrl=/recipes`
4. After successful login, redirect to original page

#### 1.4.7 Session Timeout
1. User's session expires (Supabase default: configurable, typically 1 hour)
2. User attempts action (page navigation, API call)
3. Middleware/API detects expired session
4. Redirect to `/login?returnUrl={current_path}` with message
5. User re-authenticates and returns to previous page

---

## 2. BACKEND LOGIC

### 2.1 Middleware Enhancement

**File**: `/src/middleware/index.ts`

**Current State**: Only provides Supabase client via `context.locals.supabase`

**Enhanced Responsibilities**:
- Initialize Supabase client with request-specific cookies
- Extract and validate session from cookies
- Populate `context.locals.user` with session user data
- Populate `context.locals.session` with full session object
- Allow public routes (landing, auth pages, API auth endpoints)
- Redirect unauthenticated requests to protected routes

**Implementation Strategy**:
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookies for SSR
  const supabase = createServerClient(
    context.cookies,  // Pass cookies for session management
  );

  context.locals.supabase = supabase;

  // Attempt to get session from cookies
  const { data: { session }, error } = await supabase.auth.getSession();

  if (session && !error) {
    context.locals.session = session;
    context.locals.user = session.user;
  } else {
    context.locals.session = null;
    context.locals.user = null;
  }

  // Define public routes (no auth required)
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password-request',
    '/api/auth/reset-password-confirm',
  ];

  const isPublicPath = publicPaths.some(path =>
    context.url.pathname === path || context.url.pathname.startsWith(path)
  );

  // Redirect unauthenticated users from protected routes
  if (!isPublicPath && !context.locals.user) {
    const returnUrl = encodeURIComponent(context.url.pathname + context.url.search);
    return context.redirect(`/login?returnUrl=${returnUrl}`);
  }

  // Validate returnUrl parameter to prevent open redirect attacks
  const returnUrlParam = context.url.searchParams.get('returnUrl');
  if (returnUrlParam && !returnUrlParam.startsWith('/')) {
    // Reject absolute URLs or URLs that don't start with /
    context.url.searchParams.delete('returnUrl');
  }

  // Redirect authenticated users away from auth pages
  if (context.locals.user && ['/login', '/register'].includes(context.url.pathname)) {
    return context.redirect('/recipes');
  }

  return next();
});
```

**Updated Locals Type** (`src/env.d.ts`):
```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user: User | null;  // Supabase User object
    session: Session | null;  // Supabase Session object
  }
}
```

### 2.2 Authentication API Endpoints

All endpoints follow pattern: `/src/pages/api/auth/[endpoint].ts` with `export const prerender = false`

#### 2.2.1 POST /api/auth/register

**File**: `/src/pages/api/auth/register.ts`

**Purpose**: Create new user account with email and password

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Validation**:
- Use Zod schema: `RegisterRequestSchema`
- Email format validation
- Password strength validation (min 8 chars, complexity requirements)

**Process Flow**:
1. Parse and validate request body
2. Call `AuthService.register(email, password)`
3. Service calls `supabase.auth.signUp({ email, password })`
4. Supabase creates user in `auth.users` table
5. Database trigger automatically creates entry in `public.profiles` table
6. Session automatically created by Supabase
7. Return session cookie in response headers
8. Return success response with user data

**Response Success (201)**:
```typescript
{
  user: {
    id: string;
    email: string;
  };
  message: "Account created successfully"
}
```

**Response Errors**:
- 400 Validation Error: Invalid email/password format
- 409 Conflict: Email already registered
- 429 Rate Limit: Too many registration attempts
- 500 Server Error: Unexpected error

**Cookie Handling**:
- Supabase automatically sets session cookies
- Cookie names: `sb-<project-ref>-auth-token`
- HttpOnly, Secure, SameSite=Lax
- Expiration based on Supabase JWT settings

**Security Considerations**:
- Rate limiting (max 5 registrations per IP per hour)
- Email confirmation disabled for MVP (can enable later)
- Password hashed by Supabase (bcrypt)

#### 2.2.2 POST /api/auth/login

**File**: `/src/pages/api/auth/login.ts`

**Purpose**: Authenticate user with email and password

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Validation**:
- Use Zod schema: `LoginRequestSchema`
- Basic format validation (no complex rules on login)

**Process Flow**:
1. Parse and validate request body
2. Call `AuthService.login(email, password)`
3. Service calls `supabase.auth.signInWithPassword({ email, password })`
4. Supabase validates credentials
5. If valid, creates session and returns tokens
6. Session cookie set automatically
7. Return success response

**Response Success (200)**:
```typescript
{
  user: {
    id: string;
    email: string;
  };
  message: "Login successful"
}
```

**Response Errors**:
- 400 Validation Error: Missing fields
- 401 Unauthorized: Invalid credentials (generic message)
- 429 Rate Limit: Too many login attempts
- 500 Server Error: Unexpected error

**Security Considerations**:
- Rate limiting (max 10 attempts per IP per 15 minutes)
- Generic error message for invalid credentials (don't reveal if email exists)
- Automatic account lockout after 5 failed attempts (Supabase feature)

#### 2.2.3 POST /api/auth/logout

**File**: `/src/pages/api/auth/logout.ts`

**Purpose**: Invalidate user session and clear cookies

**Request Body**: None (uses session from cookie)

**Process Flow**:
1. Extract session from `context.locals.session`
2. If no session, return 200 anyway (idempotent)
3. Call `AuthService.logout()`
4. Service calls `supabase.auth.signOut()`
5. Supabase invalidates session token
6. Clear session cookies
7. Return success response

**Response Success (200)**:
```typescript
{
  message: "Logged out successfully"
}
```

**Response Errors**:
- 500 Server Error: Unexpected error (rare)

**Cookie Handling**:
- Supabase automatically clears session cookies on signOut
- Alternatively, manually clear cookies if needed

#### 2.2.4 POST /api/auth/reset-password-request

**File**: `/src/pages/api/auth/reset-password-request.ts`

**Purpose**: Send password reset email to user

**Request Body**:
```typescript
{
  email: string;
}
```

**Validation**:
- Use Zod schema: `ResetPasswordRequestSchema`
- Email format validation

**Process Flow**:
1. Parse and validate request body
2. Call `AuthService.requestPasswordReset(email)`
3. Service calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
4. Supabase sends reset email (if account exists)
5. **Always return success** (don't reveal if email exists)

**Response Success (200)**:
```typescript
{
  message: "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Configuration**:
- Redirect URL: `${site_url}/reset-password`
- Reset link includes `access_token` and `type=recovery` in URL hash
- Link expiration: 1 hour (Supabase default)

**Response Errors**:
- 400 Validation Error: Invalid email format
- 429 Rate Limit: Too many requests
- 500 Server Error: Email service unavailable

**Security Considerations**:
- Always return same message (prevent email enumeration)
- Rate limiting (max 3 requests per IP per hour)
- Email template should be clear and professional

#### 2.2.5 POST /api/auth/reset-password-confirm

**File**: `/src/pages/api/auth/reset-password-confirm.ts`

**Purpose**: Update user password using reset token

**Request Body**:
```typescript
{
  token: string;  // access_token from URL hash
  password: string;
}
```

**Validation**:
- Use Zod schema: `ResetPasswordConfirmSchema`
- Password strength validation (same as registration)
- Token format validation

**Process Flow**:
1. Parse and validate request body
2. Call `AuthService.confirmPasswordReset(token, password)`
3. Service verifies token with Supabase
4. Service calls `supabase.auth.updateUser({ password })` with token context
5. Supabase validates token (not expired, valid signature)
6. If valid, updates password
7. Invalidates reset token
8. Return success response

**Response Success (200)**:
```typescript
{
  message: "Password updated successfully"
}
```

**Response Errors**:
- 400 Validation Error: Invalid password format
- 400 Invalid Token: "This reset link is invalid or has expired"
- 401 Expired Token: "This reset link has expired"
- 429 Rate Limit: Too many attempts
- 500 Server Error: Unexpected error

**Security Considerations**:
- Token is single-use (invalidated after success)
- Token expires after 1 hour
- New password must meet strength requirements
- Rate limiting on this endpoint

### 2.3 Modified API Endpoints

All existing API endpoints that currently use `DEFAULT_USER` must be updated to extract user ID from session.

#### 2.3.1 GET /api/recipes

**Current**: Uses `DEFAULT_USER` constant
**Update**: Extract user ID from `context.locals.user.id`

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  // Middleware ensures user exists or redirects
  const userId = locals.user!.id;  // Non-null assertion safe here

  // ... rest of existing logic using userId
  const result = await service.listUserRecipes(userId, validatedParams);
  // ...
};
```

#### 2.3.2 POST /api/recipes

**Current**: Uses `DEFAULT_USER`
**Update**: Extract user ID from session

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const userId = locals.user!.id;

  // ... validation ...

  const recipe = await service.createRecipe(userId, command);
  // ...
};
```

#### 2.3.3 GET /api/recipes/[id]

**Update**: Add user ID from session for ownership verification

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const userId = locals.user!.id;
  const recipeId = params.id!;

  // Service will verify user owns this recipe
  const recipe = await service.getRecipe(userId, recipeId);
  // ...
};
```

#### 2.3.4 PUT /api/recipes/[id]

**Update**: Same as GET - verify ownership

#### 2.3.5 DELETE /api/recipes/[id]

**Update**: Same as GET - verify ownership

#### 2.3.6 POST /api/recipes/[id]/ai-preview

**Update**: Extract user ID and verify recipe ownership

#### 2.3.7 GET /api/profile/dietary-preferences

**Current**: Uses `DEFAULT_USER`
**Update**: Extract user ID from session

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const userId = locals.user!.id;

  const service = new DietaryPreferencesService(locals.supabase);
  const preferences = await service.getUserPreferences(userId);
  // ...
};
```

#### 2.3.8 PUT /api/profile/dietary-preferences

**Update**: Same as GET

### 2.4 Data Models

#### 2.4.1 Session and User Types

Supabase provides these types via `@supabase/supabase-js`:

```typescript
// From Supabase SDK
interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  // ... other Supabase user fields
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: User;
  // ... other session fields
}
```

#### 2.4.2 Database Schema Updates

**auth.users table** - Managed by Supabase (no changes needed)

**public.profiles table** - Already exists, ensure trigger is set up:

```sql
-- Trigger to auto-create profile when user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**public.dietary_preferences table** - Already has `user_id` foreign key to profiles

**public.recipes table** - Already has `owner_id` UUID field
- Ensure foreign key relationship exists: `owner_id` → `profiles.user_id`

**public.recipe_ai_metadata table** - Already has `owner_id` field
- Ensure foreign key relationship exists

**RLS Policies** - Add Row Level Security for data isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ai_metadata ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Dietary Preferences: Users can CRUD their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.dietary_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.dietary_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.dietary_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.dietary_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Recipes: Users can CRUD their own recipes
CREATE POLICY "Users can view own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = owner_id);

-- Recipe AI Metadata: Users can view/insert own metadata
CREATE POLICY "Users can view own recipe ai metadata"
  ON public.recipe_ai_metadata FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own recipe ai metadata"
  ON public.recipe_ai_metadata FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
```

#### 2.4.3 DTOs for Authentication

**File**: `/src/types.ts` (append to existing types)

```typescript
// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Register Request - POST /api/auth/register
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
}

/**
 * Login Request - POST /api/auth/login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Auth Response - Common response for login/register
 */
export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
  };
  message: string;
}

/**
 * Reset Password Request - POST /api/auth/reset-password-request
 */
export interface ResetPasswordRequestDTO {
  email: string;
}

/**
 * Reset Password Confirm - POST /api/auth/reset-password-confirm
 */
export interface ResetPasswordConfirmDTO {
  token: string;
  password: string;
}

/**
 * Generic Success Response
 */
export interface SuccessResponseDTO {
  message: string;
}
```

### 2.5 Services Layer

#### 2.5.1 AuthService

**File**: `/src/lib/services/auth.service.ts`

**Purpose**: Encapsulate all Supabase Auth operations

**Class Structure**:
```typescript
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Register new user with email and password
   * Auto-creates session and profile entry (via trigger)
   */
  async register(email: string, password: string): Promise<User>;

  /**
   * Authenticate user with email and password
   * Creates session and returns user
   */
  async login(email: string, password: string): Promise<User>;

  /**
   * Sign out current user
   * Invalidates session and clears cookies
   */
  async logout(): Promise<void>;

  /**
   * Send password reset email
   * Returns success regardless of email existence
   */
  async requestPasswordReset(email: string): Promise<void>;

  /**
   * Confirm password reset with token
   * Updates user password and invalidates token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void>;

  /**
   * Get current session from cookies
   * Used by middleware
   */
  async getSession(): Promise<Session | null>;

  /**
   * Refresh session token
   * Called automatically by Supabase client
   */
  async refreshSession(): Promise<Session | null>;
}
```

**Error Handling**:
- Wraps Supabase errors in application-specific error types
- Maps Supabase error codes to HTTP status codes
- Provides user-friendly error messages

**Key Implementation Details**:

```typescript
async register(email: string, password: string): Promise<User> {
  const { data, error } = await this.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, // No email confirmation for MVP
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new ConflictError('An account with this email already exists');
    }
    throw new AuthenticationError(error.message);
  }

  if (!data.user) {
    throw new AuthenticationError('Registration failed');
  }

  return data.user;
}

async login(email: string, password: string): Promise<User> {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return generic message for security
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!data.user) {
    throw new AuthenticationError('Login failed');
  }

  return data.user;
}

async requestPasswordReset(email: string): Promise<void> {
  const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.SITE_URL}/reset-password`,
  });

  // Silently fail if email doesn't exist (security)
  if (error && !error.message.includes('User not found')) {
    console.error('Password reset error:', error);
  }

  // Always return success
}
```

#### 2.5.2 Modified RecipeService

**Current State**: Receives user ID as parameter

**Update**: No changes to service interface - already expects user ID
- API endpoints will pass session user ID instead of DEFAULT_USER

#### 2.5.3 Modified DietaryPreferencesService

**Update**: Same as RecipeService - already expects user ID

### 2.6 Supabase Client Configuration

#### 2.6.1 Server-Side Client (SSR)

**File**: `/src/db/supabase.client.ts`

**Current**: Creates basic Supabase client

**Update**: Create SSR-compatible client with cookie handling

```typescript
import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';
import type { AstroCookies } from 'astro';

/**
 * Creates Supabase client for server-side rendering
 * Handles session persistence via cookies
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          cookies.delete(key, options);
        },
      },
    }
  );
}

// Keep existing client for non-SSR contexts (if needed)
export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);

// Remove DEFAULT_USER - no longer needed
```

**Middleware Update**: Use new factory function

```typescript
// In middleware/index.ts
const supabase = createSupabaseServerClient(context.cookies);
```

#### 2.6.2 Environment Variables

**File**: `.env.example` (update)

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Application Configuration
SITE_URL=http://localhost:3000  # Used for email redirect URLs
```

**Note**: `SITE_URL` needed for password reset redirect links

### 2.7 Error Handling

#### 2.7.1 Custom Error Classes

**File**: `/src/lib/errors/auth.errors.ts`

```typescript
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

#### 2.7.2 Error Response Helper

**File**: `/src/lib/utils/api-responses.ts` (append to existing)

```typescript
export function handleAuthError(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: error.message,
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (error instanceof ConflictError) {
    return new Response(
      JSON.stringify({
        error: 'Conflict',
        message: error.message,
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (error instanceof RateLimitError) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: error.message,
        retry_after: error.retryAfter,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Default to 500 for unknown errors
  console.error('Authentication error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Authentication Flow

**Registration**:
1. Client submits email + password to `/api/auth/register`
2. API validates input and calls `AuthService.register()`
3. Service calls `supabase.auth.signUp()`
4. Supabase creates user in `auth.users` table
5. Database trigger creates corresponding row in `public.profiles`
6. Supabase creates session and issues JWT tokens
7. Session stored in cookies automatically
8. Client receives success response and redirects

**Login**:
1. Client submits email + password to `/api/auth/login`
2. API calls `AuthService.login()`
3. Service calls `supabase.auth.signInWithPassword()`
4. Supabase validates credentials against `auth.users`
5. If valid, creates session and issues tokens
6. Session stored in cookies
7. Client receives success and redirects

**Session Management**:
1. Every request includes session cookies
2. Middleware extracts cookies and calls `supabase.auth.getSession()`
3. Supabase validates JWT signature and expiration
4. If valid, user data populated in `context.locals.user`
5. If expired, middleware redirects to login
6. Supabase SDK auto-refreshes tokens before expiration

**Logout**:
1. Client calls `/api/auth/logout`
2. API calls `AuthService.logout()`
3. Service calls `supabase.auth.signOut()`
4. Supabase invalidates session tokens
5. Cookies cleared automatically
6. Client redirects to landing page

**Password Recovery**:
1. Client submits email to `/api/auth/reset-password-request`
2. API calls `AuthService.requestPasswordReset(email)`
3. Service calls `supabase.auth.resetPasswordForEmail()`
4. Supabase generates one-time reset token
5. Supabase sends email with reset link
6. Link format: `{SITE_URL}/reset-password#access_token={token}&type=recovery`
7. User clicks link → lands on reset page with token
8. Client submits new password + token to `/api/auth/reset-password-confirm`
9. API calls `AuthService.confirmPasswordReset()`
10. Service verifies token and updates password
11. Token invalidated after use

#### 3.1.2 Session Cookie Configuration

**Cookie Names** (auto-managed by Supabase):
- `sb-{project-ref}-auth-token` - Access token (JWT)
- `sb-{project-ref}-auth-token-code-verifier` - PKCE verifier (optional)

**Cookie Attributes**:
- `HttpOnly`: true (prevents XSS access)
- `Secure`: true (HTTPS only in production)
- `SameSite`: Lax (CSRF protection)
- `Path`: /
- `Max-Age`: Based on Supabase JWT expiration (default 3600 seconds / 1 hour)

**Token Refresh**:
- Supabase SDK automatically refreshes tokens before expiration
- Refresh token stored in cookie alongside access token
- Refresh happens silently in background
- If refresh fails (e.g., refresh token expired), user logged out

**Concurrent Sessions**:
- Multiple concurrent sessions are supported across different devices/browsers
- Each device maintains its own independent session cookie
- Logging out from one device does not affect sessions on other devices
- All sessions share the same refresh token expiry (7 days from last login)

#### 3.1.3 JWT Structure

Supabase issues JWTs with the following claims:

```json
{
  "sub": "user-uuid",           // User ID
  "email": "user@example.com",   // User email
  "role": "authenticated",       // User role (Supabase default)
  "iat": 1234567890,             // Issued at
  "exp": 1234571490,             // Expires at (default 1 hour)
  "iss": "supabase"              // Issuer
}
```

**Usage**:
- Middleware validates JWT on every request
- User ID (`sub`) used for database queries
- RLS policies use `auth.uid()` function which extracts `sub` from JWT

#### 3.1.4 Supabase Configuration

**Email Templates** (configured in Supabase Dashboard):

**Password Reset Email**:
```html
<h2>Reset your password</h2>
<p>Follow this link to reset the password for your HealthyMeal account:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

**Confirmation URL Pattern**: `{{ .SiteURL }}/reset-password`

**Auth Settings** (Supabase Dashboard > Authentication > Settings):
- **Site URL**: `http://localhost:3000` (dev) / production URL
- **Email Confirmation**: Disabled for MVP (can enable later)
- **Password Requirements**: Minimum 6 characters (enforced by Supabase, we add client-side requirements)
- **JWT Expiry**: 3600 seconds (1 hour)
- **Refresh Token Expiry**: 604800 seconds (7 days)
- **Enable Email Provider**: Yes
- **SMTP Settings**: Use Supabase default or configure custom SMTP

**Security Settings**:
- **Rate Limiting**: Enable (default Supabase limits)
- **Enable CAPTCHA**: Optional (can add later)
- **Enable MFA**: Future enhancement
- **Session Management**: Cookie-based (SSR mode)

#### 3.1.5 Security Best Practices

**Password Security**:
- Minimum 8 characters enforced client-side
- Complexity requirements (uppercase, number, special char)
- Supabase hashes passwords with bcrypt
- No password hints or recovery questions

**Session Security**:
- Sessions stored in HttpOnly cookies (XSS protection)
- Short-lived access tokens (1 hour)
- Longer-lived refresh tokens (7 days)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)

**API Security**:
- All auth endpoints have rate limiting
- Generic error messages prevent enumeration
- CORS configured to allow only app domain
- RLS policies enforce data isolation

**Email Security**:
- Reset tokens single-use and short-lived (1 hour)
- Reset emails don't confirm account existence
- No sensitive data in email content

### 3.2 Protected Route Strategy

#### 3.2.1 Route Protection Levels

**Public Routes** (no auth required):
- `/` (landing page)
- `/login`
- `/register`
- `/reset-password`
- `/api/auth/*` (all auth endpoints)

**Protected Routes** (auth required):
- `/recipes`
- `/recipes/new`
- `/recipes/[id]`
- `/profile`
- `/api/recipes*` (all recipe endpoints)
- `/api/profile/*` (all profile endpoints)

**Semi-Protected Routes** (redirect if authenticated):
- `/login` → redirect to `/recipes`
- `/register` → redirect to `/recipes`

#### 3.2.2 Middleware Implementation

Middleware handles protection at two levels:

**Page Level**:
- Executed before page SSR
- Checks session existence
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

**API Level**:
- Validated before endpoint handler
- Returns 401 for unauthenticated requests
- No redirect (API endpoints return JSON errors)

**Implementation Pattern**:

```typescript
// Middleware checks session
if (!context.locals.user) {
  // API endpoints return 401
  if (context.url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Pages redirect to login
  return context.redirect(`/login?returnUrl=${encodedPath}`);
}
```

#### 3.2.3 Client-Side Navigation

**Astro View Transitions**:
- Already configured with `<ClientRouter />`
- Middleware runs on navigation (not just page load)
- Session checked on every route change
- Seamless redirects with view transitions

**React Component Navigation**:
- Use `navigate()` from `astro:transitions/client`
- Triggers full middleware check
- Example: `navigate('/recipes')` after login

### 3.3 Server-Side Rendering Updates

#### 3.3.1 Modified Page Components

All pages using `AuthenticatedLayout` need updates:

**Before**:
```astro
---
const userEmail = "test"; // Hardcoded
const userId = DEFAULT_USER; // Hardcoded
---
```

**After**:
```astro
---
export const prerender = false; // Enable SSR

// Middleware ensures user exists or redirects
const userEmail = Astro.locals.user!.email;
const userId = Astro.locals.user!.id;

// API calls now use session cookies, no need to pass userId in URL
const response = await fetch(`${Astro.url.origin}/api/recipes`);
---
```

#### 3.3.2 SSR Configuration

**astro.config.mjs** - Already configured correctly:
```javascript
export default defineConfig({
  output: "server",  // SSR enabled
  adapter: node({ mode: "standalone" }),
});
```

**Page-Level Configuration**:
- All protected pages: `export const prerender = false`
- Auth pages: `export const prerender = false`
- Landing page: Can be static or dynamic (dynamic recommended to check session)

#### 3.3.3 Data Fetching Patterns

**Server-Side (Astro Pages)**:
```astro
---
// Fetch data server-side during SSR
const response = await fetch(`${Astro.url.origin}/api/recipes`, {
  headers: {
    Cookie: Astro.request.headers.get('Cookie') || '',
  },
});

const data = await response.json();
---

<Component client:load initialData={data} />
```

**Client-Side (React Components)**:
```typescript
// Client components use fetch with credentials
const response = await fetch('/api/recipes', {
  credentials: 'include',  // Send cookies
});
```

**Key Principle**:
- Session cookies automatically sent with both SSR and client requests
- No need to pass user ID explicitly - extracted server-side from session
- API endpoints extract `locals.user.id` from middleware

---

## 4. COMPONENT CONTRACTS

### 4.1 Component Hierarchy

```
Pages (Astro SSR)
├── Login Page
│   └── LoginForm (React)
│       └── useLogin hook
├── Register Page
│   └── RegisterForm (React)
│       └── useRegister hook
├── Reset Password Page
│   └── ResetPasswordForm (React)
│       └── useResetPassword hook
├── Recipes Page (Protected)
│   └── RecipeListView (React)
│       └── useRecipeList hook (updated)
├── Profile Page (Protected)
│   └── ProfileView (React)
│       └── useDietaryPreferences hook (updated)
└── Authenticated Layout
    └── GlobalNavigation (React)
        └── UserMenu
            └── useLogout hook (updated)
```

### 4.2 Custom Hooks Contracts

#### 4.2.1 useLogin Hook

**File**: `/src/components/hooks/useLogin.ts`

**Interface**:
```typescript
interface UseLoginReturn {
  login: (email: string, password: string, returnUrl?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

export function useLogin(): UseLoginReturn;
```

**Responsibilities**:
- Call `/api/auth/login` with credentials
- Handle loading state
- Handle and format errors
- Navigate on success

#### 4.2.2 useRegister Hook

**File**: `/src/components/hooks/useRegister.ts`

**Interface**:
```typescript
interface UseRegisterReturn {
  register: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  passwordStrength: 'weak' | 'medium' | 'strong' | null;
  resetError: () => void;
}

export function useRegister(): UseRegisterReturn;
```

**Responsibilities**:
- Validate password strength
- Call `/api/auth/register`
- Handle errors
- Navigate to recipes on success

#### 4.2.3 useResetPassword Hook

**File**: `/src/components/hooks/useResetPassword.ts`

**Interface**:
```typescript
interface UseResetPasswordReturn {
  requestReset: (email: string) => Promise<void>;
  confirmReset: (token: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  resetState: () => void;
}

export function useResetPassword(): UseResetPasswordReturn;
```

**Responsibilities**:
- Handle both request and confirm flows
- Call appropriate endpoints
- Manage success/error states

#### 4.2.4 useLogout Hook (Updated)

**File**: `/src/components/hooks/useLogout.ts`

**Current**: Calls `/api/auth/logout` (endpoint doesn't exist yet)

**Update**: Implementation remains same, endpoint will be created

### 4.3 Validation Schemas

**File**: `/src/lib/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password should contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password should contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password should contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password should contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password should contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password should contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Server-side validation (less strict, formats only)
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

---

## 5. IMPLEMENTATION CHECKLIST

### 5.1 Database Setup
- [ ] Create database trigger for auto-creating profiles
- [ ] Verify foreign key relationships (profiles, recipes, dietary_preferences)
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for profiles, recipes, dietary_preferences, recipe_ai_metadata
- [ ] Test RLS policies with different users

### 5.2 Supabase Configuration
- [ ] Configure Site URL in Supabase Dashboard
- [ ] Set up email templates (password reset)
- [ ] Configure SMTP settings (or use Supabase default)
- [ ] Set JWT expiration times
- [ ] Enable rate limiting
- [ ] Test email delivery

### 5.3 Backend Implementation
- [ ] Update `src/db/supabase.client.ts` - add SSR client factory
- [ ] Update `src/middleware/index.ts` - session extraction and route protection
- [ ] Update `src/env.d.ts` - add Locals interface for user/session
- [ ] Create `src/lib/services/auth.service.ts` - AuthService class
- [ ] Create `src/lib/errors/auth.errors.ts` - custom error classes
- [ ] Create `src/lib/schemas/auth.schema.ts` - validation schemas
- [ ] Update `src/lib/utils/api-responses.ts` - add auth error handler
- [ ] Create `src/pages/api/auth/register.ts` - registration endpoint
- [ ] Create `src/pages/api/auth/login.ts` - login endpoint
- [ ] Create `src/pages/api/auth/logout.ts` - logout endpoint
- [ ] Create `src/pages/api/auth/reset-password-request.ts` - request reset endpoint
- [ ] Create `src/pages/api/auth/reset-password-confirm.ts` - confirm reset endpoint
- [ ] Update all `/api/recipes*` endpoints - use session user ID
- [ ] Update all `/api/profile/*` endpoints - use session user ID
- [ ] Update `src/types.ts` - add auth DTOs

### 5.4 Frontend - Pages
- [ ] Create `src/pages/login.astro` - login page
- [ ] Create `src/pages/register.astro` - registration page
- [ ] Create `src/pages/reset-password.astro` - password reset page
- [ ] Update `src/pages/index.astro` - redirect if authenticated
- [ ] Update `src/pages/recipes.astro` - use session user
- [ ] Update `src/pages/recipes/[id].astro` - use session user
- [ ] Update `src/pages/recipes/new.astro` - use session user
- [ ] Update `src/pages/profile.astro` - use session user email
- [ ] Update `src/layouts/AuthenticatedLayout.astro` - extract user from session
- [ ] Update `src/layouts/LandingLayout.astro` - verify auth links work

### 5.5 Frontend - Components
- [ ] Create `src/components/auth/LoginForm.tsx` - login form
- [ ] Create `src/components/auth/RegisterForm.tsx` - registration form
- [ ] Create `src/components/auth/ResetPasswordForm.tsx` - reset form
- [ ] Create `src/components/hooks/useLogin.ts` - login hook
- [ ] Create `src/components/hooks/useRegister.ts` - register hook
- [ ] Create `src/components/hooks/useResetPassword.ts` - reset hook
- [ ] Update `src/components/hooks/useLogout.ts` - ensure works with new endpoint
- [ ] Update `src/components/navigation/GlobalNavigation.tsx` - verify email prop usage
- [ ] Test all form validations and error states

### 5.6 Styling
- [ ] Style login page (centered card, responsive)
- [ ] Style registration page (password requirements display)
- [ ] Style reset password page (dual mode layouts)
- [ ] Ensure all forms match existing UI patterns
- [ ] Test dark mode compatibility (if implemented)
- [ ] Test mobile responsiveness for all auth pages

### 5.7 Testing
- [ ] Test registration flow (happy path)
- [ ] Test registration with existing email (conflict)
- [ ] Test registration with weak password (validation)
- [ ] Test login flow (happy path)
- [ ] Test login with invalid credentials (unauthorized)
- [ ] Test logout flow
- [ ] Test password reset request (existing email)
- [ ] Test password reset request (non-existing email - should still succeed)
- [ ] Test password reset confirmation (valid token)
- [ ] Test password reset confirmation (expired token)
- [ ] Test password reset confirmation (weak password)
- [ ] Test protected route access while unauthenticated (redirect to login)
- [ ] Test protected route access with returnUrl
- [ ] Test auth page access while authenticated (redirect to recipes)
- [ ] Test session expiration (redirect to login)
- [ ] Test session refresh (stay logged in)
- [ ] Test concurrent sessions in multiple tabs
- [ ] Test RLS policies (users can't access other users' data)
- [ ] Test rate limiting on all auth endpoints
- [ ] Test email delivery for password reset
- [ ] Test all error messages display correctly
- [ ] Test accessibility (keyboard navigation, screen readers)

### 5.8 Documentation
- [ ] Update README with auth setup instructions
- [ ] Document Supabase configuration steps
- [ ] Document environment variables
- [ ] Document RLS policies
- [ ] Document email template setup

---

## 6. TECHNICAL NOTES

### 6.1 Supabase SSR Package

**Required**: Install `@supabase/ssr` package

```bash
npm install @supabase/ssr
```

**Purpose**: Provides `createServerClient` function for SSR cookie handling

### 6.2 Environment Variables

Add to `.env`:
```bash
SITE_URL=http://localhost:3000
```

Required for password reset email redirect URLs.

### 6.3 TypeScript Types

Supabase types already generated in `src/db/database.types.ts`. Additional types from `@supabase/supabase-js`:
- `User` - user object from auth
- `Session` - session object with tokens
- `AuthError` - Supabase auth errors

### 6.4 Migration Strategy

**Phase 1 - Backend Setup**:
1. Database triggers and RLS policies
2. Supabase email configuration
3. Update middleware and Supabase client

**Phase 2 - API Endpoints**:
1. Create AuthService
2. Create auth API endpoints
3. Update existing API endpoints to use session

**Phase 3 - Frontend Pages**:
1. Create auth pages (login, register, reset)
2. Update protected pages to use session

**Phase 4 - Frontend Components**:
1. Create auth form components
2. Create custom hooks
3. Update navigation components

**Phase 5 - Testing & Polish**:
1. Comprehensive testing
2. Error handling refinement
3. Accessibility audit
4. UX improvements

### 6.5 Backward Compatibility

**Breaking Changes**:
- `DEFAULT_USER` constant removed - all data scoped to actual users
- Hardcoded emails removed from layouts
- All API endpoints require authentication

**Migration Path**:
- No data migration needed (if starting fresh)
- If existing data tied to DEFAULT_USER, create migration script to associate with real user

### 6.6 Security Considerations Summary

- **Passwords**: Hashed with bcrypt by Supabase
- **Sessions**: JWT tokens in HttpOnly cookies
- **CSRF**: SameSite=Lax cookies
- **XSS**: HttpOnly cookies prevent JS access
- **SQL Injection**: Parameterized queries via Supabase client
- **Enumeration**: Generic error messages
- **Rate Limiting**: Enforced on all auth endpoints
- **RLS**: Database-level isolation between users

---

## 7. FUTURE ENHANCEMENTS (Post-MVP)

- Email verification on registration
- Social login (Google, GitHub)
- Multi-factor authentication (MFA)
- Account deletion functionality
- Email change with verification
- Remember me functionality (longer sessions)
- Account recovery via security questions
- Admin panel for user management
- Audit logs for security events
- CAPTCHA on registration/login
- Progressive Web App (offline auth state)

---

## END OF SPECIFICATION
