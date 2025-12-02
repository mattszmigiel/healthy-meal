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