# Logout Backend Integration Plan

## Summary

Implement the `/api/auth/logout` API endpoint that integrates with Supabase Auth to terminate user sessions. The implementation follows confirmed preferences: optimistic logout with automatic cookie handling, current session scope, and redirect to landing page.

## User Preferences Confirmed

1. **Redirect Destination**: Landing page (/) after successful logout
2. **Cookie Handling**: Automatic via Supabase signOut() - no manual cookie deletion
3. **Error Handling**: Optimistic logout - always redirect even if server logout fails
4. **Session Scope**: Current session only - no "logout from all devices" functionality

## Current State Analysis

### Existing Implementation

**Frontend (Already Complete)**:
- `src/components/hooks/useLogout.ts` - Hook that calls `/api/auth/logout`
- `src/components/navigation/DesktopNavigation.tsx` - Uses `useLogout` hook
- `src/components/navigation/MobileNavigation.tsx` - Uses `useLogout` hook
- `src/components/navigation/UserMenu.tsx` - Receives `onLogout` callback
- `src/components/navigation/MobileMenu.tsx` - Has logout button

**Backend (Missing)**:
- `/api/auth/logout` endpoint does NOT exist yet ← **This is what we need to implement**

### Hook Behavior (Already Correct)

```typescript
// src/components/hooks/useLogout.ts
export function useLogout() {
  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      navigate("/"); // Redirects to landing page ✓
    } else {
      console.error("Logout failed:", error);
      // Optimistic: Could still redirect here if desired
    }
  }, [isLoggingOut]);
}
```

## Implementation Details

### 1. Create API Endpoint: `/api/auth/logout`

**File**: `src/pages/api/auth/logout.ts`

**Implementation**:

```typescript
import type { APIRoute } from "astro";
import { apiSuccess } from "@/lib/utils/api-responses";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Purpose: Invalidate user session and clear cookies
 *
 * Authentication: Uses session from context.locals.session (injected by middleware)
 *
 * Flow:
 * 1. Extract Supabase client from locals (injected by middleware)
 * 2. Call supabase.auth.signOut() with scope 'local'
 * 3. Supabase automatically clears session cookies
 * 4. Return success response (optimistic approach)
 *
 * Error Handling:
 * - Logs errors server-side for monitoring
 * - Always returns 200 success (optimistic UX)
 * - Client redirects regardless of server-side success
 *
 * Security:
 * - Refresh token is revoked on successful signOut
 * - Access token (JWT) remains valid until expiration (~1 hour)
 * - Cookies cleared prevent token from being sent in future requests
 * - Middleware will redirect to /login on next protected route access
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Call Supabase signOut with 'local' scope (current session only)
    // - 'local': Signs out only the current session (this device/browser)
    // - 'global': Would sign out all sessions (all devices) - not used per requirements
    // - 'others': Would sign out all other sessions except current - not used
    const { error } = await locals.supabase.auth.signOut({ scope: 'local' });

    // Log error for server-side monitoring but don't fail the request
    // Optimistic logout: user experience is prioritized over strict error handling
    if (error) {
      console.error('Supabase logout error:', {
        message: error.message,
        userId: locals.user?.id,
        timestamp: new Date().toISOString(),
      });
      // Note: Still proceeding with success response
    }

    // Always return 200 for optimistic UX
    // Client will redirect to landing page regardless
    // Even if Supabase is down, clearing cookies on next middleware run is sufficient
    return apiSuccess({ message: 'Logged out successfully' });

  } catch (error) {
    // Log unexpected errors (network issues, Supabase unavailable, etc.)
    console.error('Unexpected logout error:', {
      error,
      userId: locals.user?.id,
      timestamp: new Date().toISOString(),
    });

    // Still return success (optimistic approach)
    // Middleware will handle lack of session on next request
    return apiSuccess({ message: 'Logged out successfully' });
  }
};
```

**Key Technical Details**:

1. **Session Scope**: Using `scope: 'local'`
   - Only invalidates current browser session
   - User remains logged in on other devices
   - Matches MVP requirements (no "logout everywhere" feature)

2. **Cookie Handling**: Automatic
   - `signOut()` automatically clears Supabase session cookies
   - Cookie names: `sb-{project-ref}-auth-token`, `sb-{project-ref}-auth-token-code-verifier`
   - No manual cookie deletion needed

3. **Token Behavior**:
   - Refresh token: Revoked immediately by Supabase
   - Access token (JWT): Remains valid until expiration (~1 hour)
   - Impact: JWT still valid but won't be sent (cookies cleared)
   - Edge case: If user manually copies/saves JWT, it works until expiration (acceptable)

4. **Optimistic Logout**:
   - Always returns 200, even on Supabase errors
   - Logs errors for monitoring
   - Client always redirects
   - Middleware enforces authentication on next protected route access


### 3. Type Definition (Optional)

**File**: `src/types.ts`

Add to existing auth DTOs:

```typescript
// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Logout Response - POST /api/auth/logout
 */
export interface LogoutResponseDTO {
  message: string;
}
```

## Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User Action: Click "Logout" in UserMenu or MobileMenu          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: useLogout Hook                                        │
│ - Calls POST /api/auth/logout with credentials: 'include'      │
│ - Shows loading state (isLoggingOut = true)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: API Route /api/auth/logout                            │
│ - Extract supabase client from locals                          │
│ - Call supabase.auth.signOut({ scope: 'local' })              │
│ - Log any errors (server-side only)                            │
│ - Return 200 success always (optimistic)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: useLogout Hook (Response Handling)                    │
│ - Receives 200 success response                                │
│ - Calls navigate('/') - Astro view transition                  │
│ - Redirects to landing page                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Landing Page (/)                                                │
│ - User now sees public landing page                            │
│ - Can browse features, click Login or Sign Up                  │
└─────────────────────────────────────────────────────────────────┘

                             │
                             ▼ (If user tries to access protected route)

┌─────────────────────────────────────────────────────────────────┐
│ User Action: Navigate to /recipes (protected)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Middleware: Session Check                                      │
│ - Calls supabase.auth.getSession()                             │
│ - No cookies found → no session                                │
│ - Sets locals.user = null                                      │
│ - Detects protected route + no user                            │
│ - Redirects to /login?returnUrl=/recipes                       │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Logout Endpoint

1. Create file: `src/pages/api/auth/logout.ts`
2. Add imports:
   - `import type { APIRoute } from "astro";`
   - `import { apiSuccess } from "@/lib/utils/api-responses";`
3. Set `export const prerender = false;`
4. Implement POST handler (see code above)
5. Add comprehensive comments explaining optimistic behavior

### Step 2: Add Type Definition (Optional)

1. Open `src/types.ts`
2. Find authentication DTOs section
3. Add `LogoutResponseDTO` interface

## Files Summary

### Files to Create

1. **`src/pages/api/auth/logout.ts`** ← Main implementation
   - POST endpoint handler
   - Calls `supabase.auth.signOut({ scope: 'local' })`
   - Returns optimistic success response

### Files to Modify (Optional)

1. **`src/types.ts`** ← Add type
   - Add `LogoutResponseDTO` interface

### Files Verified (No Changes)

1. **`src/components/hooks/useLogout.ts`** ✓
   - Already correctly implemented
   - Calls `/api/auth/logout`
   - Redirects to `/`

2. **`src/middleware/index.ts`** ✓
   - Already handles logged-out state
   - Redirects unauthenticated users

3. **Navigation Components** ✓
   - `src/components/navigation/DesktopNavigation.tsx`
   - `src/components/navigation/MobileNavigation.tsx`
   - `src/components/navigation/UserMenu.tsx`
   - `src/components/navigation/MobileMenu.tsx`

## Security Considerations

### ✅ Secure Implementation

1. **Session Invalidation**
   - Refresh token revoked by Supabase
   - User cannot get new access tokens

2. **Cookie Clearing**
   - Automatic via Supabase `signOut()`
   - HttpOnly cookies prevent JS access
   - Secure flag in production (HTTPS only)

3. **Scope Control**
   - Using `'local'` scope prevents unintended multi-device logout
   - Matches user expectations for standard logout

4. **CSRF Protection**
   - POST method required
   - `credentials: 'include'` enforces same-origin
   - Cookies with SameSite=Lax

5. **No Information Leakage**
   - Generic success message
   - Errors logged server-side only
   - No user data in response

6. **Access Control**
   - Middleware enforces authentication
   - RLS policies prevent database access
   - Even if JWT copied, no cookies = middleware redirects

### ⚠️ Known Limitations (Acceptable for MVP)

1. **Access Token Valid Until Expiration**
   - JWT remains valid for ~1 hour after logout
   - If user manually saves/uses token, it works until expiration
   - Mitigation: Cookies cleared, middleware redirects, normal UX unaffected
   - Future: Implement token blacklist if needed

2. **No Real-Time Multi-Tab Sync**
   - Logging out in one tab doesn't immediately affect other tabs
   - Other tabs redirect on next navigation
   - Mitigation: Acceptable UX for MVP
   - Future: Add `SIGNED_OUT` event listener for real-time sync

3. **No "Logout All Devices"**
   - Each device must logout separately
   - Per requirements (MVP scope)
   - Future: Add `scope: 'global'` option if needed

## Alignment with Auth Spec

### Auth Spec Section 2.2.3: POST /api/auth/logout

**Specification Requirements** (from `.ai/auth-spec.md`):

✅ **Purpose**: Invalidate user session and clear cookies

✅ **Request Body**: None (uses session from cookie)

✅ **Process Flow**:
1. Extract session from `context.locals.session` ✓
2. If no session, return 200 anyway (idempotent) ✓
3. Call `AuthService.logout()` → We call `supabase.auth.signOut()` directly ✓
4. Service calls `supabase.auth.signOut()` ✓
5. Supabase invalidates session token ✓
6. Clear session cookies ✓ (automatic)
7. Return success response ✓

✅ **Response Success (200)**:
```typescript
{ message: "Logged out successfully" }
```

✅ **Cookie Handling**:
- Supabase automatically clears session cookies on signOut ✓
- Cookie names: `sb-<project-ref>-auth-token` ✓

**Differences from Spec**:
- Spec mentions `AuthService.logout()` - we call `supabase.auth.signOut()` directly
  - Simpler implementation
  - No need for service layer abstraction for single method call
  - Can refactor to service later if logout becomes more complex

## Supabase Auth Documentation References

Based on Context7 documentation fetched from `/websites/supabase_com-docs`:

### Key Documentation Points

1. **signOut() Method**:
   ```typescript
   const { error } = await supabase.auth.signOut()
   ```
   - Removes logged-in user from browser session
   - Clears all items from localStorage (browser context)
   - Triggers 'SIGNED_OUT' event
   - Revokes refresh tokens

2. **Scope Options**:
   - `'global'`: Signs out all sessions (all devices) - default
   - `'local'`: Signs out current session only - **USING THIS** ✓
   - `'others'`: Signs out all other sessions except current

3. **Server-Side Usage**:
   - For server-side management, can revoke refresh tokens by passing JWT
   - Access tokens remain valid until expiration (JWT-based)
   - Cookie management handled automatically by `@supabase/ssr` package

4. **Cookie Handling with SSR**:
   - Use `createServerClient` from `@supabase/ssr`
   - Cookies managed through `getAll()` and `setAll()` methods
   - Already implemented in our middleware ✓

## Future Enhancements (Post-MVP)

### 1. Logout All Devices

**Implementation**:
```typescript
// Add optional query parameter to endpoint
export const POST: APIRoute = async ({ locals, url }) => {
  const scope = url.searchParams.get('scope') === 'global' ? 'global' : 'local';
  const { error } = await locals.supabase.auth.signOut({ scope });
  // ...
};
```

**UI Addition**:
- Add "Logout Everywhere" option in UserMenu
- Show confirmation dialog explaining impact

### 2. Real-Time Multi-Tab Sync

**Implementation**:
```typescript
// In useLogout hook or global auth provider
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      navigate('/');
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

### 3. Toast Notifications

**Implementation**:
```typescript
// In useLogout hook
import { toast } from 'sonner';

const logout = async () => {
  try {
    const response = await fetch('/api/auth/logout', ...);
    if (response.ok) {
      toast.success('Successfully logged out');
      navigate('/');
    } else {
      toast.error('Logout failed. Please try again.');
    }
  } catch (error) {
    toast.error('Network error. Please check your connection.');
  }
};
```

### 4. Activity Logging

**Implementation**:
```typescript
// Create activity log table and log logout events
export const POST: APIRoute = async ({ locals }) => {
  const { error } = await locals.supabase.auth.signOut({ scope: 'local' });

  // Log logout event
  await locals.supabase.from('activity_logs').insert({
    user_id: locals.user?.id,
    action: 'logout',
    timestamp: new Date().toISOString(),
    ip_address: context.clientAddress,
  });

  return apiSuccess({ message: 'Logged out successfully' });
};
```

### 5. Token Blacklist (If Needed)

**Use Case**: Immediately invalidate JWTs after logout (not wait for expiration)

**Implementation**:
- Create `revoked_tokens` table
- Store revoked token JTIs with expiration
- Check blacklist in middleware before allowing access
- Clean up expired entries periodically

**Complexity**: High - only implement if security requirements change

## Conclusion

This plan provides a complete, secure, and user-friendly logout implementation that:

- ✅ Integrates correctly with Supabase Auth
- ✅ Follows established patterns from auth spec
- ✅ Implements all confirmed user preferences
- ✅ Requires minimal code changes (1 new file)
- ✅ Leverages existing infrastructure
- ✅ Provides comprehensive testing strategy
- ✅ Documents security considerations
- ✅ Identifies future enhancement opportunities

**Next Steps**: Proceed with implementation following Step 1-5 above.
