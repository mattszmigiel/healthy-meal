# Test Plan - HealthyMeal Application

## 1. Test Objectives

The testing objectives for the HealthyMeal application are to:

- **Validate Core Functionality**: Ensure all functional requirements from the PRD are working correctly, including authentication, recipe management, dietary preferences, and AI-powered recipe modification
- **Ensure Data Security**: Verify Row-Level Security (RLS) enforcement in Supabase to prevent unauthorized access to user data
- **Validate AI Integration**: Confirm reliable integration with OpenRouter API and proper handling of AI-generated content
- **Verify User Experience**: Ensure responsive UI, proper form validation, error handling, and loading states across all user flows
- **Maintain Code Quality**: Establish automated testing infrastructure to prevent regressions and support continuous delivery
- **Performance Validation**: Ensure acceptable response times for API endpoints and AI modification requests
- **Cross-Browser Compatibility**: Validate functionality across modern browsers (Chrome, Firefox, Safari, Edge)

## 2. Scope

### In Scope

**Authentication & Authorization (FR-001 to FR-005)**
- User registration with email/password validation
- User login with session management
- Password recovery flow with email reset links
- Logout functionality and session cleanup
- Unauthorized access prevention

**User Profile & Dietary Preferences (FR-006 to FR-009)**
- Profile viewing and management
- Adding multiple dietary preferences (allergies, diet types, restrictions, dislikes)
- Editing existing preferences
- Persistence of preferences across sessions

**Recipe Management (FR-010 to FR-015)**
- Creating recipes with title and content
- Viewing recipe lists (sorted by creation date)
- Viewing individual recipe details
- Deleting recipes with confirmation
- Row-Level Security enforcement (users can only access their own recipes)

**AI-Powered Recipe Modification (FR-018 to FR-025)**
- Recipe modification based on dietary preferences
- OpenRouter API integration
- AI-modified recipe display
- Saving AI-modified recipes as new entries
- Original vs. AI-modified recipe indication
- Error handling for AI service failures

**Data Management & Security (FR-026 to FR-028)**
- Data integrity for all CRUD operations
- Supabase RLS policy enforcement
- Input validation with Zod schemas

**User Interface (FR-029 to FR-032)**
- Responsive design (desktop and mobile)
- Navigation between sections
- Loading states and visual feedback
- Form validation error messages

### Out of Scope

The following features are explicitly out of scope for the MVP and will NOT be tested:
- Recipe search and filtering
- Recipe import from external URLs
- Image/multimedia support
- Recipe sharing between users
- Social features (comments, likes, following)
- Public recipe discovery
- Rating/review systems
- Meal planning features
- Shopping list generation
- Nutritional calculations
- Recipe versioning/history
- Multi-language support

## 3. Tech Stack & Testing Implications

### Frontend Technologies

**Astro 5 (SSR Mode)**
- Testing Implication: Requires testing both server-side rendering and client-side hydration
- Approach: Use Vitest for unit tests, Playwright for E2E tests that validate SSR behavior
- Consideration: Test View Transitions API for smooth navigation

**React 19**
- Testing Implication: Component testing with modern React features (hooks, Suspense)
- Approach: React Testing Library for component tests, test custom hooks in isolation
- Consideration: Test React.memo, lazy loading, and useOptimistic for optimistic UI

**TypeScript 5**
- Testing Implication: Type safety reduces need for some runtime checks
- Approach: Leverage TypeScript in test files, use type assertions
- Consideration: Test Zod schema validation separately from TypeScript types

**Tailwind CSS 4**
- Testing Implication: Visual regression testing for responsive design
- Approach: Playwright screenshot testing for critical UI states
- Consideration: Test responsive breakpoints (sm, md, lg) and dark mode variants

**Shadcn/ui Components**
- Testing Implication: Third-party component library needs integration testing
- Approach: Test component integration, accessibility (ARIA), and user interactions
- Consideration: Focus on custom implementations, not library internals

### Backend Technologies

**Supabase (PostgreSQL + Auth + RLS)**
- Testing Implication: Database state management, authentication, and security policies
- Approach: Use Supabase local development or dedicated test database
- Consideration: Test RLS policies thoroughly to prevent data leaks

**Node.js Adapter (Standalone Mode)**
- Testing Implication: Server-side code execution and API routes
- Approach: Integration tests for API endpoints using Supertest
- Consideration: Test middleware injection of Supabase client

**Zod Validation**
- Testing Implication: Schema validation needs comprehensive edge case testing
- Approach: Unit tests for each schema with valid/invalid inputs
- Consideration: Test error message quality and structure

### AI Integration

**OpenRouter API (gpt-4o-mini)**
- Testing Implication: External API dependency with rate limits and costs
- Approach: Mock API responses for most tests, limited real API tests
- Consideration: Test retry logic, error handling, timeout scenarios

### Development Tools

**ESLint, Prettier, Husky**
- Testing Implication: Code quality gates before commits
- Approach: No direct testing needed, enforce via pre-commit hooks
- Consideration: Ensure test files follow linting rules

## 4. Test Strategy

### Overall Approach

The HealthyMeal testing strategy follows a **pyramid approach** with emphasis on fast, reliable unit and integration tests, supported by critical E2E tests for key user flows.

**Testing Pyramid Distribution:**
- 60% Unit Tests (services, utilities, schemas, helpers)
- 25% Integration Tests (API routes, component integration, database operations)
- 15% End-to-End Tests (critical user flows, cross-feature scenarios)

### Testing Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Isolation**: Each test should be independent and not rely on execution order
3. **Fast Feedback**: Prioritize fast-running tests for quick developer feedback
4. **Realistic Data**: Use realistic test data that mirrors production scenarios
5. **Maintainability**: Keep tests simple, readable, and easy to maintain
6. **Mock External Dependencies**: Mock OpenRouter API, email service, and external calls
7. **Test Database Isolation**: Each test suite should start with clean database state

### Test Development Workflow

1. Write failing test first (TDD approach for new features)
2. Implement minimum code to pass the test
3. Refactor while keeping tests green
4. Run full test suite before committing
5. CI/CD pipeline runs all tests on push

### Continuous Integration

- All tests run automatically on pull requests via GitHub Actions
- Block merges if tests fail
- Generate and track code coverage reports
- Fail builds if coverage drops below thresholds (target: 80% overall)

## 5. Test Types

### 5.1 Unit Testing

**Target**: Individual functions, services, utilities, and schemas in isolation

**Coverage Areas:**
- **Services** (`src/lib/services/`):
  - RecipeService: CRUD operations, business logic
  - AIPreviewService: Prompt construction, response validation
  - DietaryPreferencesService: Preference management
  - OpenRouterService: API communication, retry logic

- **Validation Schemas** (`src/lib/schemas/`):
  - All Zod schemas with valid and invalid inputs
  - Edge cases (empty strings, special characters, boundary values)

- **Utilities** (`src/lib/utils/`):
  - Logger functions
  - API response helpers (apiSuccess, apiError)
  - Rate limiter logic

**Tools**: Vitest

**Example Test Cases:**
- RecipeService.createRecipe() validates required fields
- RecipeService.createRecipe() throws error when title is empty
- AIPreviewService validates OpenRouter API response structure
- createRecipeSchema rejects invalid email format
- Rate limiter allows N requests per minute and blocks excess

### 5.2 Integration Testing

**Target**: Interactions between components, API routes with services, database operations

**Coverage Areas:**
- **API Routes** (`src/pages/api/`):
  - Request validation with Zod schemas
  - Response format consistency (apiSuccess/apiError)
  - Authentication middleware
  - Service instantiation with Supabase client

- **Database Integration**:
  - Supabase client operations
  - RLS policy enforcement
  - Data persistence and retrieval

- **Component Integration**:
  - Form submission flows
  - State management with hooks
  - React Hook Form + Zod validation

**Tools**: Vitest + Supertest for API testing

**Example Test Cases:**
- POST /api/recipes creates recipe and returns 201 with RecipeResponseDTO
- POST /api/recipes returns 400 with validation errors for invalid input
- GET /api/recipes/[id] returns 404 for non-existent recipe
- GET /api/recipes/[id] returns 403 when accessing another user's recipe (RLS)
- POST /api/recipes/[id]/ai-preview returns modified recipe
- RecipeForm component submits data and displays success toast

### 5.3 End-to-End Testing

**Target**: Complete user flows across multiple pages and features

**Coverage Areas:**
- **Authentication Flows**:
  - Complete registration → login → access protected page
  - Password reset request → email link → password change → login
  - Session persistence across page navigation
  - Logout → verify cannot access protected routes

- **Recipe Management Flows**:
  - Create recipe → view in list → view details → delete → verify removal
  - Create multiple recipes → verify sort order (most recent first)

- **AI Modification Flow**:
  - Set dietary preferences → create recipe → modify with AI → save as new → verify both exist
  - Modify recipe without preferences → verify handling

- **Cross-Feature Scenarios**:
  - Complete user journey: Register → set preferences → create recipe → modify → logout → login → verify data persists

**Tools**: Playwright

**Example Test Cases:**
- User can complete full registration and login flow
- User can create recipe, modify it with AI, and save both versions
- User can only see their own recipes (not other users' recipes)
- Navigation works correctly with View Transitions API
- Mobile responsive design works on different viewport sizes

### 5.4 Component Testing

**Target**: React components in isolation with various props and states

**Coverage Areas:**
- **Forms** (`src/components/auth/`, `src/components/recipes/`):
  - LoginForm, RegisterForm, ResetPasswordForm
  - RecipeForm (create/edit modes)
  - DietaryPreferencesForm

- **UI Components**:
  - RecipeCard, RecipeList
  - UserMenu, GlobalNav
  - Loading states, error states, empty states

- **Custom Hooks** (`src/components/hooks/`):
  - Hook state management
  - Side effects and cleanup

**Tools**: Vitest + React Testing Library

**Example Test Cases:**
- LoginForm validates email format before submission
- LoginForm displays error message on failed login
- RecipeForm shows loading spinner during submission
- RecipeCard displays correct recipe title and truncated content
- UserMenu shows user email and logout button
- RecipeList shows empty state message when no recipes exist

### 5.5 API Testing

**Target**: API endpoint contracts, request/response validation, error handling

**Coverage Areas:**
- **Request Validation**:
  - All API routes validate input with Zod schemas
  - Proper error responses for invalid requests (400)

- **Response Consistency**:
  - Success responses use apiSuccess helper
  - Error responses use apiError helper
  - Consistent DTO structure

- **Authentication**:
  - Protected routes require authentication
  - Unauthenticated requests return 401

- **Error Handling**:
  - Database errors return 500 with user-friendly messages
  - External API failures are handled gracefully

**Tools**: Vitest + Supertest

**Example Test Cases:**
- All API routes require authentication (return 401 if not authenticated)
- POST requests validate required fields
- API returns consistent error format: { success: false, error: string }
- API returns consistent success format: { success: true, data: T }
- Rate limiting prevents abuse

### 5.6 Security Testing

**Target**: Authentication, authorization, data isolation, input sanitization

**Coverage Areas:**
- **Row-Level Security (RLS)**:
  - Users can only read their own recipes
  - Users can only update/delete their own recipes
  - Admin queries cannot bypass RLS

- **Authentication Security**:
  - Password hashing (handled by Supabase)
  - Session token security
  - Password reset token expiration

- **Input Validation**:
  - SQL injection prevention (parameterized queries via Supabase)
  - XSS prevention (React escaping, validate user input)
  - CSRF protection

- **API Security**:
  - OpenRouter API key not exposed to client
  - Environment variables properly secured

**Tools**: Vitest + Manual security review

**Example Test Cases:**
- User A cannot read recipes belonging to User B
- User A cannot delete recipes belonging to User B
- SQL injection attempts in recipe content are sanitized
- Password reset tokens expire after intended duration
- API keys are not exposed in client-side code

### 5.7 Performance Testing

**Target**: Response times, database query efficiency, AI API latency

**Coverage Areas:**
- **API Response Times**:
  - Recipe CRUD operations complete within acceptable time (<500ms)
  - Recipe list loading is optimized (pagination if needed)

- **AI Modification Performance**:
  - OpenRouter API calls have appropriate timeout (30s)
  - Retry logic doesn't create excessive delays

- **Database Performance**:
  - Queries use appropriate indexes
  - RLS policies don't create performance bottlenecks

**Tools**: Playwright (performance timeline), Manual load testing

**Example Test Cases:**
- GET /api/recipes returns within 500ms for user with 50 recipes
- AI modification completes or times out within 30 seconds
- Recipe creation completes within 300ms
- Page navigation with View Transitions is smooth (<100ms)

## 6. Testing Tools and Frameworks

### Primary Testing Frameworks

#### Vitest
**Purpose**: Unit and integration testing
**Why Vitest**: Built for Vite/Astro ecosystem, fast, Jest-compatible API, excellent TypeScript support

**Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/*.config.*', '**/dist/**', '**/.astro/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

**File Pattern**: `src/**/*.test.ts`, `src/**/*.test.tsx`

#### Playwright
**Purpose**: End-to-end testing
**Why Playwright**: Excellent Astro support, multi-browser testing, reliable auto-waiting, screenshot/video capture

**Configuration**:
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**File Pattern**: `tests/e2e/**/*.spec.ts`

### Supporting Libraries

#### React Testing Library
**Purpose**: Component testing
**Installation**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
**Usage**: Test React components with user-centric approach

#### Supertest
**Purpose**: HTTP API testing
**Installation**: `supertest`, `@types/supertest`
**Usage**: Test API routes with HTTP assertions

#### MSW (Mock Service Worker)
**Purpose**: Mocking OpenRouter API and external services
**Installation**: `msw`
**Usage**: Intercept and mock HTTP requests in tests

### Test Utilities

**Custom Test Helpers** (`tests/helpers/`):
- `createTestUser()`: Create authenticated test user
- `createTestRecipe()`: Create recipe for testing
- `mockOpenRouterResponse()`: Mock AI API responses
- `setupTestDatabase()`: Initialize clean test database state
- `clearTestDatabase()`: Clean up after tests

## 7. Test Environment

### Local Development Environment

**Requirements**:
- Node.js 18+ (matching production)
- npm or pnpm package manager
- Git for version control

**Database Setup**:
- **Option 1 (Recommended)**: Supabase Local Development
  - Install Supabase CLI: `npm install -g supabase`
  - Start local Supabase: `supabase start`
  - Run migrations: `supabase db reset`
  - Provides isolated PostgreSQL instance with RLS

- **Option 2**: Dedicated Test Project on Supabase Cloud
  - Create separate Supabase project for testing
  - Configure with environment variables
  - Reset database between test runs

**Environment Variables** (`.env.test`):
```env
PUBLIC_SUPABASE_URL=http://localhost:54321  # or test project URL
PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>
OPENROUTER_API_KEY=<test-api-key-or-mock>
NODE_ENV=test
```

**Test Database Management**:
- Before each test suite: Reset database to clean state
- Seed with minimal required data (test users, etc.)
- After each test suite: Clean up test data
- Use transactions to rollback changes (where applicable)

### CI/CD Environment (GitHub Actions)

**Workflow Configuration** (`.github/workflows/test.yml`):
```yaml
name: Test Suite

on:
  pull_request:
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm install -g supabase
          supabase start
          supabase db reset

      - name: Run unit and integration tests
        run: npm run test:unit
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**NPM Scripts** (`package.json`):
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### Staging Environment

**Purpose**: Pre-production testing with production-like setup

**Setup**:
- Deployed to DigitalOcean (separate droplet from production)
- Connected to dedicated Supabase staging project
- Uses staging OpenRouter API key with rate limits
- Seeded with realistic test data

**Usage**:
- Manual exploratory testing
- Smoke tests after deployment
- Performance testing under load
- User acceptance testing (UAT)

## 8. Test Cases and Scenarios

### 8.1 Authentication Test Cases

#### User Registration (US-001)

**TC-AUTH-001: Successful Registration**
- **Preconditions**: User is on registration page
- **Steps**:
  1. Enter valid email: `testuser@example.com`
  2. Enter strong password: `SecurePass123!`
  3. Confirm password: `SecurePass123!`
  4. Click "Register" button
- **Expected Results**:
  - User account is created in Supabase
  - User is automatically logged in
  - User is redirected to recipes page
  - Success toast notification appears
- **Priority**: P0 (Critical)

**TC-AUTH-002: Registration with Invalid Email**
- **Steps**: Enter invalid email: `notanemail`, valid password
- **Expected**: Form shows "Invalid email format" error, registration blocked
- **Priority**: P1 (High)

**TC-AUTH-003: Registration with Weak Password**
- **Steps**: Enter valid email, weak password: `123`
- **Expected**: Form shows "Password must be at least 8 characters" error
- **Priority**: P1 (High)

**TC-AUTH-004: Registration with Mismatched Passwords**
- **Steps**: Enter password: `SecurePass123!`, confirm: `DifferentPass123!`
- **Expected**: Form shows "Passwords do not match" error
- **Priority**: P1 (High)

**TC-AUTH-005: Registration with Existing Email**
- **Steps**: Register with email that already exists in database
- **Expected**: API returns 409 Conflict error, user sees "Email already registered"
- **Priority**: P0 (Critical)

#### User Login (US-002)

**TC-AUTH-006: Successful Login**
- **Preconditions**: User account exists
- **Steps**:
  1. Navigate to login page
  2. Enter valid email and password
  3. Click "Login" button
- **Expected Results**:
  - Session is created in Supabase
  - User is redirected to recipes page
  - User menu shows user email
- **Priority**: P0 (Critical)

**TC-AUTH-007: Login with Incorrect Password**
- **Steps**: Enter valid email, incorrect password
- **Expected**: Error message "Invalid credentials", user remains on login page
- **Priority**: P0 (Critical)

**TC-AUTH-008: Login with Non-existent Email**
- **Steps**: Enter email that doesn't exist in system
- **Expected**: Error message "Invalid credentials" (don't reveal if email exists)
- **Priority**: P1 (High)

**TC-AUTH-009: Session Persistence**
- **Steps**: Login successfully, close browser, reopen, navigate to app
- **Expected**: User remains logged in, can access protected routes
- **Priority**: P1 (High)

#### Password Recovery (US-003)

**TC-AUTH-010: Password Reset Request**
- **Steps**:
  1. Navigate to "Forgot password" page
  2. Enter registered email
  3. Click "Send Reset Link"
- **Expected**:
  - Supabase sends password reset email
  - User sees "Reset link sent" message
  - Reset token has 1-hour expiration
- **Priority**: P1 (High)

**TC-AUTH-011: Password Reset Completion**
- **Preconditions**: User has valid reset token from email
- **Steps**:
  1. Click reset link in email
  2. Enter new password
  3. Confirm new password
  4. Click "Reset Password"
- **Expected**:
  - Password is updated in Supabase
  - User is redirected to login page
  - Can login with new password
- **Priority**: P1 (High)

**TC-AUTH-012: Expired Reset Token**
- **Steps**: Use password reset link that is >1 hour old
- **Expected**: Error message "Reset link expired, please request a new one"
- **Priority**: P2 (Medium)

#### Logout (US-004)

**TC-AUTH-013: Successful Logout**
- **Preconditions**: User is logged in
- **Steps**:
  1. Click user menu
  2. Click "Logout" button
- **Expected**:
  - Session is destroyed
  - User is redirected to landing/login page
  - Cannot access protected routes without re-login
- **Priority**: P0 (Critical)

### 8.2 Dietary Preferences Test Cases

#### Adding Preferences (US-007)

**TC-PREF-001: Add Multiple Dietary Preferences**
- **Preconditions**: User is logged in, on profile page
- **Steps**:
  1. Select "Allergies": Peanuts, Shellfish
  2. Select "Diet Type": Vegan
  3. Enter "Dislikes": Mushrooms, Olives
  4. Enter "Other Restrictions": Low-sodium
  5. Click "Save Preferences"
- **Expected**:
  - Preferences are saved to database (linked to user ID)
  - Success toast appears
  - Preferences display on profile page
- **Priority**: P0 (Critical)

**TC-PREF-002: Save Preferences Without All Fields**
- **Steps**: Fill only "Allergies", leave others empty, save
- **Expected**: Preferences save successfully (all fields are optional)
- **Priority**: P1 (High)

#### Editing Preferences (US-008)

**TC-PREF-003: Edit Existing Preferences**
- **Preconditions**: User has saved preferences
- **Steps**:
  1. Navigate to profile page
  2. Click "Edit Preferences"
  3. Change "Diet Type" from Vegan to Vegetarian
  4. Add new allergy: Soy
  5. Click "Save"
- **Expected**:
  - Updated preferences save to database
  - Changes reflect immediately on profile
  - Previous values are overwritten
- **Priority**: P1 (High)

#### Preferences Persistence (US-009)

**TC-PREF-004: Preferences Persist Across Sessions**
- **Steps**:
  1. User sets preferences and saves
  2. User logs out
  3. User logs back in
  4. Navigate to profile page
- **Expected**: Previously saved preferences are displayed
- **Priority**: P1 (High)

### 8.3 Recipe Management Test Cases

#### Creating Recipes (US-010)

**TC-RECIPE-001: Create Recipe with Valid Data**
- **Preconditions**: User is logged in
- **Steps**:
  1. Navigate to "Add Recipe" page
  2. Enter title: "Chocolate Chip Cookies"
  3. Enter content (ingredients and instructions)
  4. Click "Save Recipe"
- **Expected**:
  - Recipe is created in database with user_id
  - User is redirected to recipe list or detail page
  - Success toast appears
  - Recipe appears in user's recipe list
- **Priority**: P0 (Critical)

**TC-RECIPE-002: Create Recipe with Empty Title**
- **Steps**: Leave title empty, fill content, try to save
- **Expected**: Validation error "Title is required", save is blocked
- **Priority**: P1 (High)

**TC-RECIPE-003: Create Recipe with Empty Content**
- **Steps**: Fill title, leave content empty, try to save
- **Expected**: Validation error "Content is required", save is blocked
- **Priority**: P1 (High)

**TC-RECIPE-004: Create Recipe with Maximum Length Content**
- **Steps**: Enter title and content approaching character limits
- **Expected**: Recipe saves successfully, no truncation
- **Priority**: P2 (Medium)

**TC-RECIPE-005: Create Recipe with Special Characters**
- **Steps**: Include special characters in title: `"Mom's Best Pie!"`, content with formatting
- **Expected**: Special characters are properly escaped, no XSS vulnerability
- **Priority**: P1 (High)

#### Viewing Recipe List (US-011)

**TC-RECIPE-006: View Recipe List Sorted by Date**
- **Preconditions**: User has created 3+ recipes at different times
- **Steps**: Navigate to recipe list page
- **Expected**:
  - All user's recipes are displayed
  - Recipes are sorted by creation date (most recent first)
  - Each recipe shows title and truncated content
- **Priority**: P0 (Critical)

**TC-RECIPE-007: Empty Recipe List**
- **Preconditions**: User has no recipes
- **Steps**: Navigate to recipe list page
- **Expected**:
  - Empty state message: "You haven't added any recipes yet"
  - "Add Recipe" button is prominently displayed
- **Priority**: P1 (High)

**TC-RECIPE-008: Recipe List Only Shows Own Recipes (RLS)**
- **Preconditions**: Multiple users with recipes exist
- **Steps**: User A logs in, views recipe list
- **Expected**: Only User A's recipes are visible (User B's recipes not shown)
- **Priority**: P0 (Critical - Security)

#### Viewing Recipe Details (US-012)

**TC-RECIPE-009: View Full Recipe Details**
- **Preconditions**: User has created a recipe
- **Steps**: Click on recipe in list to view details
- **Expected**:
  - Full recipe title displayed
  - Complete recipe content displayed (not truncated)
  - Creation date shown
  - Last modified date shown (if edited)
  - Edit and Delete buttons available
- **Priority**: P0 (Critical)

**TC-RECIPE-010: Access Non-Existent Recipe**
- **Steps**: Navigate to `/recipes/[invalid-id]`
- **Expected**: 404 error page "Recipe not found"
- **Priority**: P1 (High)

**TC-RECIPE-011: Access Another User's Recipe (RLS)**
- **Preconditions**: User A knows User B's recipe ID
- **Steps**: User A tries to access User B's recipe URL
- **Expected**: 403 Forbidden or 404 Not Found (don't reveal recipe exists)
- **Priority**: P0 (Critical - Security)

#### Deleting Recipes (US-013)

**TC-RECIPE-012: Delete Recipe with Confirmation**
- **Preconditions**: User has a recipe
- **Steps**:
  1. Navigate to recipe detail page
  2. Click "Delete" button
  3. Confirm deletion in dialog
- **Expected**:
  - Recipe is deleted from database
  - User is redirected to recipe list
  - Recipe no longer appears in list
  - Success toast "Recipe deleted"
- **Priority**: P0 (Critical)

**TC-RECIPE-013: Cancel Recipe Deletion**
- **Steps**:
  1. Click "Delete" button
  2. Click "Cancel" in confirmation dialog
- **Expected**: Recipe is NOT deleted, user remains on detail page
- **Priority**: P2 (Medium)

**TC-RECIPE-014: Delete Another User's Recipe (RLS)**
- **Steps**: User A attempts to DELETE another user's recipe via API
- **Expected**: 403 Forbidden, recipe is not deleted
- **Priority**: P0 (Critical - Security)

### 8.4 AI Recipe Modification Test Cases

#### AI Modification Flow (US-017, US-018)

**TC-AI-001: Modify Recipe with Preferences**
- **Preconditions**: User has dietary preferences set, has a recipe
- **Steps**:
  1. Navigate to recipe detail page
  2. Click "Modify Recipe" button
  3. Wait for AI processing
- **Expected**:
  - Loading indicator appears
  - Request sent to OpenRouter API with recipe + preferences
  - Modified recipe is returned
  - Modified recipe displayed in preview
  - Option to "Save as New Recipe" appears
- **Priority**: P0 (Critical)

**TC-AI-002: Loading State During Modification**
- **Steps**: Click "Modify Recipe", observe UI
- **Expected**:
  - Loading spinner appears immediately
  - "Modify Recipe" button is disabled during processing
  - User cannot trigger multiple simultaneous requests
- **Priority**: P1 (High)

**TC-AI-003: Save AI-Modified Recipe**
- **Preconditions**: AI modification completed successfully
- **Steps**:
  1. Review modified recipe in preview
  2. Click "Save as New Recipe"
- **Expected**:
  - New recipe created in database
  - New recipe has `is_ai_modified: true` flag
  - New recipe links to original recipe ID
  - User is redirected to new recipe detail page
  - Both original and modified recipes exist
- **Priority**: P0 (Critical)

**TC-AI-004: Indicate AI-Modified Recipe**
- **Preconditions**: User has AI-modified recipes
- **Steps**: View recipe list and recipe details
- **Expected**:
  - AI-modified recipes show badge/icon indicator
  - Original recipe link/reference is visible on modified recipe
- **Priority**: P1 (High)

#### AI Modification Edge Cases

**TC-AI-005: Modify Recipe Without Preferences**
- **Preconditions**: User has NOT set dietary preferences
- **Steps**: Click "Modify Recipe" on a recipe
- **Expected**:
  - Modal/message prompts: "Set dietary preferences first"
  - Link to profile/preferences page
  - Modification does not proceed
- **Priority**: P1 (High)

**TC-AI-006: AI Service Error Handling**
- **Preconditions**: Mock OpenRouter API to return error
- **Steps**: Attempt to modify recipe
- **Expected**:
  - Error toast: "Failed to modify recipe. Please try again."
  - User can retry the operation
  - No partial/corrupted recipe is saved
- **Priority**: P0 (Critical)

**TC-AI-007: AI Service Timeout**
- **Preconditions**: Mock slow OpenRouter API response (>30s)
- **Steps**: Attempt to modify recipe
- **Expected**:
  - Request times out after 30 seconds
  - Error message: "Request timed out. Please try again."
  - No hanging request
- **Priority**: P1 (High)

**TC-AI-008: AI Returns Invalid Response**
- **Preconditions**: Mock OpenRouter API to return malformed data
- **Steps**: Attempt to modify recipe
- **Expected**:
  - Response validation with Zod schema fails gracefully
  - Error message to user
  - No application crash
- **Priority**: P1 (High)

**TC-AI-009: Retry Logic on Transient Failure**
- **Preconditions**: Mock API to fail once, then succeed
- **Steps**: Attempt to modify recipe
- **Expected**:
  - Service automatically retries
  - User sees eventual success without manual retry
  - Total time within acceptable range
- **Priority**: P2 (Medium)

### 8.5 Security Test Cases

#### Row-Level Security (RLS)

**TC-SEC-001: User Cannot Read Other Users' Recipes**
- **Setup**: User A and User B both have recipes
- **Steps**: User A attempts direct API call to User B's recipe ID
- **Expected**: 403 or 404, no recipe data returned
- **Priority**: P0 (Critical)

**TC-SEC-002: User Cannot Update Other Users' Recipes**
- **Steps**: User A sends PATCH request to User B's recipe
- **Expected**: 403 Forbidden, no changes made
- **Priority**: P0 (Critical)

**TC-SEC-003: User Cannot Delete Other Users' Recipes**
- **Steps**: User A sends DELETE request to User B's recipe
- **Expected**: 403 Forbidden, recipe not deleted
- **Priority**: P0 (Critical)

**TC-SEC-004: RLS Enforced at Database Level**
- **Steps**: Directly query database as authenticated user
- **Expected**: Only user's own recipes returned, regardless of query parameters
- **Priority**: P0 (Critical)

#### Input Validation & Injection Prevention

**TC-SEC-005: SQL Injection Prevention**
- **Steps**: Enter SQL injection payload in recipe title: `'; DROP TABLE recipes; --`
- **Expected**: Input is escaped/parameterized, no SQL execution, recipe saves safely
- **Priority**: P0 (Critical)

**TC-SEC-006: XSS Prevention in Recipe Content**
- **Steps**: Enter XSS payload in recipe: `<script>alert('XSS')</script>`
- **Expected**: React escapes output, script does not execute when viewing recipe
- **Priority**: P0 (Critical)

**TC-SEC-007: API Key Not Exposed to Client**
- **Steps**: Inspect browser network requests and client-side code
- **Expected**: OPENROUTER_API_KEY never sent to client, only server-side usage
- **Priority**: P0 (Critical)

#### Authentication Security

**TC-SEC-008: Protected Routes Require Authentication**
- **Steps**: Navigate to `/recipes` without logging in
- **Expected**: Redirect to login page
- **Priority**: P0 (Critical)

**TC-SEC-009: API Routes Require Authentication**
- **Steps**: Send API request without auth cookie/header
- **Expected**: 401 Unauthorized response
- **Priority**: P0 (Critical)

**TC-SEC-010: Password Reset Token Expiration**
- **Steps**: Use password reset token after 1 hour expiration
- **Expected**: Token is invalid, error message displayed
- **Priority**: P1 (High)

### 8.6 User Interface Test Cases

#### Responsive Design

**TC-UI-001: Mobile Viewport (375px width)**
- **Steps**: View application on mobile viewport
- **Expected**:
  - Navigation menu collapses to hamburger
  - Forms are fully visible and usable
  - Recipe cards stack vertically
  - All text is readable (no overflow)
- **Priority**: P1 (High)

**TC-UI-002: Tablet Viewport (768px width)**
- **Steps**: View application on tablet viewport
- **Expected**: Responsive layout adjusts, 2-column recipe grid
- **Priority**: P2 (Medium)

**TC-UI-003: Desktop Viewport (1920px width)**
- **Steps**: View application on large desktop
- **Expected**: Full navigation, 3-column recipe grid, no excessive whitespace
- **Priority**: P2 (Medium)

#### Form Validation

**TC-UI-004: Real-time Email Validation**
- **Steps**: Type invalid email in registration form, blur field
- **Expected**: Validation error appears immediately below field
- **Priority**: P1 (High)

**TC-UI-005: Form Submission Loading State**
- **Steps**: Submit any form (login, recipe creation, etc.)
- **Expected**:
  - Submit button shows loading spinner
  - Submit button is disabled
  - Form inputs are disabled during submission
- **Priority**: P1 (High)

**TC-UI-006: Error Message Display**
- **Steps**: Submit form with errors (e.g., empty required fields)
- **Expected**:
  - Error toast appears at top of screen
  - Error messages shown below relevant fields
  - Errors are clearly readable and actionable
- **Priority**: P1 (High)

**TC-UI-007: Success Toast Notifications**
- **Steps**: Complete successful action (create recipe, save preferences)
- **Expected**:
  - Success toast appears with checkmark icon
  - Toast auto-dismisses after 3-5 seconds
  - Toast can be manually dismissed
- **Priority**: P2 (Medium)

#### Navigation

**TC-UI-008: View Transitions Work Correctly**
- **Steps**: Navigate between pages (recipes list → detail → add recipe)
- **Expected**:
  - Smooth page transitions (no flash)
  - Browser back/forward buttons work correctly
  - URL updates appropriately
- **Priority**: P2 (Medium)

**TC-UI-009: Navigation Active States**
- **Steps**: Navigate to different sections
- **Expected**: Current page is highlighted in navigation menu
- **Priority**: P3 (Low)

## 9. Entry and Exit Criteria

### Entry Criteria

Testing can begin when ALL of the following conditions are met:

1. **Code Completeness**:
   - All functional requirements from PRD are implemented
   - Code is committed to a feature branch or main branch
   - No known build failures or compilation errors

2. **Environment Setup**:
   - Test environment is configured (local or staging)
   - Test database is set up and accessible
   - Environment variables are configured (`.env.test`)
   - Supabase instance is running (local or cloud test project)

3. **Testing Infrastructure**:
   - Vitest is installed and configured
   - Playwright is installed and configured
   - Test scripts are defined in `package.json`
   - Test helpers and utilities are created

4. **Documentation**:
   - API endpoint documentation is complete
   - Component prop interfaces are defined
   - Environment setup instructions are documented

5. **Dependencies**:
   - All npm packages are installed (`node_modules`)
   - No critical dependency vulnerabilities
   - OpenRouter API access is available (or mocked)

### Exit Criteria

Testing is considered complete when ALL of the following conditions are met:

1. **Test Execution**:
   - All planned test cases have been executed
   - 100% of P0 (Critical) tests pass
   - 95%+ of P1 (High) tests pass
   - 90%+ of P2 (Medium) tests pass

2. **Code Coverage**:
   - Overall code coverage ≥ 80%
   - Service layer coverage ≥ 90%
   - API routes coverage ≥ 85%
   - Component coverage ≥ 75%
   - No critical paths are untested

3. **Defect Resolution**:
   - Zero P0 (Critical) bugs remaining
   - All P1 (High) bugs are fixed or have approved workarounds
   - P2 (Medium) bugs are triaged and documented

4. **Test Quality**:
   - No flaky tests (inconsistent pass/fail)
   - All tests are deterministic and repeatable
   - Test execution time is acceptable (<5 minutes for unit/integration, <10 minutes for E2E)
   - CI/CD pipeline runs tests successfully

5. **Documentation**:
   - Test results are documented and reviewed
   - Known limitations or risks are documented
   - Test coverage report is generated and reviewed

6. **Security**:
   - All P0 security test cases pass
   - RLS policies are verified
   - No exposed API keys or secrets
   - Input validation is comprehensive

7. **Stakeholder Approval**:
   - Test results reviewed by development team
   - Product owner approves feature completeness
   - Any exceptions or deviations are documented and approved

### Suspension Criteria

Testing should be suspended if ANY of the following occur:

- Build is broken and cannot be fixed quickly (<1 hour)
- Test environment is unavailable (Supabase down, database corrupted)
- >50% of tests are failing due to systemic issue (not individual bugs)
- Critical blocking defect prevents further testing
- Major requirements change requires retesting from scratch

### Resumption Criteria

Testing can resume after suspension when:

- Blocking issues are resolved and verified
- Test environment is restored and validated
- Build is stable and passing
- Updated requirements are documented and understood

## 10. Risks and Mitigation

### Risk 1: External API Dependency (OpenRouter)

**Description**: OpenRouter API may be unavailable, slow, or rate-limited during testing

**Impact**: High - Blocks AI modification testing

**Probability**: Medium

**Mitigation Strategies**:
- **Primary**: Use MSW (Mock Service Worker) to mock OpenRouter API responses for most tests
- **Fallback**: Create dedicated test API key with higher rate limits for real integration tests
- **Monitoring**: Implement retry logic with exponential backoff in production code
- **Test Design**: Separate mocked tests (fast, reliable) from real API tests (slow, run less frequently)

### Risk 2: Test Database State Management

**Description**: Tests may interfere with each other due to shared database state

**Impact**: High - Flaky tests, false failures, unreliable test results

**Probability**: High (if not managed properly)

**Mitigation Strategies**:
- **Isolation**: Use Supabase local development with database reset between test suites
- **Transactions**: Wrap tests in transactions and rollback after each test (where applicable)
- **Cleanup**: Implement `beforeEach` and `afterEach` hooks to clean test data
- **Unique Data**: Generate unique test data (emails, IDs) to avoid collisions
- **Parallel Execution**: Run E2E tests sequentially to avoid conflicts

### Risk 3: Row-Level Security (RLS) Testing Complexity

**Description**: RLS policies are difficult to test comprehensively; security vulnerabilities may be missed

**Impact**: Critical - Data leaks, unauthorized access

**Probability**: Medium

**Mitigation Strategies**:
- **Dedicated Test Suite**: Create focused security test suite specifically for RLS
- **Multiple User Testing**: Test with multiple concurrent user sessions
- **Service Role Testing**: Verify RLS works even with service role key
- **Manual Review**: Code review all RLS policies with security focus
- **Penetration Testing**: Conduct manual security testing attempting to bypass RLS

### Risk 4: Test Maintenance Burden

**Description**: Large test suite becomes difficult to maintain as codebase evolves

**Impact**: Medium - Slow development, brittle tests

**Probability**: High (over time)

**Mitigation Strategies**:
- **Test Quality**: Focus on stable, behavior-based tests (not implementation details)
- **Refactor with Tests**: Update tests when refactoring code
- **Test Helpers**: Create reusable test utilities to reduce duplication
- **Ownership**: Developers who write code also write/maintain tests
- **Regular Cleanup**: Remove obsolete tests during refactoring

### Risk 5: Insufficient E2E Test Coverage

**Description**: E2E tests are slow and expensive, so coverage may be limited

**Impact**: Medium - Integration bugs may reach production

**Probability**: Medium

**Mitigation Strategies**:
- **Focus on Critical Paths**: Prioritize E2E tests for most important user flows
- **Integration Tests**: Use integration tests to bridge gap between unit and E2E
- **Test Pyramid**: Follow 60-25-15 distribution (unit-integration-E2E)
- **Smoke Tests**: Create fast smoke test suite for quick validation
- **Manual Testing**: Supplement with manual exploratory testing for edge cases

### Risk 6: Flaky Playwright Tests

**Description**: E2E tests may be inconsistent due to timing issues, network latency, or race conditions

**Impact**: Medium - False failures, reduced confidence in tests

**Probability**: Medium

**Mitigation Strategies**:
- **Auto-Waiting**: Leverage Playwright's built-in auto-waiting for elements
- **Explicit Waits**: Use `waitForSelector`, `waitForResponse` for dynamic content
- **Stable Selectors**: Use data-testid attributes instead of fragile CSS selectors
- **Retries**: Configure retry policy for E2E tests in CI (2 retries)
- **Screenshots/Videos**: Capture on failure for debugging

### Risk 7: Test Data Seeding Complexity

**Description**: Setting up realistic test data (recipes, users, preferences) is time-consuming

**Impact**: Low-Medium - Slow test development, incomplete scenarios

**Probability**: Medium

**Mitigation Strategies**:
- **Factory Functions**: Create test data factories (`createTestUser`, `createTestRecipe`)
- **Seed Scripts**: Develop reusable seed scripts for common scenarios
- **Minimal Data**: Use minimal data required for each test (avoid over-seeding)
- **Fixtures**: Store complex test data as JSON fixtures

### Risk 8: CI/CD Pipeline Performance

**Description**: Full test suite may be too slow for CI/CD pipeline, delaying feedback

**Impact**: Medium - Slow development velocity

**Probability**: Medium

**Mitigation Strategies**:
- **Parallel Execution**: Run unit tests in parallel across multiple workers
- **Incremental Testing**: Run only affected tests for small changes (future enhancement)
- **Fast Feedback**: Run unit tests first, E2E tests after merge
- **Caching**: Cache node_modules and build artifacts in CI
- **Optimize Tests**: Profile and optimize slowest tests

### Risk 9: Environment Configuration Errors

**Description**: Incorrect environment variables or configuration may cause test failures

**Impact**: Medium - Wasted debugging time, false failures

**Probability**: Low-Medium

**Mitigation Strategies**:
- **Documentation**: Clear environment setup documentation
- **Validation**: Validate required environment variables at test startup
- **Example Files**: Provide `.env.test.example` with all required variables
- **CI Secrets**: Securely manage secrets in GitHub Actions
- **Local Scripts**: Create setup scripts to automate environment configuration

### Risk 10: OpenRouter API Costs During Testing

**Description**: Extensive testing with real OpenRouter API may incur unexpected costs

**Impact**: Low - Budget overruns

**Probability**: Low

**Mitigation Strategies**:
- **Mocking First**: Use mocked responses for 95%+ of tests
- **Limited Real Tests**: Run real API tests sparingly (only on main branch, manual trigger)
- **Budget Limits**: Set spending limits on OpenRouter API key
- **Monitoring**: Track API usage and costs
- **Test Model**: Use cheapest model (gpt-4o-mini) for testing

## 11. Schedule and Timeline

### Phase 1: Testing Infrastructure Setup (Week 1)

**Activities**:
- Install and configure Vitest
- Install and configure Playwright
- Set up test database (Supabase local or cloud test project)
- Create test environment configuration (`.env.test`)
- Implement test helpers and utilities
- Configure GitHub Actions for CI/CD

**Deliverables**:
- Working test environment
- Sample test files demonstrating each test type
- CI/CD pipeline running successfully

**Success Criteria**:
- Can run `npm run test` and see passing test
- Can run `npm run test:e2e` and see passing E2E test
- GitHub Actions workflow runs on push

### Phase 2: Unit and Integration Tests (Week 2-3)

**Activities**:
- Write unit tests for all services (`src/lib/services/`)
- Write unit tests for all Zod schemas (`src/lib/schemas/`)
- Write unit tests for utilities (`src/lib/utils/`)
- Write integration tests for API routes (`src/pages/api/`)
- Implement MSW mocks for OpenRouter API
- Write database integration tests

**Deliverables**:
- Comprehensive unit test coverage for services
- API route integration tests for all endpoints
- Mock implementations for external dependencies

**Success Criteria**:
- Code coverage ≥ 80% for service layer
- All API routes have integration tests
- All tests run in <3 minutes

### Phase 3: Component and E2E Tests (Week 3-4)

**Activities**:
- Write component tests for forms (React Testing Library)
- Write component tests for UI components
- Write E2E tests for authentication flow
- Write E2E tests for recipe management flow
- Write E2E tests for AI modification flow
- Implement Page Object Model for Playwright tests

**Deliverables**:
- Component tests for all React components
- E2E tests covering all critical user flows
- Playwright test report with screenshots

**Success Criteria**:
- All P0 user flows have E2E test coverage
- Component tests cover 75%+ of components
- E2E tests run in <10 minutes

### Phase 4: Security and Performance Testing (Week 4)

**Activities**:
- Write security tests for RLS policies
- Test SQL injection and XSS prevention
- Test authentication and authorization
- Conduct manual security review
- Performance testing for API endpoints
- Performance testing for AI modification

**Deliverables**:
- Security test suite with RLS verification
- Performance baseline metrics
- Security review report

**Success Criteria**:
- All RLS tests pass
- No security vulnerabilities identified
- API response times meet targets (<500ms)

### Phase 5: Test Refinement and Documentation (Week 5)

**Activities**:
- Fix flaky tests
- Optimize slow tests
- Improve test coverage for gaps
- Document test patterns and best practices
- Create test maintenance guide
- Conduct test results review

**Deliverables**:
- Stable, reliable test suite
- Test documentation and guides
- Final test coverage report
- Test results presentation

**Success Criteria**:
- Zero flaky tests
- All coverage thresholds met
- Team trained on running and writing tests

### Ongoing: Test Maintenance

**Activities**:
- Update tests when code changes
- Add tests for new features
- Monitor test execution time
- Review and improve test quality
- Monitor code coverage trends

**Frequency**: Continuous (with every code change)

**Responsibility**: All developers

---

## Summary

This test plan provides a comprehensive strategy for testing the HealthyMeal application, covering all functional requirements with appropriate test types, tools, and scenarios. The plan emphasizes:

- **Test-first approach** with high coverage targets (80% overall)
- **Security focus** on RLS, authentication, and input validation
- **Realistic testing** with mocked external dependencies for speed and reliability
- **Pragmatic E2E testing** focused on critical user flows
- **CI/CD integration** for automated testing on every commit
- **Clear execution phases** to implement testing infrastructure systematically

By following this plan, the HealthyMeal development team will establish a robust testing foundation that ensures feature correctness, prevents regressions, maintains security, and supports confident continuous delivery.
