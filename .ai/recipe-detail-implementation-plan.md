# Recipe Detail View - Implementation Plan

## 1. Overview

The Recipe Detail view is a comprehensive page for viewing, managing, and adapting recipes. It serves as the primary interface for displaying complete recipe information and provides access to key actions: AI-powered recipe modification, editing, and deletion. For AI-generated recipes, the view displays relationships to original recipes and supports side-by-side comparison. The view implements proper access control, ensures only recipe owners can view and modify their recipes, and handles various error states gracefully.

**Key Capabilities**:
- Display complete recipe details (title, ingredients, instructions, metadata)
- Trigger AI-powered recipe modification based on user's dietary preferences
- Show AI modification status and relationships between original and modified versions
- Support editing and deletion with proper confirmation flows
- Display list of AI-generated variants for original recipes
- Provide comparison view for AI-modified recipes
- Handle multiple error scenarios (no preferences, rate limiting, service unavailable)

## 2. View Routing

**Path**: `/recipes/[id]`

**Dynamic Parameter**:
- `id` (UUID) - Recipe identifier

**File Location**: `/src/pages/recipes/[id].astro`

**Example URLs**:
- `/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## 3. Component Structure

```
RecipeDetailPage (Astro SSR)
└── RecipeDetailView (React)
    ├── Breadcrumb
    ├── RecipeActionBar
    │   ├── Button (Modify with AI - primary)
    │   ├── Button (Edit - secondary)
    │   └── DropdownMenu (overflow)
    │       └── MenuItem (Delete)
    ├── RecipeContent
    │   ├── h1 (Title)
    │   ├── Metadata (timestamps)
    │   ├── AIIndicator (conditional)
    │   ├── IngredientsSection
    │   └── InstructionsSection
    ├── AIVariantsList (conditional, collapsible)
    │   └── VariantCard[] (links to variant recipes)
    ├── CompareView (conditional, collapsible)
    │   ├── OriginalColumn
    │   └── ModifiedColumn
    ├── AIPreviewDialog (modal, conditional)
    │   ├── DialogHeader
    │   ├── PreviewContent
    │   │   ├── OriginalSection
    │   │   ├── ModifiedSection
    │   │   └── ExplanationSection
    │   └── DialogActions (Cancel, Save buttons)
    ├── NoPreferencesAlert (conditional)
    └── DeleteConfirmDialog (modal, conditional)
        ├── DialogHeader
        ├── DialogContent (warning + recipe title)
        └── DialogActions (Cancel, Confirm buttons)
```

## 4. Component Details

### RecipeDetailPage (Astro Component)

**Description**: Server-side rendered page component that fetches initial recipe data and renders the React view.

**Purpose**:
- Validate recipe ID format
- Fetch initial recipe data server-side
- Handle server-side errors (404, 400)
- Render RecipeDetailView with initial data

**Main Elements**:
- Layout wrapper
- RecipeDetailView component (client-side)

**Handled Interactions**: None (static server render)

**Validation**:
- Validate recipe ID is valid UUID format using Zod
- Return 400 error page if invalid UUID
- Return 404 error page if recipe not found or not owned by user

**Types**:
- `RecipeResponseDTO` - Response from GET /api/recipes/:id

**Props**: None (uses Astro.params)

---

### RecipeDetailView (React Component)

**Description**: Main container component for the recipe detail view. Orchestrates data fetching, state management, and rendering of child components.

**Purpose**:
- Fetch and manage recipe data, variants, and parent recipe
- Coordinate AI preview generation
- Manage delete operation
- Render child components with appropriate props

**Main Elements**:
- `<div>` container with max-width constraint
- Breadcrumb navigation
- RecipeActionBar
- RecipeContent
- Conditional rendering of AIVariantsList, CompareView
- Modal dialogs for AI preview and delete confirmation
- Error state displays

**Handled Interactions**:
- Initial data loading
- Refresh after operations (save, delete)

**Validation**: None (delegates to children)

**Types**:
- `RecipeDetailViewModel` (new type):
  ```typescript
  interface RecipeDetailViewModel {
    recipe: RecipeResponseDTO;
    variants: RecipeResponseDTO[]; // Empty for AI recipes
  }
  ```

**Props**:
```typescript
interface RecipeDetailViewProps {
  initialRecipe: RecipeResponseDTO; // From server-side render
  recipeId: string;
}
```

---

### RecipeActionBar (React Component)

**Description**: Sticky action bar positioned at the top of the viewport containing primary action buttons.

**Purpose**:
- Provide quick access to primary actions (Modify with AI, Edit, Delete)
- Remain visible during scrolling for easy access
- Adapt button layout for mobile and desktop

**Main Elements**:
- `<div>` with sticky positioning (`sticky top-0 z-10`)
- Primary button: "Modify with AI" (Button component, variant="default")
- Secondary button: "Edit" (Button component, variant="outline")
- Overflow menu: DropdownMenu with "Delete" item

**Handled Interactions**:
- `onModifyWithAI` - Triggered when "Modify with AI" button clicked
- `onEdit` - Triggered when "Edit" button clicked
- `onDelete` - Triggered when "Delete" menu item clicked

**Validation**: None

**Types**:
- `RecipeActionBarProps` (new type):
  ```typescript
  interface RecipeActionBarProps {
    recipeId: string;
    isAiGenerated: boolean;
    onModifyWithAI: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }
  ```

**Props**: See RecipeActionBarProps above

---

### RecipeContent (React Component)

**Description**: Displays the complete recipe content including title, metadata, ingredients, and instructions.

**Purpose**:
- Present recipe information in a readable, structured format
- Display AI indicator for AI-generated recipes
- Format timestamps in user-friendly manner

**Main Elements**:
- `<h1>` - Recipe title with large, prominent styling
- Metadata section:
  - Created date (formatted as "Created: Month DD, YYYY")
  - Updated date (formatted as "Updated: Month DD, YYYY", only if different from created)
- AIIndicator component (conditional, only if `is_ai_generated === true`)
- Ingredients section:
  - `<h2>` heading: "Ingredients"
  - `<div>` with whitespace-preserved content (whitespace-pre-wrap)
- Instructions section:
  - `<h2>` heading: "Instructions"
  - `<div>` with whitespace-preserved content (whitespace-pre-wrap)

**Handled Interactions**: None (display only)

**Validation**: None

**Types**:
- `RecipeEntity` - From types.ts
- `RecipeAIMetadataEntity | null` - From types.ts

**Props**:
```typescript
interface RecipeContentProps {
  recipe: RecipeResponseDTO;
}
```

---

### AIIndicator (React Component)

**Description**: Visual indicator showing that a recipe is AI-generated, with link to parent recipe.

**Purpose**:
- Clearly identify AI-generated recipes
- Provide navigation to original recipe
- Meet FR-024 requirement for clear indication

**Main Elements**:
- Badge component with "AI Modified" text and robot icon
- Text: "Adapted from: [Parent Recipe Title]"
- Link to parent recipe (`/recipes/${parentRecipeId}`)

**Handled Interactions**: None (uses standard Link component)

**Validation**:
- Only render if `parentRecipeId` is not null
- Should only be used for AI-generated recipes

**Types**:
- `AIIndicatorProps` (new type):
  ```typescript
  interface AIIndicatorProps {
    parentRecipeId: string;
    parentRecipeTitle?: string; // Optional, fetched if not provided
  }
  ```

**Props**: See AIIndicatorProps above

---

### AIVariantsList (React Component)

**Description**: Collapsible section displaying list of AI-modified variants of the current recipe.

**Purpose**:
- Show all AI-generated versions derived from current recipe
- Allow navigation to variant recipes
- Only display for original (non-AI) recipes with variants

**Main Elements**:
- Collapsible component from Shadcn/ui
- Trigger button:
  - Text: "AI Modified Versions (X)" where X is variant count
  - Chevron icon indicating expanded/collapsed state
  - `aria-expanded` and `aria-controls` attributes
- Content area (when expanded):
  - Grid of VariantCard components
  - Responsive layout: 1 column on mobile, 2-3 on desktop

**Handled Interactions**:
- `onToggle` - Expand/collapse section

**Validation**:
- Only render if `variants.length > 0`
- Only display for original recipes (not AI-generated)

**Types**:
- `RecipeResponseDTO[]` - Array of variant recipes
- `AIVariantsListProps` (new type):
  ```typescript
  interface AIVariantsListProps {
    variants: RecipeResponseDTO[];
  }
  ```

**Props**: See AIVariantsListProps above

---

### VariantCard (React Component)

**Description**: Card component displaying summary of an AI-modified variant recipe.

**Purpose**:
- Provide quick overview of variant
- Enable navigation to variant recipe
- Show key information (title, creation date, applied preferences)

**Main Elements**:
- Card component from Shadcn/ui
- CardHeader with title
- CardContent with:
  - Creation date (formatted)
  - Applied preferences summary (if available from ai_metadata)
- Link wrapper for entire card

**Handled Interactions**: None (uses standard Link component)

**Validation**: None

**Types**:
- `RecipeResponseDTO` - Single variant recipe

**Props**:
```typescript
interface VariantCardProps {
  variant: RecipeResponseDTO;
}
```

---

### CompareView (React Component)

**Description**: Collapsible two-column layout for comparing original and AI-modified recipes side-by-side.

**Purpose**:
- Allow users to see exactly what changed in AI modification
- Highlight differences with text markers and styling
- Support both desktop (side-by-side) and mobile (stacked) layouts
- Meet US-021 requirement for viewing modifications

**Main Elements**:
- Collapsible component from Shadcn/ui
- Trigger button:
  - Text: "Compare with Original"
  - Chevron icon
  - `aria-expanded` and `aria-controls` attributes
- Content area (when expanded):
  - Grid layout: `grid md:grid-cols-2 gap-6`
  - OriginalColumn (left/top)
  - ModifiedColumn (right/bottom)
  - Both columns contain:
    - Ingredients section
    - Instructions section
    - Difference indicators

**Handled Interactions**:
- `onToggle` - Expand/collapse section

**Validation**:
- Only render if current recipe is AI-generated
- Only render if parent recipe is available

**Types**:
- `RecipeEntity` - Original recipe
- `RecipeEntity` - Modified recipe
- `CompareViewProps` (new type):
  ```typescript
  interface CompareViewProps {
    original: RecipeEntity;
    modified: RecipeEntity;
  }
  ```

**Props**: See CompareViewProps above

---

### AIPreviewDialog (React Component)

**Description**: Modal dialog displaying AI modification preview with original, modified, and explanation sections.

**Purpose**:
- Show AI-modified recipe before saving
- Display explanation of changes
- Allow editing title before saving
- Provide save and cancel actions
- Handle errors (no preferences, rate limit, service unavailable)

**Main Elements**:
- Dialog component from Shadcn/ui
- DialogHeader with title "AI Recipe Preview"
- DialogContent:
  - Loading state (Spinner + "Generating AI modification...")
  - Success state:
    - Tabs component with "Original", "Modified", "Explanation" tabs
    - Original tab: ingredients + instructions
    - Modified tab: ingredients + instructions + editable title input
    - Explanation tab: explanation text from AI
  - Error state:
    - Error message
    - Action button (varies by error type)
- DialogFooter:
  - Cancel button
  - Save button (disabled during save)

**Handled Interactions**:
- `onSave` - Save AI-modified recipe
- `onCancel` - Close dialog without saving
- Title editing (controlled input)

**Validation**:
- Title required (min 1 character, max 200 characters)
- Validate before enabling Save button
- Show validation error if title empty

**Types**:
- `AIPreviewResponseDTO` - From types.ts
- `AIPreviewState` (new type):
  ```typescript
  type AIPreviewState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success', data: AIPreviewResponseDTO }
    | { status: 'error', error: AIPreviewError };

  type AIPreviewError =
    | { type: 'no_preferences' }
    | { type: 'rate_limit', retryAfter: number }
    | { type: 'not_found' }
    | { type: 'service_unavailable' }
    | { type: 'unknown', message: string };
  ```

**Props**:
```typescript
interface AIPreviewDialogProps {
  isOpen: boolean;
  recipeId: string;
  onClose: () => void;
  onSaved: (newRecipeId: string) => void; // Called after successful save
}
```

---

### NoPreferencesAlert (React Component)

**Description**: Alert component prompting user to set dietary preferences when attempting AI modification without preferences.

**Purpose**:
- Inform user why AI modification is unavailable
- Provide clear call-to-action to set preferences
- Meet US-019 requirements

**Main Elements**:
- Alert component from Shadcn/ui (variant="warning")
- Alert icon (InfoIcon)
- AlertTitle: "Dietary Preferences Required"
- AlertDescription: "Please set your dietary preferences to modify recipes with AI."
- Button: "Go to Profile" (links to profile page)

**Handled Interactions**:
- `onNavigateToProfile` - Navigate to profile page

**Validation**:
- Only display when no preferences error occurs

**Types**: None

**Props**:
```typescript
interface NoPreferencesAlertProps {
  onNavigateToProfile: () => void;
}
```

---

### DeleteConfirmDialog (React Component)

**Description**: Confirmation dialog for recipe deletion with explicit confirmation requirement.

**Purpose**:
- Prevent accidental deletion
- Show recipe title in confirmation
- Provide clear cancel and confirm actions
- Display error if deletion fails

**Main Elements**:
- AlertDialog component from Shadcn/ui
- AlertDialogHeader:
  - AlertDialogTitle: "Delete Recipe"
- AlertDialogContent:
  - Warning text: "Are you sure you want to delete this recipe?"
  - Recipe title in bold
  - Consequence text: "This action cannot be undone."
  - Error message (if deletion failed)
- AlertDialogFooter:
  - Cancel button (AlertDialogCancel)
  - Confirm button (AlertDialogAction, variant="destructive", disabled during deletion)

**Handled Interactions**:
- `onConfirm` - Delete recipe
- `onCancel` - Close dialog without deleting

**Validation**: None (confirmation is the validation)

**Types**:
- `DeleteDialogState` (new type):
  ```typescript
  interface DeleteDialogState {
    isOpen: boolean;
    isDeleting: boolean;
    error: string | null;
  }
  ```

**Props**:
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

## 5. Types

### Existing Types (from types.ts)

```typescript
// Recipe entity from database
type RecipeEntity = {
  id: string;
  owner_id: string;
  title: string;
  ingredients: string;
  instructions: string;
  is_ai_generated: boolean;
  parent_recipe_id: string | null;
  created_at: string;
  updated_at: string;
};

// Recipe with optional AI metadata
type RecipeResponseDTO = RecipeEntity & {
  ai_metadata: RecipeAIMetadataEntity | null;
};

// AI preview response
interface AIPreviewResponseDTO {
  original_recipe: OriginalRecipePreview;
  modified_recipe: ModifiedRecipePreview;
  ai_metadata: AIMetadataInput;
  applied_preferences: AppliedDietaryPreferences;
}

// Components of AI preview
type OriginalRecipePreview = Pick<RecipeEntity, "id" | "title" | "ingredients" | "instructions">;

interface ModifiedRecipePreview {
  title: string;
  ingredients: string;
  instructions: string;
  explanation: string;
}

type AIMetadataInput = {
  model: string;
  provider: string;
  generation_duration: number;
  raw_response: any;
};

type AppliedDietaryPreferences = {
  diet_type: string | null;
  allergies: string[] | null;
  disliked_ingredients: string[] | null;
};

// Error responses
interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}

interface NoPreferencesErrorResponse {
  error: "No dietary preferences";
  message: string;
  action: string;
}

interface RateLimitErrorResponse {
  error: "Rate limit exceeded";
  message: string;
  retry_after: number;
}
```

### New Types for View Implementation

```typescript
/**
 * View model aggregating all data needed for recipe detail view
 */
interface RecipeDetailViewModel {
  recipe: RecipeResponseDTO;
  variants: RecipeResponseDTO[]; // AI-modified versions (empty if current is AI recipe or none ai-modified versions)
}

/**
 * State for AI preview generation with discriminated union
 */
type AIPreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success', data: AIPreviewResponseDTO }
  | { status: 'error', error: AIPreviewError };

/**
 * Detailed error types for AI preview
 */
type AIPreviewError =
  | { type: 'no_preferences' }
  | { type: 'rate_limit', retryAfter: number }
  | { type: 'not_found' }
  | { type: 'service_unavailable' }
  | { type: 'unknown', message: string };

/**
 * State for delete confirmation dialog
 */
interface DeleteDialogState {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Command for saving AI-modified recipe
 */
interface SaveAIRecipeCommand {
  title: string;
  ingredients: string;
  instructions: string;
  is_ai_generated: true;
  parent_recipe_id: string;
  ai_metadata: AIMetadataInput;
}

/**
 * Props for RecipeActionBar component
 */
interface RecipeActionBarProps {
  recipeId: string;
  isAiGenerated: boolean;
  onModifyWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Props for AIIndicator component
 */
interface AIIndicatorProps {
  parentRecipeId: string;
  parentRecipeTitle?: string;
}

/**
 * Props for AIVariantsList component
 */
interface AIVariantsListProps {
  variants: RecipeResponseDTO[];
}

/**
 * Props for VariantCard component
 */
interface VariantCardProps {
  variant: RecipeResponseDTO;
}

/**
 * Props for CompareView component
 */
interface CompareViewProps {
  original: RecipeEntity;
  modified: RecipeEntity;
}

/**
 * Props for AIPreviewDialog component
 */
interface AIPreviewDialogProps {
  isOpen: boolean;
  recipeId: string;
  onClose: () => void;
  onSaved: (newRecipeId: string) => void;
}

/**
 * Props for NoPreferencesAlert component
 */
interface NoPreferencesAlertProps {
  onNavigateToProfile: () => void;
}

/**
 * Props for DeleteConfirmDialog component
 */
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

## 6. State Management

State management for the Recipe Detail view is distributed across multiple custom hooks to maintain separation of concerns and reusability.

### Primary State Locations

**RecipeDetailView Component State**:
- `viewModel: RecipeDetailViewModel | null` - All data for the view (recipe, variants, parent)
- `loading: boolean` - Loading state for initial data fetch
- `error: Error | null` - Error state for data fetching
- `aiPreviewDialogOpen: boolean` - Controls AI preview dialog visibility
- `deleteDialogState: DeleteDialogState` - Controls delete dialog state
- `variantsExpanded: boolean` - Controls AI variants section expanded state
- `compareExpanded: boolean` - Controls compare view expanded state

### Custom Hooks

#### useRecipeDetail(recipeId: string)

**Purpose**: Fetch and manage all recipe-related data (main recipe, variants, parent).

**File Location**: `/src/components/hooks/useRecipeDetail.ts`

**Returns**:
```typescript
interface UseRecipeDetailReturn {
  data: RecipeDetailViewModel | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

**Implementation Details**:
1. Use `useState` for data, loading, error
2. Use `useEffect` to fetch data on mount and when recipeId changes
3. Fetch operations:
   - GET `/api/recipes/${recipeId}` - Main recipe
   - GET `/api/recipes?parent_recipe_id=${recipeId}` - Variants
4. Use `Promise.all()` to fetch in parallel
5. Handle 404 errors (recipe not found or unauthorized)
6. Provide `refresh()` function to re-fetch data after mutations

---

#### useAIPreview(recipeId: string)

**Purpose**: Generate AI preview by calling the AI preview endpoint.

**File Location**: `/src/components/hooks/useAIPreview.ts`

**Returns**:
```typescript
interface UseAIPreviewReturn {
  state: AIPreviewState;
  generate: () => Promise<void>;
  reset: () => void;
}
```

**Implementation Details**:
1. Use `useState<AIPreviewState>` with initial value `{ status: 'idle' }`
2. `generate()` function:
   - Set state to `{ status: 'loading' }`
   - POST to `/api/recipes/${recipeId}/ai-preview`
   - On success: Set state to `{ status: 'success', data: response }`
   - On error: Parse error response and set appropriate error state:
     - 400 with "No dietary preferences" → `{ status: 'error', error: { type: 'no_preferences' } }`
     - 429 → `{ status: 'error', error: { type: 'rate_limit', retryAfter: response.retry_after } }`
     - 404 → `{ status: 'error', error: { type: 'not_found' } }`
     - 503 → `{ status: 'error', error: { type: 'service_unavailable' } }`
     - Other → `{ status: 'error', error: { type: 'unknown', message: error.message } }`
3. `reset()` function: Set state back to `{ status: 'idle' }`

---

#### useDeleteRecipe(recipeId: string)

**Purpose**: Delete recipe with confirmation dialog state management.

**File Location**: `/src/components/hooks/useDeleteRecipe.ts`

**Returns**:
```typescript
interface UseDeleteRecipeReturn {
  dialogState: DeleteDialogState;
  openDialog: () => void;
  closeDialog: () => void;
  confirmDelete: () => Promise<void>;
}
```

**Implementation Details**:
1. Use `useState<DeleteDialogState>` with initial value `{ isOpen: false, isDeleting: false, error: null }`
2. `openDialog()`: Set `isOpen: true`
3. `closeDialog()`: Set `isOpen: false, error: null`
4. `confirmDelete()`:
   - Set `isDeleting: true, error: null`
   - DELETE to `/api/recipes/${recipeId}`
   - On success: Navigate to `/recipes` using Astro navigation
   - On error: Set `error: error.message, isDeleting: false`

---

#### useSaveAIRecipe()

**Purpose**: Save AI-modified recipe as new recipe entry.

**File Location**: `/src/components/hooks/useSaveAIRecipe.ts`

**Returns**:
```typescript
interface UseSaveAIRecipeReturn {
  saving: boolean;
  error: string | null;
  save: (command: SaveAIRecipeCommand) => Promise<string>;
}
```

**Implementation Details**:
1. Use `useState` for `saving` and `error`
2. `save()` function:
   - Set `saving: true, error: null`
   - POST to `/api/recipes` with command payload
   - On success: Return new recipe ID
   - On error: Set `error: error.message, saving: false` and throw
3. Caller handles navigation after successful save

### State Flow Diagram

```
User Action → Hook → API Call → State Update → Component Re-render
     ↓          ↓         ↓            ↓               ↓
Load Page → useRecipeDetail → GET /api/recipes/:id → viewModel → Display content
Click "Modify" → useAIPreview → POST /ai-preview → aiPreviewState → Show dialog
Click "Save" → useSaveAIRecipe → POST /api/recipes → success → Navigate to new recipe
Click "Delete" → useDeleteRecipe → DELETE /api/recipes/:id → success → Navigate to list
```

## 7. API Integration

### API Endpoints Used

#### 1. GET /api/recipes/:id

**Purpose**: Fetch main recipe with AI metadata

**Request**:
- Method: GET
- URL: `/api/recipes/${recipeId}`
- Headers: None (authentication handled by middleware)
- Body: None

**Response Type**: `RecipeResponseDTO`

**Success Response (200)**:
```typescript
{
  id: string;
  owner_id: string;
  title: string;
  ingredients: string;
  instructions: string;
  is_ai_generated: boolean;
  parent_recipe_id: string | null;
  created_at: string;
  updated_at: string;
  ai_metadata: {
    recipe_id: string;
    owner_id: string;
    model: string;
    provider: string;
    created_at: string;
    generation_duration: number;
    raw_response: any;
  } | null;
}
```

**Error Responses**:
- 400: Invalid UUID format
- 404: Recipe not found or not owned by user
- 500: Internal server error

**Usage in Hook**: `useRecipeDetail`

---

#### 2. GET /api/recipes?parent_recipe_id=:id

**Purpose**: Fetch AI-generated variants of a recipe

**Request**:
- Method: GET
- URL: `/api/recipes?parent_recipe_id=${recipeId}`
- Headers: None
- Body: None

**Response Type**: `RecipeListResponseDTO`

**Success Response (200)**:
```typescript
{
  data: RecipeResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

**Usage in Hook**: `useRecipeDetail` (only for non-AI recipes)

---

#### 3. POST /api/recipes/:id/ai-preview

**Purpose**: Generate AI-modified recipe preview

**Request**:
- Method: POST
- URL: `/api/recipes/${recipeId}/ai-preview`
- Headers: None
- Body: None (uses recipe content and user's dietary preferences automatically)

**Response Type**: `AIPreviewResponseDTO`

**Success Response (200)**:
```typescript
{
  original_recipe: {
    id: string;
    title: string;
    ingredients: string;
    instructions: string;
  };
  modified_recipe: {
    title: string;
    ingredients: string;
    instructions: string;
    explanation: string;
  };
  ai_metadata: {
    model: string;
    provider: string;
    generation_duration: number;
    raw_response: any;
  };
  applied_preferences: {
    diet_type: string | null;
    allergies: string[] | null;
    disliked_ingredients: string[] | null;
  };
}
```

**Error Responses**:
- 400: Invalid UUID or no dietary preferences (NoPreferencesErrorResponse)
- 404: Recipe not found
- 429: Rate limit exceeded (RateLimitErrorResponse)
- 503: AI service unavailable
- 504: Request timeout

**Usage in Hook**: `useAIPreview`

---

#### 4. POST /api/recipes

**Purpose**: Save AI-modified recipe as new recipe

**Request**:
- Method: POST
- URL: `/api/recipes`
- Headers: Content-Type: application/json
- Body: `SaveAIRecipeCommand`

**Request Body Type**:
```typescript
{
  title: string;
  ingredients: string;
  instructions: string;
  is_ai_generated: true;
  parent_recipe_id: string;
  ai_metadata: {
    model: string;
    provider: string;
    generation_duration: number;
    raw_response: any;
  };
}
```

**Response Type**: `RecipeResponseDTO`

**Success Response (201)**:
```typescript
{
  id: string; // New recipe ID
  owner_id: string;
  // ... rest of recipe fields
}
```

**Error Responses**:
- 400: Validation error
- 500: Internal server error

**Usage in Hook**: `useSaveAIRecipe`

---

#### 5. DELETE /api/recipes/:id

**Purpose**: Delete recipe

**Request**:
- Method: DELETE
- URL: `/api/recipes/${recipeId}`
- Headers: None
- Body: None

**Response Type**: None (empty body)

**Success Response (204)**: No content

**Error Responses**:
- 400: Invalid UUID format
- 404: Recipe not found or not owned by user
- 500: Internal server error

**Usage in Hook**: `useDeleteRecipe`

### Error Handling Pattern

All API calls follow this error handling pattern:

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    // Parse error response
    const errorData = await response.json() as APIErrorResponse;

    // Handle specific status codes
    if (response.status === 404) {
      // Handle not found
    } else if (response.status === 400) {
      // Check for specific error types (no preferences, validation)
    } else if (response.status === 429) {
      // Handle rate limit
    }

    throw new Error(errorData.message);
  }

  return await response.json();
} catch (error) {
  // Handle network errors
  console.error('API call failed:', error);
  throw error;
}
```

## 8. User Interactions

### 1. Load Recipe Detail Page

**Trigger**: User navigates to `/recipes/:id`

**Flow**:
1. Astro page component validates recipe ID format
2. Server-side fetch of initial recipe data
3. If error (404, 400): Display error page
4. If success: Render RecipeDetailView with initial data
5. Client-side hydration
6. useRecipeDetail hook fetches variants/parent data
7. Display complete view

**Expected Outcome**: User sees complete recipe details with all related data

---

### 2. Modify Recipe with AI

**Trigger**: User clicks "Modify with AI" button in RecipeActionBar

**Flow**:
1. Click event triggers `onModifyWithAI`
2. Open AIPreviewDialog (`aiPreviewDialogOpen: true`)
3. useAIPreview.generate() called automatically on dialog open
4. Display loading state ("Generating AI modification...")
5. POST to `/api/recipes/:id/ai-preview`
6. Success: Display preview with tabs (Original, Modified, Explanation)
7. User reviews AI modifications
8. User can edit title in Modified tab
9. User clicks "Save" or "Cancel"

**Expected Outcome**:
- Success: Preview displayed, user can save or cancel
- Error: Appropriate error message with action button

**Error Scenarios**:
- No preferences: Show NoPreferencesAlert with "Go to Profile" button
- Rate limit: Show error with countdown timer
- Service unavailable: Show error with "Try Again" button

---

### 3. Save AI-Modified Recipe

**Trigger**: User clicks "Save" button in AIPreviewDialog

**Flow**:
1. Validate title (required, max 200 chars)
2. If invalid: Show validation error, prevent save
3. If valid: Call useSaveAIRecipe.save() with SaveAIRecipeCommand
4. Display saving state (disable button, show spinner)
5. POST to `/api/recipes` with command payload
6. Success: Close dialog, navigate to new recipe (`/recipes/${newRecipeId}`)
7. Error: Show error message in dialog, keep dialog open

**Expected Outcome**: New recipe created, user navigated to new recipe detail page

---

### 4. Cancel AI Modification

**Trigger**: User clicks "Cancel" button in AIPreviewDialog or closes dialog

**Flow**:
1. Click event triggers `onClose`
2. Reset AI preview state (useAIPreview.reset())
3. Close dialog (`aiPreviewDialogOpen: false`)

**Expected Outcome**: Dialog closed, no changes made, return to recipe view

---

### 5. Edit Recipe

**Trigger**: User clicks "Edit" button in RecipeActionBar

**Flow**:
1. Click event triggers `onEdit`
2. Navigate to edit page (`/recipes/${recipeId}/edit`)

**Expected Outcome**: User navigated to edit page

---

### 6. Delete Recipe

**Trigger**: User clicks "Delete" in RecipeActionBar overflow menu

**Flow**:
1. Click event triggers `onDelete`
2. Open DeleteConfirmDialog (useDeleteRecipe.openDialog())
3. Display warning with recipe title
4. User clicks "Confirm" or "Cancel"

**Expected Outcome**: Delete confirmation dialog displayed

---

### 7. Confirm Delete

**Trigger**: User clicks "Confirm" button in DeleteConfirmDialog

**Flow**:
1. Click event triggers `confirmDelete`
2. Display deleting state (disable buttons, show spinner)
3. DELETE to `/api/recipes/:id`
4. Success: Close dialog, navigate to `/recipes`
5. Error: Show error message in dialog, keep dialog open

**Expected Outcome**: Recipe deleted, user navigated to recipe list page

---

### 8. Cancel Delete

**Trigger**: User clicks "Cancel" button in DeleteConfirmDialog

**Flow**:
1. Click event triggers `closeDialog`
2. Close dialog, reset error state

**Expected Outcome**: Dialog closed, no changes made

---

### 9. Toggle AI Variants Section

**Trigger**: User clicks AI variants section header

**Flow**:
1. Click event triggers toggle
2. Update `variantsExpanded` state
3. Collapsible component animates open/closed
4. Update `aria-expanded` attribute

**Expected Outcome**: Section expands or collapses smoothly

---

### 10. Toggle Compare View

**Trigger**: User clicks compare view section header

**Flow**:
1. Click event triggers toggle
2. Update `compareExpanded` state
3. Collapsible component animates open/closed
4. Update `aria-expanded` attribute
5. If expanding: Fetch parent recipe if not already loaded

**Expected Outcome**: Comparison view expands or collapses, showing side-by-side comparison

---

### 11. Navigate to Parent Recipe

**Trigger**: User clicks parent recipe link in AIIndicator

**Flow**:
1. Click event on Link component
2. Navigate to `/recipes/${parentRecipeId}`
3. New page loads with parent recipe details

**Expected Outcome**: User navigated to parent recipe detail page

---

### 12. Navigate to Variant Recipe

**Trigger**: User clicks variant card in AIVariantsList

**Flow**:
1. Click event on VariantCard Link
2. Navigate to `/recipes/${variantId}`
3. New page loads with variant recipe details

**Expected Outcome**: User navigated to variant recipe detail page

---

### 13. Navigate Back to Recipe List

**Trigger**: User clicks breadcrumb or "Back to Recipes" link

**Flow**:
1. Click event on Link component
2. Navigate to `/recipes`

**Expected Outcome**: User navigated to recipe list page

## 9. Conditions and Validation

### Component-Level Conditions

#### RecipeDetailView

**Condition 1: Recipe Loading State**
- **Check**: `loading === true`
- **Effect**: Display skeleton loader or loading spinner
- **Components Affected**: Entire view

**Condition 2: Recipe Load Error**
- **Check**: `error !== null`
- **Effect**: Display error message with retry button
- **Components Affected**: Entire view

**Condition 3: Recipe Not Found**
- **Check**: `error.status === 404`
- **Effect**: Display "Recipe not found" message with link to recipe list
- **Components Affected**: Entire view

---

#### RecipeActionBar

**Condition 1: Disable Modify Button During AI Preview**
- **Check**: AI preview is in loading state
- **Effect**: Disable "Modify with AI" button to prevent duplicate requests
- **Validation**: `aiPreviewState.status === 'loading'`

**Condition 2: Hide Edit/Delete for AI-Generated Recipes (Optional)**
- **Check**: `isAiGenerated === true`
- **Effect**: Could optionally hide/disable edit button for AI recipes (product decision)
- **Validation**: Check `recipe.is_ai_generated`

---

#### AIIndicator

**Condition 1: Display Only for AI-Generated Recipes**
- **Check**: `recipe.is_ai_generated === true`
- **Effect**: Component not rendered if false
- **Validation**: Check `recipe.is_ai_generated`

**Condition 2: Parent Recipe ID Must Exist**
- **Check**: `recipe.parent_recipe_id !== null`
- **Effect**: Component not rendered if null
- **Validation**: Check `recipe.parent_recipe_id`

---

#### AIVariantsList

**Condition 1: Display Only for Original Recipes**
- **Check**: `recipe.is_ai_generated === false`
- **Effect**: Component not rendered if true
- **Validation**: Check `recipe.is_ai_generated`

**Condition 2: Display Only if Variants Exist**
- **Check**: `variants.length > 0`
- **Effect**: Component not rendered if no variants
- **Validation**: Check `variants` array length

---

#### CompareView

**Condition 1: Display Only for AI-Generated Recipes**
- **Check**: `recipe.is_ai_generated === true`
- **Effect**: Component not rendered if false
- **Validation**: Check `recipe.is_ai_generated`

**Condition 2: Parent Recipe Must Be Loaded**
- **Check**: `parentRecipe !== null`
- **Effect**: Component not rendered or shows loading state if null
- **Validation**: Check `parentRecipe` is loaded

---

#### AIPreviewDialog

**Condition 1: No Dietary Preferences**
- **Check**: API returns 400 with `error: "No dietary preferences"`
- **Effect**: Display NoPreferencesAlert inside dialog
- **Validation**: Check `aiPreviewState.status === 'error' && aiPreviewState.error.type === 'no_preferences'`
- **Action**: Show "Go to Profile" button

**Condition 2: Rate Limit Exceeded**
- **Check**: API returns 429 with retry_after
- **Effect**: Display rate limit error with countdown
- **Validation**: Check `aiPreviewState.status === 'error' && aiPreviewState.error.type === 'rate_limit'`
- **Action**: Disable "Try Again" button until countdown expires

**Condition 3: AI Service Unavailable**
- **Check**: API returns 503
- **Effect**: Display service unavailable error
- **Validation**: Check `aiPreviewState.status === 'error' && aiPreviewState.error.type === 'service_unavailable'`
- **Action**: Show "Try Again" button

**Condition 4: Title Validation**
- **Check**: Title is empty or exceeds 200 characters
- **Effect**: Disable Save button, show validation error
- **Validation**:
  - Required: `title.trim().length > 0`
  - Max length: `title.length <= 200`

**Condition 5: Disable Save During Save Operation**
- **Check**: `saving === true`
- **Effect**: Disable Save button, show spinner
- **Validation**: Check `useSaveAIRecipe.saving` state

---

#### DeleteConfirmDialog

**Condition 1: Disable Confirm During Delete Operation**
- **Check**: `isDeleting === true`
- **Effect**: Disable both buttons, show spinner on Confirm button
- **Validation**: Check `dialogState.isDeleting`

**Condition 2: Display Delete Error**
- **Check**: `error !== null`
- **Effect**: Display error message in dialog
- **Validation**: Check `dialogState.error`

### Validation Summary Table

| Component | Condition | Check | Effect on UI | API Dependency |
|-----------|-----------|-------|--------------|----------------|
| RecipeDetailView | Recipe not found | error.status === 404 | Show 404 message | GET /api/recipes/:id |
| RecipeDetailView | Loading state | loading === true | Show skeleton | N/A |
| AIIndicator | Is AI generated | is_ai_generated === true | Render component | N/A |
| AIIndicator | Has parent | parent_recipe_id !== null | Render link | N/A |
| AIVariantsList | Is original recipe | is_ai_generated === false | Render component | N/A |
| AIVariantsList | Has variants | variants.length > 0 | Render list | GET /api/recipes?parent_recipe_id |
| CompareView | Is AI generated | is_ai_generated === true | Render component | N/A |
| CompareView | Parent loaded | parentRecipe !== null | Render comparison | GET /api/recipes/:parentId |
| AIPreviewDialog | No preferences | error.type === 'no_preferences' | Show alert | POST /api/recipes/:id/ai-preview |
| AIPreviewDialog | Rate limited | error.type === 'rate_limit' | Show countdown | POST /api/recipes/:id/ai-preview |
| AIPreviewDialog | Title valid | title.trim().length > 0 && <= 200 | Enable save | N/A |
| AIPreviewDialog | Saving | saving === true | Disable save | POST /api/recipes |
| DeleteConfirmDialog | Deleting | isDeleting === true | Disable buttons | DELETE /api/recipes/:id |

## 10. Error Handling

### Error Categories and Handling Strategies

#### 1. Recipe Not Found (404)

**Scenario**: Recipe doesn't exist or user doesn't own it

**Detection**:
- Server-side: Astro page receives 404 from GET /api/recipes/:id
- Client-side: useRecipeDetail hook receives 404 response

**Handling**:
- Display user-friendly error page with:
  - Title: "Recipe Not Found"
  - Message: "This recipe doesn't exist or you don't have access to it."
  - Action: Link to recipe list ("View All Recipes")
  - Icon: Appropriate illustration (empty state icon)

**Component**: RecipeDetailView (error state)

**User Action**: Navigate to recipe list

---

#### 2. Invalid Recipe ID (400)

**Scenario**: Recipe ID is not a valid UUID

**Detection**: Server-side validation in Astro page

**Handling**:
- Display error page with:
  - Title: "Invalid Recipe ID"
  - Message: "The recipe ID format is invalid."
  - Action: Link to recipe list

**Component**: RecipeDetailPage (Astro error page)

**User Action**: Navigate to recipe list

---

#### 3. No Dietary Preferences (400)

**Scenario**: User attempts AI modification without setting dietary preferences

**Detection**: POST /api/recipes/:id/ai-preview returns 400 with NoPreferencesErrorResponse

**Handling**:
- Display NoPreferencesAlert inside AIPreviewDialog with:
  - Alert type: Warning
  - Title: "Dietary Preferences Required"
  - Message: "Please set your dietary preferences to modify recipes with AI."
  - Action: "Go to Profile" button (navigates to /profile)

**Component**: AIPreviewDialog

**User Action**: Navigate to profile page to set preferences

---

#### 4. Rate Limit Exceeded (429)

**Scenario**: User exceeds 10 AI modification requests per minute

**Detection**: POST /api/recipes/:id/ai-preview returns 429 with RateLimitErrorResponse

**Handling**:
- Display error in AIPreviewDialog with:
  - Alert type: Warning
  - Title: "Too Many Requests"
  - Message: "You've made too many AI modification requests. Please wait before trying again."
  - Countdown timer showing retry_after seconds
  - "Try Again" button (disabled until countdown expires)

**Component**: AIPreviewDialog

**User Action**: Wait for countdown, then retry

**Additional State**:
- Optionally store rate limit state in localStorage to persist across page reloads
- Disable "Modify with AI" button in RecipeActionBar during rate limit period

---

#### 5. AI Service Unavailable (503)

**Scenario**: AI service (OpenRouter) is temporarily unavailable

**Detection**: POST /api/recipes/:id/ai-preview returns 503

**Handling**:
- Display error in AIPreviewDialog with:
  - Alert type: Error
  - Title: "Service Temporarily Unavailable"
  - Message: "The AI service is currently unavailable. Please try again in a few moments."
  - Action: "Try Again" button
  - Icon: Service unavailable icon

**Component**: AIPreviewDialog

**User Action**: Retry AI modification

---

#### 6. Request Timeout (504)

**Scenario**: AI modification takes too long (>120 seconds)

**Detection**: POST /api/recipes/:id/ai-preview returns 504

**Handling**:
- Display error in AIPreviewDialog with:
  - Alert type: Error
  - Title: "Request Timeout"
  - Message: "The AI modification took too long to process. Please try again."
  - Action: "Try Again" button

**Component**: AIPreviewDialog

**User Action**: Retry AI modification

---

#### 7. Network Error

**Scenario**: Network connection lost or request fails to reach server

**Detection**: Fetch throws network error (no response)

**Handling**:
- Display error with:
  - Alert type: Error
  - Title: "Connection Error"
  - Message: "Unable to connect to the server. Please check your internet connection."
  - Action: "Retry" button

**Component**: All components making API calls

**User Action**: Check connection and retry

---

#### 8. Delete Failed (500)

**Scenario**: Recipe deletion fails due to server error

**Detection**: DELETE /api/recipes/:id returns 500

**Handling**:
- Display error in DeleteConfirmDialog with:
  - Alert type: Error
  - Message: "Failed to delete recipe. Please try again."
  - Keep dialog open
  - Re-enable buttons

**Component**: DeleteConfirmDialog

**User Action**: Retry deletion or cancel

---

#### 9. Save AI Recipe Failed (500)

**Scenario**: Saving AI-modified recipe fails due to server error

**Detection**: POST /api/recipes returns 500

**Handling**:
- Display error in AIPreviewDialog with:
  - Alert type: Error
  - Message: "Failed to save recipe. Please try again."
  - Keep dialog open
  - Re-enable Save button

**Component**: AIPreviewDialog

**User Action**: Retry save or cancel

---

#### 10. Validation Error (400)

**Scenario**: Recipe data fails validation (e.g., title too long)

**Detection**: POST /api/recipes returns 400 with validation details

**Handling**:
- Display validation errors inline:
  - Show error message below title input
  - Highlight invalid field with red border
  - Disable Save button until valid

**Component**: AIPreviewDialog

**User Action**: Correct validation errors and retry

---

### Error Logging

All errors should be logged for debugging:

```typescript
console.error('Error context', {
  component: 'ComponentName',
  operation: 'operationName',
  error: error,
  recipeId: recipeId,
  userId: userId,
  timestamp: new Date().toISOString()
});
```

### Error Recovery Strategies

1. **Automatic Retry**: For transient errors (network, timeout), automatically retry once after delay
2. **Manual Retry**: Provide "Try Again" button for recoverable errors
3. **Fallback**: Show cached data with warning if available
4. **Graceful Degradation**: Hide features that are unavailable due to errors
5. **User Guidance**: Provide clear instructions for resolving errors

## 11. Implementation Steps

### Phase 1: Setup and Types (1-2 hours)

**Step 1.1**: Create type definitions
- File: `/src/types.ts` (add to existing)
- Add all new types listed in Section 5
- Export all interfaces and types

**Step 1.2**: Create Shadcn components (if not already installed)
- Install required components:
  ```bash
  npx shadcn@latest add button
  npx shadcn@latest add card
  npx shadcn@latest add dropdown-menu
  npx shadcn@latest add dialog
  npx shadcn@latest add alert-dialog
  npx shadcn@latest add collapsible
  npx shadcn@latest add tabs
  npx shadcn@latest add badge
  npx shadcn@latest add alert
  ```

---

### Phase 2: Custom Hooks (3-4 hours)

**Step 2.1**: Create useRecipeDetail hook
- File: `/src/components/hooks/useRecipeDetail.ts`
- Implement data fetching for recipe, variants, parent
- Handle loading and error states
- Provide refresh function

**Step 2.2**: Create useAIPreview hook
- File: `/src/components/hooks/useAIPreview.ts`
- Implement AI preview generation
- Handle all error scenarios
- Implement state machine pattern

**Step 2.3**: Create useDeleteRecipe hook
- File: `/src/components/hooks/useDeleteRecipe.ts`
- Implement delete operation with confirmation state
- Handle delete errors
- Integrate with navigation

**Step 2.4**: Create useSaveAIRecipe hook
- File: `/src/components/hooks/useSaveAIRecipe.ts`
- Implement save operation
- Handle validation and errors
- Return new recipe ID

**Testing**: Test each hook in isolation with mock API responses

---

### Phase 3: Base Components (4-6 hours)

**Step 3.1**: Create RecipeContent component
- File: `/src/components/RecipeContent.tsx`
- Display title, metadata, ingredients, instructions
- Format dates using date-fns or native Intl
- Style with Tailwind for readability

**Step 3.2**: Create AIIndicator component
- File: `/src/components/AIIndicator.tsx`
- Display AI badge and parent link
- Conditional rendering based on props

**Step 3.3**: Create RecipeActionBar component
- File: `/src/components/RecipeActionBar.tsx`
- Implement sticky positioning
- Add buttons with proper variants
- Implement dropdown menu for delete action
- Make responsive (mobile/desktop layouts)

**Step 3.4**: Create VariantCard component
- File: `/src/components/VariantCard.tsx`
- Display variant summary in card
- Format creation date
- Add hover effects and transitions

**Testing**: Test each component in Storybook or isolation

---

### Phase 4: Complex Components (6-8 hours)

**Step 4.1**: Create AIVariantsList component
- File: `/src/components/AIVariantsList.tsx`
- Implement collapsible functionality
- Render grid of VariantCard components
- Handle empty state
- Add proper ARIA attributes

**Step 4.2**: Create CompareView component
- File: `/src/components/CompareView.tsx`
- Implement collapsible two-column layout
- Create difference highlighting logic
- Make responsive (stacked on mobile)
- Add text markers for changes
- Ensure accessibility

**Step 4.3**: Create NoPreferencesAlert component
- File: `/src/components/NoPreferencesAlert.tsx`
- Display warning alert with action button
- Implement navigation to profile

**Testing**: Test collapsible interactions, responsive layouts, difference highlighting

---

### Phase 5: Dialog Components (6-8 hours)

**Step 5.1**: Create DeleteConfirmDialog component
- File: `/src/components/DeleteConfirmDialog.tsx`
- Implement AlertDialog with confirmation
- Display recipe title in message
- Handle deleting state and errors
- Add proper keyboard handling

**Step 5.2**: Create AIPreviewDialog component
- File: `/src/components/AIPreviewDialog.tsx`
- Implement tabs for Original/Modified/Explanation
- Add loading state with spinner
- Add error states for all scenarios
- Implement title editing with validation
- Add save and cancel actions
- Handle all error types (no preferences, rate limit, etc.)

**Testing**: Test all dialog states (idle, loading, success, error), test validation, test keyboard navigation

---

### Phase 6: Main View Component (4-6 hours)

**Step 6.1**: Create RecipeDetailView component
- File: `/src/components/RecipeDetailView.tsx`
- Integrate all child components
- Implement state management
- Connect all hooks
- Handle conditional rendering
- Implement breadcrumb navigation

**Step 6.2**: Wire up all interactions
- Connect button handlers to hooks
- Implement dialog open/close logic
- Handle navigation after operations
- Add loading states
- Add error boundaries

**Testing**: Integration testing of entire view, test all user flows

---

### Phase 7: Astro Page (2-3 hours)

**Step 7.1**: Create Astro page component
- File: `/src/pages/recipes/[id].astro`
- Implement server-side data fetching
- Add error handling (404, 400)
- Pass initial data to RecipeDetailView
- Add meta tags for SEO

**Step 7.2**: Add page layout
- Use existing layout component
- Add breadcrumb schema markup
- Configure View Transitions API

**Testing**: Test server-side rendering, test error pages, test initial data loading

---

### Phase 8: Styling and Responsiveness (3-4 hours)

**Step 8.1**: Apply Tailwind styling
- Ensure consistent spacing and typography
- Add proper color scheme (dark mode support)
- Implement responsive breakpoints
- Add hover/focus states
- Ensure proper contrast ratios

**Step 8.2**: Add animations and transitions
- Add smooth transitions for collapsibles
- Add loading animations
- Add dialog enter/exit animations
- Add button loading states

**Step 8.3**: Polish UI details
- Add icons where appropriate
- Ensure consistent button sizes
- Add skeleton loaders
- Add empty states

**Testing**: Test on multiple screen sizes, test dark mode, test animations

---

### Phase 9: Accessibility (2-3 hours)

**Step 9.1**: Add ARIA attributes
- Add aria-expanded, aria-controls for collapsibles
- Add aria-labelledby, aria-describedby where needed
- Add aria-live regions for dynamic content
- Add proper heading hierarchy

**Step 9.2**: Keyboard navigation
- Ensure all interactive elements are keyboard accessible
- Test tab order
- Add keyboard shortcuts where appropriate
- Ensure dialogs trap focus

**Step 9.3**: Screen reader testing
- Test with screen reader (VoiceOver, NVDA)
- Ensure all content is announced correctly
- Ensure errors are announced
- Add sr-only text where needed

**Testing**: Automated accessibility testing with axe, manual testing with keyboard and screen reader

---

### Phase 10: Error Handling and Edge Cases (2-3 hours)

**Step 10.1**: Implement error boundaries
- Add React error boundary component
- Add fallback UI for unexpected errors
- Log errors for debugging

**Step 10.2**: Handle edge cases
- Empty variants list
- Missing parent recipe
- Very long recipe content
- Special characters in recipe text
- Network timeouts

**Step 10.3**: Add error recovery
- Add retry buttons where appropriate
- Implement automatic retry for transient errors
- Add fallback data where possible

**Testing**: Test all error scenarios, test edge cases, test error recovery

---

### Total Estimated Time: 38-52 hours

### Priority Order for MVP:
1. Phase 1-2: Setup and Hooks (foundation)
2. Phase 3: Base Components (core functionality)
3. Phase 6-7: Main View and Astro Page (integration)
4. Phase 8: Basic Styling (usability)
5. Phase 5: Dialog Components (AI modification)
6. Phase 4: Complex Components (variants and compare)
7. Phase 9-11: Accessibility, Error Handling, Testing (polish)

### Suggested Development Approach:
- Build incrementally, testing each component before moving to the next
- Start with basic read-only view, then add interactions
- Add AI modification feature after basic view is working
- Add compare and variants features last
- Test thoroughly at each phase before moving forward
