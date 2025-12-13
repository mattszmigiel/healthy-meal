# View Implementation Plan: Recipe List Page

## 1. Overview

The Recipe List Page serves as the main authenticated home screen for the HealthyMeal application. It displays the user's personal recipe library with the ability to toggle between original recipes ("My Recipes") and AI-modified recipe variants ("AI Modified"). The view supports pagination, provides empty state guidance for new users, and includes an onboarding banner to encourage users to set dietary preferences for better AI modifications.

**Key Features:**
- Segmented view toggle between original and AI-modified recipes
- Responsive recipe grid with metadata display
- Pagination with "Load More" functionality
- Empty state messaging with clear CTAs
- Onboarding banner for users without dietary preferences
- Global navigation header with user menu
- Loading states with skeleton placeholders

## 2. View Routing

**Path:** `/recipes`

**Route Configuration:**
- Astro page: `src/pages/recipes.astro`
- Access: Authenticated users only (protected by middleware)
- Query Parameters: `?view=my-recipes` (default) or `?view=ai-modified`

## 3. Component Structure

```
recipes.astro (Astro Page - SSR)
└── RecipeListView.tsx (React Component - Client-side)
    ├── GlobalNavigation.tsx
    │   └── UserMenu.tsx (Shadcn DropdownMenu)
    ├── OnboardingBanner.tsx (conditional)
    ├── ViewToggle.tsx (Shadcn Tabs)
    ├── RecipeGrid.tsx
    │   ├── RecipeCard.tsx (multiple, Shadcn Card)
    │   │   └── Badge.tsx (conditional - Shadcn Badge)
    │   └── RecipeCardSkeleton.tsx (during loading - Shadcn Skeleton)
    ├── EmptyState.tsx (conditional)
    └── PaginationControls.tsx
```

**Component Hierarchy:**
- **Page Level**: recipes.astro (SSR, data fetching)
- **View Level**: RecipeListView (orchestrates all interactions)
- **Section Level**: GlobalNavigation, OnboardingBanner, ViewToggle, RecipeGrid, PaginationControls
- **Item Level**: RecipeCard, RecipeCardSkeleton, EmptyState

## 4. Component Details

### 4.1 RecipeListPage (recipes.astro)

**Component Description:**
Server-rendered Astro page that handles initial data fetching, authentication verification, and preference checking. Serves as the entry point for the Recipe List view.

**Main Elements:**
- Authentication check via middleware
- SSR data fetch from `/api/recipes?page=1&limit=20&is_ai_generated=false`
- SSR check for dietary preferences existence
- Layout wrapper with `<RecipeListView>` hydrated component

**Handled Events:**
- None (SSR only)

**Validation:**
- User authentication (redirect to `/login` if not authenticated)
- Valid session

**Types:**
- `RecipeListResponseDTO` (API response)
- `DietaryPreferencesDTO | null` (preferences check)

**Props:**
- None (page component)

**Implementation Notes:**
- Use `Astro.locals.supabase` for data fetching
- Pass `initialRecipes` and `hasPreferences` to React component
- Handle SSR errors with error page fallback

---

### 4.2 RecipeListView.tsx

**Component Description:**
Main interactive container that manages recipe list state, view switching, pagination, and error handling. Orchestrates all child components and handles client-side data fetching.

**Main Elements:**
- `<main>` wrapper with semantic HTML
- `<h1>` screen reader title "My Recipes"
- GlobalNavigation component
- OnboardingBanner (conditional)
- ViewToggle component
- RecipeGrid or EmptyState (conditional)
- PaginationControls (conditional)
- Error display (conditional)

**Handled Events:**
- View toggle (my-recipes ↔ ai-modified)
- Load more pagination
- Error dismissal
- URL synchronization

**Validation:**
- None (delegates to child components)

**Types:**
- `RecipeListViewProps`
- Uses `useRecipeList` custom hook

**Props:**
```typescript
interface RecipeListViewProps {
  initialRecipes: RecipeListResponseDTO;
  hasPreferences: boolean;
}
```

**Implementation Notes:**
- Use `useRecipeList` custom hook for state management
- Sync URL parameter with current view
- Handle error states with user-friendly messages
- Use Astro View Transitions for navigation

---

### 4.3 GlobalNavigation.tsx

**Component Description:**
Application-wide navigation header displayed on all authenticated pages. Provides branding, navigation links, and user account menu.

**Main Elements:**
- `<header>` element with `<nav>` semantics
- Logo (clickable, links to `/recipes`)
- Navigation links: "Recipes", "Profile"
- UserMenu dropdown (user email, Logout)
- Responsive layout (mobile hamburger optional for future)

**Handled Events:**
- Logo click → navigate to `/recipes`
- "Recipes" link click → navigate to `/recipes`
- "Profile" link click → navigate to `/profile`
- "Logout" click → call logout and redirect to `/login`

**Validation:**
- Highlight current page with `aria-current="page"`

**Types:**
- `GlobalNavigationProps`

**Props:**
```typescript
interface GlobalNavigationProps {
  userEmail?: string;
}
```

**Implementation Notes:**
- Use Shadcn `DropdownMenu` for user menu
- Apply `aria-current` to active navigation link
- Use Tailwind responsive utilities
- Extract logout logic to separate function

---

### 4.4 ViewToggle.tsx

**Component Description:**
Segmented control that allows users to switch between viewing their original recipes and AI-modified recipe variants.

**Main Elements:**
- Shadcn `Tabs` component
- Two tab triggers: "My Recipes", "AI Modified"
- Accessible tab navigation with keyboard support

**Handled Events:**
- Tab change → call `onChange` with new view value
- Keyboard navigation (arrow keys)

**Validation:**
- Ensure `currentView` matches URL parameter
- Disable tabs during loading (optional)

**Types:**
- `ViewToggleProps`

**Props:**
```typescript
interface ViewToggleProps {
  currentView: 'my-recipes' | 'ai-modified';
  onChange: (view: 'my-recipes' | 'ai-modified') => void;
}
```

**Implementation Notes:**
- Use Shadcn `Tabs`, `TabsList`, `TabsTrigger`
- Map 'my-recipes' → is_ai_generated=false
- Map 'ai-modified' → is_ai_generated=true
- Ensure proper ARIA attributes for accessibility

---

### 4.5 RecipeGrid.tsx

**Component Description:**
Responsive grid container that displays recipe cards or loading skeletons. Handles the visual layout of the recipe collection.

**Main Elements:**
- `<div>` with CSS Grid layout
- Multiple `RecipeCard` components
- `RecipeCardSkeleton` components during loading
- Responsive: 1 column (mobile), 2 columns (md), 3 columns (lg)

**Handled Events:**
- Delegates card click to RecipeCard

**Validation:**
- Show skeletons when `isLoading === true`
- Show EmptyState when `recipes.length === 0 && !isLoading`

**Types:**
- `RecipeGridProps`

**Props:**
```typescript
interface RecipeGridProps {
  recipes: RecipeWithAIMetadataDTO[];
  isLoading: boolean;
  currentView: 'my-recipes' | 'ai-modified';
}
```

**Implementation Notes:**
- Use Tailwind grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Render 20 skeletons during loading (matching default page limit)
- Maintain layout stability during loading transitions

---

### 4.6 RecipeCard.tsx

**Component Description:**
Individual recipe card displaying recipe metadata. Entire card is clickable and navigates to recipe detail view.

**Main Elements:**
- Shadcn `Card` with `CardHeader` and `CardContent`
- Recipe title (truncated if too long)
- Creation date (formatted)
- AI Badge (conditional - only for AI-generated recipes in AI view)
- Optional: Parent recipe title (for AI-modified recipes)

**Handled Events:**
- Card click → navigate to `/recipes/{recipe.id}`
- Handle click with keyboard (Enter/Space)

**Validation:**
- Show AI badge only when `recipe.is_ai_generated === true` and in AI view
- Truncate title at reasonable length (e.g., 60 characters)

**Types:**
- `RecipeCardProps`

**Props:**
```typescript
interface RecipeCardProps {
  recipe: RecipeWithAIMetadataDTO;
  showAIBadge: boolean;
}
```

**Implementation Notes:**
- Use Shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent`
- Use Shadcn `Badge` with variant for AI indicator
- Format date with Intl.DateTimeFormat or date-fns
- Entire card should be clickable (use `<a>` or button with navigation)
- Apply hover effects for better UX

---

### 4.7 RecipeCardSkeleton.tsx

**Component Description:**
Loading placeholder that matches the dimensions and layout of RecipeCard to prevent layout shift during loading states.

**Main Elements:**
- Shadcn `Card` structure
- Shadcn `Skeleton` components for title and date
- Same dimensions as RecipeCard

**Handled Events:**
- None (static placeholder)

**Validation:**
- None

**Types:**
- None

**Props:**
- None (or optional className for customization)

**Implementation Notes:**
- Use Shadcn `Skeleton` component
- Match exact layout of RecipeCard
- Ensure ARIA attributes for screen readers (`aria-busy="true"`, `aria-live="polite"`)

---

### 4.8 PaginationControls.tsx

**Component Description:**
Displays pagination information and "Load More" button. Shows current range and total recipe count.

**Main Elements:**
- Info text: "Showing 1–20 of 45 recipes"
- Shadcn `Button` for "Load More"
- Loading spinner during fetch (optional)

**Handled Events:**
- "Load More" button click → call `onLoadMore`

**Validation:**
- Disable "Load More" when `pagination.page >= pagination.total_pages`
- Show loading state during fetch

**Types:**
- `PaginationControlsProps`

**Props:**
```typescript
interface PaginationControlsProps {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  isLoading: boolean;
  onLoadMore: () => void;
}
```

**Implementation Notes:**
- Calculate range: start = (page - 1) * limit + 1, end = min(page * limit, total)
- Use Shadcn `Button` with loading state
- Announce new items to screen readers with `aria-live="polite"`

---

### 4.9 EmptyState.tsx

**Component Description:**
Friendly placeholder displayed when the user has no recipes in the current view. Provides guidance and clear call-to-action.

**Main Elements:**
- Illustration or icon (optional)
- Heading: "No recipes yet" or "No AI-modified recipes yet"
- Descriptive text specific to view type
- Primary CTA: Shadcn `Button` - "Add Your First Recipe"
- Tip about dietary preferences (for My Recipes view)

**Handled Events:**
- "Add Your First Recipe" button click → navigate to `/recipes/new`

**Validation:**
- Different messaging based on `view` prop

**Types:**
- `EmptyStateProps`

**Props:**
```typescript
interface EmptyStateProps {
  view: 'my-recipes' | 'ai-modified';
  onAddRecipe: () => void;
}
```

**Implementation Notes:**
- For "my-recipes": Encourage creating first recipe
- For "ai-modified": Explain that AI recipes are created from originals
- Use friendly, encouraging tone
- Center content vertically and horizontally

---

### 4.10 OnboardingBanner.tsx

**Component Description:**
Dismissible banner that prompts users without dietary preferences to complete their profile for better AI recipe modifications.

**Main Elements:**
- Shadcn `Alert` or custom banner component
- Info icon
- Message: "Set your dietary preferences to get personalized AI recipe modifications"
- "Set dietary preferences" button
- Dismiss/close button

**Handled Events:**
- "Set dietary preferences" click → navigate to `/profile`
- Dismiss click → call `onDismiss`, hide banner, persist to localStorage

**Validation:**
- Show only when `!hasPreferences && !localStorage.getItem('bannerDismissed')`
- Clear `bannerDismissed` flag when preferences are set

**Types:**
- `OnboardingBannerProps`

**Props:**
```typescript
interface OnboardingBannerProps {
  onNavigateToProfile: () => void;
  onDismiss: () => void;
}
```

**Implementation Notes:**
- Use Shadcn `Alert` component
- Use localStorage with user-specific key: `healthymeal_banner_dismissed`
- Make dismissible with X button
- Use info/warning variant for visibility

---

## 5. Types

### 5.1 Existing Types (from types.ts)

**RecipeWithAIMetadataDTO:**
```typescript
type RecipeWithAIMetadataDTO = RecipeEntity & {
  ai_metadata: RecipeAIMetadataEntity | null;
};
```
- Combines recipe data with optional AI generation metadata
- Used for all recipe list items

**RecipeListResponseDTO:**
```typescript
interface RecipeListResponseDTO {
  data: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```
- Response structure from GET /api/recipes
- Includes both recipe data and pagination metadata

**RecipeListQueryParams:**
```typescript
interface RecipeListQueryParams {
  page?: number;
  limit?: number;
  is_ai_generated?: boolean;
  parent_recipe_id?: string;
}
```
- Query parameters for filtering recipe list

**APIErrorResponse:**
```typescript
interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}
```
- Standard error response structure

### 5.2 New ViewModel Types

**RecipeListViewModel:**
```typescript
interface RecipeListViewModel {
  recipes: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  currentView: 'my-recipes' | 'ai-modified';
  isLoading: boolean;
  error: RecipeListError | null;
  hasPreferences: boolean;
}
```
- **recipes**: Current list of displayed recipes
- **pagination**: Pagination metadata from API
- **currentView**: Active tab selection
- **isLoading**: Loading state for fetch operations
- **error**: Error state with detailed type
- **hasPreferences**: Flag for onboarding banner visibility

**RecipeListError:**
```typescript
type RecipeListError =
  | { type: 'network'; message: string }
  | { type: 'session_timeout'; message: string }
  | { type: 'server_error'; message: string }
  | { type: 'unknown'; message: string };
```
- Discriminated union for different error scenarios
- **network**: Network connectivity issues
- **session_timeout**: 401 authentication failures
- **server_error**: 500 server errors
- **unknown**: Unexpected errors

**ViewType:**
```typescript
type ViewType = 'my-recipes' | 'ai-modified';
```
- String literal union for view toggle state
- Maps to URL parameter and `is_ai_generated` filter

### 5.3 Component Props Types

All component props interfaces are defined in section 4 (Component Details) under each component's Props subsection.

## 6. State Management

### 6.1 Custom Hook: useRecipeList

**Purpose:**
Centralized state management for the Recipe List view, handling data fetching, pagination, view switching, and error states.

**Location:** `src/components/hooks/useRecipeList.ts`

**Hook Signature:**
```typescript
function useRecipeList(
  initialRecipes: RecipeListResponseDTO,
  initialHasPreferences: boolean
): {
  recipes: RecipeWithAIMetadataDTO[];
  pagination: RecipeListResponseDTO['pagination'];
  currentView: ViewType;
  isLoading: boolean;
  error: RecipeListError | null;
  hasPreferences: boolean;
  switchView: (view: ViewType) => void;
  loadMore: () => Promise<void>;
  clearError: () => void;
}
```

**Internal State:**
- `recipes` - Current recipe list (initialized from SSR data)
- `pagination` - Pagination metadata
- `currentView` - Active view tab (synced with URL)
- `isLoading` - Loading state for async operations
- `error` - Current error state
- `hasPreferences` - Dietary preferences flag

**Key Functions:**

1. **switchView(view: ViewType)**
   - Updates `currentView` state
   - Updates URL parameter: `?view={view}`
   - Resets pagination to page 1
   - Fetches new data with `is_ai_generated` filter
   - Replaces `recipes` array with new data
   - Sets loading state during fetch

2. **loadMore()**
   - Increments `pagination.page`
   - Fetches next page with current filters
   - Appends new recipes to existing `recipes` array
   - Updates pagination metadata
   - Sets loading state during fetch
   - Handles errors

3. **clearError()**
   - Resets `error` to null

**Implementation Details:**
- Use `useEffect` to sync URL on mount and view change
- Use `URLSearchParams` to read/write view parameter
- Implement debouncing for rapid view switches (optional)
- Handle race conditions in async fetches
- Implement proper cleanup in useEffect

**Error Handling:**
- Catch fetch errors and categorize by response status
- 401 → `{ type: 'session_timeout' }`
- 500 → `{ type: 'server_error' }`
- Network error → `{ type: 'network' }`
- Preserve previous data on error
- Provide retry mechanism via `clearError` + action retry

### 6.2 Local State

**OnboardingBanner Dismissal:**
- Use `localStorage.setItem('healthymeal_banner_dismissed', 'true')`
- Check on component mount: `localStorage.getItem('healthymeal_banner_dismissed')`
- Clear flag when preferences are successfully set

## 7. API Integration

### 7.1 Endpoint

**GET /api/recipes**

**Request Types:**
```typescript
// Query Parameters
interface RecipeListQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  is_ai_generated?: boolean;
  parent_recipe_id?: string;
}
```

**Response Types:**
```typescript
// Success Response (200)
interface RecipeListResponseDTO {
  data: RecipeWithAIMetadataDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Error Response (400, 500)
interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}
```

### 7.2 Integration Points

**1. Initial Load (SSR in recipes.astro):**
```typescript
const response = await fetch(
  `${Astro.url.origin}/api/recipes?page=1&limit=20&is_ai_generated=false`,
  {
    headers: {
      Cookie: Astro.request.headers.get('Cookie') || '',
    },
  }
);
const initialRecipes: RecipeListResponseDTO = await response.json();
```

**2. View Switch (Client-side in useRecipeList):**
```typescript
const isAiGenerated = view === 'ai-modified';
const response = await fetch(
  `/api/recipes?page=1&limit=20&is_ai_generated=${isAiGenerated}`
);
const data: RecipeListResponseDTO = await response.json();
```

**3. Load More (Client-side in useRecipeList):**
```typescript
const nextPage = pagination.page + 1;
const isAiGenerated = currentView === 'ai-modified';
const response = await fetch(
  `/api/recipes?page=${nextPage}&limit=20&is_ai_generated=${isAiGenerated}`
);
const data: RecipeListResponseDTO = await response.json();
```

**4. Error Handling:**
```typescript
try {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 401) {
      // Session timeout - redirect to login
      window.location.href = '/login?returnUrl=/recipes';
      return;
    }

    const errorData: APIErrorResponse = await response.json();
    setError({
      type: response.status === 500 ? 'server_error' : 'unknown',
      message: errorData.message,
    });
    return;
  }

  const data: RecipeListResponseDTO = await response.json();
  // Handle success
} catch (err) {
  setError({
    type: 'network',
    message: 'Unable to connect. Please check your internet connection.',
  });
}
```

## 8. User Interactions

### 8.1 Toggle Between Views

**User Action:** Click on "My Recipes" or "AI Modified" tab

**Flow:**
1. User clicks tab trigger
2. `ViewToggle.onChange` handler fires with new view value
3. `useRecipeList.switchView` is called
4. URL updates to `?view=my-recipes` or `?view=ai-modified`
5. `isLoading` set to `true`, loading skeletons appear
6. API call: `GET /api/recipes?page=1&limit=20&is_ai_generated={boolean}`
7. On success:
   - Replace `recipes` array with new data
   - Update `pagination` metadata
   - Set `isLoading` to `false`
8. On error:
   - Keep previous recipes visible
   - Show error message above grid
   - Set `isLoading` to `false`

**Expected Outcome:** Recipe grid updates to show filtered recipes

---

### 8.2 Load More Recipes

**User Action:** Click "Load More" button

**Flow:**
1. User clicks "Load More" button
2. `PaginationControls.onLoadMore` handler fires
3. `useRecipeList.loadMore` is called
4. Button shows loading spinner, disabled state
5. API call: `GET /api/recipes?page={next_page}&limit=20&is_ai_generated={current_filter}`
6. On success:
   - Append new recipes to existing `recipes` array
   - Update `pagination` metadata
   - Scroll may auto-adjust to new content
7. On error:
   - Show error message below pagination
   - Button returns to enabled state
   - Provide retry option
8. If `pagination.page >= pagination.total_pages`, hide button

**Expected Outcome:** More recipes appended to list, pagination info updates

---

### 8.3 Navigate to Recipe Detail

**User Action:** Click anywhere on a recipe card

**Flow:**
1. User clicks card or presses Enter/Space
2. `RecipeCard.onClick` handler fires
3. Navigate to `/recipes/{recipe.id}` using Astro View Transitions
4. Page transition animates smoothly
5. Recipe detail view loads

**Expected Outcome:** User navigates to recipe detail page

---

### 8.4 Add New Recipe

**User Action:** Click "Add Recipe" button in navigation

**Flow:**
1. User clicks "Add Recipe" button
2. Navigate to `/recipes/new`
3. Recipe creation form loads

**Expected Outcome:** User navigates to recipe creation page

---

### 8.5 Set Dietary Preferences (Onboarding)

**User Action:** Click "Set dietary preferences" in onboarding banner

**Flow:**
1. User clicks button in banner
2. Navigate to `/profile` (preferences section)
3. Profile page loads, preferences form visible

**Expected Outcome:** User navigates to profile to set preferences

---

### 8.6 Dismiss Onboarding Banner

**User Action:** Click dismiss (X) button on banner

**Flow:**
1. User clicks dismiss button
2. `OnboardingBanner.onDismiss` handler fires
3. Set `localStorage.setItem('healthymeal_banner_dismissed', 'true')`
4. Banner fades out and is removed from DOM
5. Banner will not reappear until preferences are set

**Expected Outcome:** Banner is hidden for current and future sessions

---

### 8.7 Logout

**User Action:** Click "Logout" in user menu dropdown

**Flow:**
1. User opens user menu dropdown
2. User clicks "Logout"
3. Call logout endpoint/Supabase auth
4. Clear session/cookies
5. Redirect to `/login`

**Expected Outcome:** User is logged out and redirected to login page

---

## 9. Conditions and Validation

### 9.1 API-Level Validations

The API validates query parameters using Zod schema:

**RecipeListQuerySchema:**
- `page`: Optional number, minimum 1 (default: 1)
- `limit`: Optional number, 1-100 range (default: 20)
- `is_ai_generated`: Optional boolean
- `parent_recipe_id`: Optional UUID string

**Component Responsibility:** Ensure all API calls use valid parameter values

---

### 9.2 Component-Level Validations

**ViewToggle:**
- **Condition:** `currentView` must be synced with URL parameter
- **Validation:** On mount, read `?view` param and set initial state
- **Impact:** Ensures deep-linkable URLs work correctly

**PaginationControls:**
- **Condition:** Cannot load more when on last page
- **Validation:** `pagination.page >= pagination.total_pages`
- **Impact:** Disable "Load More" button, hide if preferred

**RecipeGrid:**
- **Condition:** Show appropriate content based on state
- **Validation:**
  - If `isLoading === true` → show skeletons
  - Else if `recipes.length === 0` → show EmptyState
  - Else → show RecipeCard components
- **Impact:** Proper visual feedback for all states

**RecipeCard:**
- **Condition:** Show AI badge only for AI-generated recipes
- **Validation:** `recipe.is_ai_generated === true && showAIBadge === true`
- **Impact:** Badge appears only in appropriate context

**OnboardingBanner:**
- **Condition:** Show only when user lacks preferences and hasn't dismissed
- **Validation:** `!hasPreferences && !localStorage.getItem('healthymeal_banner_dismissed')`
- **Impact:** Banner visibility controlled by state + localStorage

**EmptyState:**
- **Condition:** Different messaging per view type
- **Validation:** Check `view === 'my-recipes'` vs `view === 'ai-modified'`
- **Impact:** Contextual empty state guidance

---

### 9.3 Authentication & Authorization

**Condition:** User must be authenticated to access page
**Validation:** Handled by Astro middleware, checks session
**Impact:** Redirect to `/login?returnUrl=/recipes` if not authenticated

**Condition:** Users only see their own recipes
**Validation:** API filters by authenticated user ID
**Impact:** No action needed at component level, API enforces isolation

---

## 10. Error Handling

### 10.1 Network Errors

**Scenario:** User loses internet connection or API is unreachable

**Detection:** `fetch()` throws network error exception

**Handling:**
1. Catch exception in try-catch block
2. Set `error` state: `{ type: 'network', message: 'Unable to connect...' }`
3. Display error banner above recipe grid
4. Keep existing recipes visible (if any)
5. Provide "Retry" button
6. Log error to console for debugging

**User Impact:** Sees error message, can retry, previous data preserved

---

### 10.2 Session Timeout (401)

**Scenario:** User's session expires while browsing

**Detection:** API returns 401 status code

**Handling:**
1. Check `response.status === 401`
2. Set `error` state: `{ type: 'session_timeout', message: 'Session expired...' }`
3. Display brief message: "Your session has expired"
4. Redirect to `/login?returnUrl=/recipes` after 2-second delay
5. User can re-authenticate and return to recipes page

**User Impact:** Brief notification, then redirect to login with return path

---

### 10.3 Server Errors (500)

**Scenario:** Backend experiences unexpected error

**Detection:** API returns 500 status code

**Handling:**
1. Check `response.status === 500`
2. Parse `APIErrorResponse` from response body
3. Set `error` state: `{ type: 'server_error', message: error.message }`
4. Display user-friendly message: "Something went wrong on our end"
5. Provide "Retry" button
6. Log full error details to console
7. Optionally send error to monitoring service

**User Impact:** Sees friendly error, can retry, technical details hidden

---

### 10.4 Validation Errors (400)

**Scenario:** Client sends invalid query parameters (edge case, should not happen)

**Detection:** API returns 400 status code with validation details

**Handling:**
1. Check `response.status === 400`
2. Parse `APIErrorResponse` with details array
3. Log error with full details for debugging
4. Display generic error to user: "An error occurred. Please try again."
5. Reset to known-good state (page 1, default filters)

**User Impact:** Generic error, automatic recovery to safe state

---

### 10.5 Empty Results

**Scenario:** User has no recipes or no AI-modified recipes

**Detection:** `recipes.length === 0 && !isLoading`

**Handling:**
1. Render `EmptyState` component instead of grid
2. Show contextual messaging based on view:
   - "My Recipes": Encourage creating first recipe
   - "AI Modified": Explain how to create AI variants
3. Provide clear CTA: "Add Your First Recipe"
4. Optionally show tip about setting preferences

**User Impact:** Helpful guidance, clear next action

---

### 10.6 Load More Failure

**Scenario:** Error occurs while fetching next page

**Detection:** Exception or error response during `loadMore()`

**Handling:**
1. Catch error in `loadMore` function
2. Keep existing recipes visible (don't clear)
3. Show error message below current recipe grid
4. Keep "Load More" button visible with "Retry" label
5. Allow user to retry without losing context

**User Impact:** Error is isolated, existing content preserved, easy retry

---

### 10.7 Banner Dismissal Persistence

**Scenario:** localStorage is unavailable or disabled

**Detection:** Try-catch around localStorage operations

**Handling:**
1. Wrap localStorage calls in try-catch
2. Fallback to session-only dismissal (state only)
3. Log warning to console
4. Banner may reappear on page reload (acceptable degradation)

**User Impact:** Minor UX degradation, banner may reappear

---

## 11. Implementation Steps

### Step 1: Install Required Shadcn Components

**Task:** Install Shadcn UI components not already in the project

**Commands:**
```bash
npx shadcn@latest add skeleton
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add dropdown-menu
```

**Verification:** Components appear in `src/components/ui/`

---

### Step 2: Create Type Definitions

**Task:** Add new ViewModel types to `src/types.ts`

**Types to Add:**
- `RecipeListViewModel`
- `RecipeListError`
- `ViewType`
- All component props interfaces

**File:** `src/types.ts`

**Verification:** TypeScript compiles without errors

---

### Step 3: Create useRecipeList Custom Hook

**Task:** Implement state management hook

**File:** `src/components/hooks/useRecipeList.ts`

**Implementation:**
- State variables (recipes, pagination, currentView, isLoading, error, hasPreferences)
- `switchView` function with URL sync
- `loadMore` function with append logic
- `clearError` function
- URL parameter synchronization in useEffect
- Error handling for all async operations

**Verification:** Hook compiles, exports correct interface

---

### Step 4: Create RecipeCardSkeleton Component

**Task:** Build loading placeholder component

**File:** `src/components/RecipeCardSkeleton.tsx`

**Implementation:**
- Use Shadcn Card and Skeleton components
- Match RecipeCard dimensions
- Add ARIA attributes for accessibility

**Verification:** Component renders, matches card layout

---

### Step 5: Create RecipeCard Component

**Task:** Build individual recipe card

**File:** `src/components/RecipeCard.tsx`

**Implementation:**
- Use Shadcn Card components
- Display title, date, AI badge (conditional)
- Entire card clickable with navigation
- Hover effects
- Keyboard accessibility

**Verification:** Card renders, navigation works, badge appears correctly

---

### Step 6: Create EmptyState Component

**Task:** Build empty state placeholder

**File:** `src/components/EmptyState.tsx`

**Implementation:**
- Conditional messaging based on view type
- Call-to-action button
- Centered layout
- Friendly, encouraging tone

**Verification:** Component renders, CTA navigates correctly

---

### Step 7: Create RecipeGrid Component

**Task:** Build recipe grid container

**File:** `src/components/RecipeGrid.tsx`

**Implementation:**
- Responsive CSS Grid layout
- Conditional rendering: skeletons, cards, or empty state
- Proper spacing and alignment

**Verification:** Grid responds to screen size, shows correct content

---

### Step 8: Create PaginationControls Component

**Task:** Build pagination UI

**File:** `src/components/PaginationControls.tsx`

**Implementation:**
- Display range and total
- "Load More" button with loading state
- Disable when no more pages
- ARIA announcements for new content

**Verification:** Button works, disables correctly, shows loading state

---

### Step 9: Create ViewToggle Component

**Task:** Build view switcher tabs

**File:** `src/components/ViewToggle.tsx`

**Implementation:**
- Use Shadcn Tabs component
- Two tabs: "My Recipes", "AI Modified"
- Call onChange handler
- Keyboard navigation support

**Verification:** Tabs switch correctly, keyboard accessible

---

### Step 10: Create OnboardingBanner Component

**Task:** Build preferences prompt banner

**File:** `src/components/OnboardingBanner.tsx`

**Implementation:**
- Use Shadcn Alert component
- Dismissible with localStorage persistence
- Navigation to profile
- Info icon and friendly messaging

**Verification:** Banner shows/hides correctly, localStorage works

---

### Step 11: Create UserMenu Component

**Task:** Build user dropdown menu

**File:** `src/components/UserMenu.tsx`

**Implementation:**
- Use Shadcn DropdownMenu component
- Display user email
- Logout option
- Proper ARIA labels

**Verification:** Menu opens/closes, logout works

---

### Step 12: Create GlobalNavigation Component

**Task:** Build app navigation header

**File:** `src/components/GlobalNavigation.tsx`

**Implementation:**
- Logo with link to /recipes
- Navigation links: Recipes, Profile
- UserMenu component
- Highlight active page with aria-current
- Responsive layout

**Verification:** Navigation works, active state shows, responsive

---

### Step 13: Create RecipeListView Component

**Task:** Build main view orchestrator

**File:** `src/components/RecipeListView.tsx`

**Implementation:**
- Use useRecipeList hook
- Render all child components
- Handle error display
- Semantic HTML structure
- URL synchronization

**Verification:** All interactions work, state updates correctly

---

### Step 14: Create recipes.astro Page

**Task:** Build SSR page wrapper

**File:** `src/pages/recipes.astro`

**Implementation:**
- Fetch initial recipes data (SSR)
- Check dietary preferences (SSR)
- Handle authentication (middleware)
- Pass props to RecipeListView
- Include proper layout
- Enable View Transitions

**Verification:** Page loads with SSR data, client hydration works

---

### Step 15: Test View Toggle and URL Sync

**Task:** Verify view switching functionality

**Tests:**
- Click "My Recipes" → URL updates, API called, recipes update
- Click "AI Modified" → URL updates, API called, recipes update
- Direct navigation to `?view=ai-modified` → correct view selected
- Browser back/forward → view updates correctly

**Verification:** All scenarios work, no race conditions

---

### Step 16: Test Pagination

**Task:** Verify load more functionality

**Tests:**
- Click "Load More" → next page fetched, recipes appended
- Last page → "Load More" button hidden/disabled
- Error during load more → error shown, retry works
- Switch view → pagination resets

**Verification:** Pagination works correctly in all scenarios

---

### Step 17: Test Empty States

**Task:** Verify empty state displays

**Tests:**
- No recipes in "My Recipes" → correct empty state
- No AI recipes in "AI Modified" → correct empty state
- CTA button navigates to create recipe

**Verification:** Empty states show correct messaging

---

### Step 18: Test Onboarding Banner

**Task:** Verify banner behavior

**Tests:**
- No preferences → banner shows
- Dismiss banner → banner hides, localStorage set
- Reload page → banner stays hidden
- Set preferences → banner no longer shows (requires preference check)

**Verification:** Banner persistence works correctly

---

### Step 19: Test Error Scenarios

**Task:** Verify error handling

**Tests:**
- Network error → error message, retry works
- Session timeout → redirect to login with returnUrl
- Server error → friendly message, retry works
- Invalid parameters → graceful degradation

**Verification:** All errors handled gracefully

---

### Step 20: Test Responsive Design

**Task:** Verify mobile, tablet, desktop layouts

**Tests:**
- Mobile (< 768px) → 1 column grid, navigation works
- Tablet (768-1024px) → 2 column grid
- Desktop (> 1024px) → 3 column grid
- All elements accessible and usable on all sizes

**Verification:** Layout adapts correctly to all screen sizes

---

### Step 21: Accessibility Audit

**Task:** Verify WCAG compliance

**Tests:**
- Keyboard navigation works for all interactions
- Screen reader announcements for dynamic content
- ARIA attributes correct (landmarks, live regions, labels)
- Color contrast meets AA standards
- Focus indicators visible
- No keyboard traps

**Tools:** axe DevTools, NVDA/JAWS screen reader testing

**Verification:** No accessibility violations

---

### Step 22: Performance Optimization

**Task:** Optimize render performance

**Optimizations:**
- Memoize RecipeCard with React.memo()
- Use useCallback for event handlers in RecipeListView
- Lazy load images if added later
- Ensure minimal re-renders on state updates

**Verification:** No unnecessary re-renders in React DevTools

---

### Step 23: Integration Testing

**Task:** Test complete user flows

**Flows:**
1. Login → lands on /recipes → sees My Recipes → creates recipe → sees in list
2. Toggle to AI Modified → sees empty state → creates AI recipe from detail → sees in AI list
3. Load more recipes → paginate through multiple pages
4. Dismiss banner → refresh → banner stays dismissed
5. Session expires → redirected to login → logs back in → returns to recipes

**Verification:** All user flows complete successfully

---

### Step 24: Code Review and Cleanup

**Task:** Review code quality

**Checklist:**
- Remove console.logs (except intentional error logging)
- Ensure consistent code formatting (Prettier)
- Fix ESLint warnings
- Add JSDoc comments to complex functions
- Verify all types are properly defined
- Check for unused imports

**Verification:** Linter passes, code is clean

---

### Step 25: Documentation

**Task:** Update project documentation

**Documents:**
- Add component usage examples to CLAUDE.md if needed
- Document any new patterns or conventions
- Update README if user-facing changes

**Verification:** Documentation is accurate and helpful

---

## Implementation Complete

Upon completion of all steps, the Recipe List Page will be fully functional with:
- ✅ Server-side rendered initial load
- ✅ Client-side view switching and pagination
- ✅ Comprehensive error handling
- ✅ Accessible, responsive design
- ✅ Onboarding guidance for new users
- ✅ Proper type safety throughout
- ✅ Clean, maintainable code structure
