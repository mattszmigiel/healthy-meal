# View Implementation Plan: Add Recipe

## 1. Overview

The Add Recipe view provides a form interface for users to create and save new original recipes to their personal library. This view is a foundational feature of the HealthyMeal application, enabling users to build their recipe collection before utilizing AI-powered modifications. The view emphasizes data validation, user feedback, and error handling to ensure a smooth recipe creation experience.

**Key Features:**
- Three-field form: title, ingredients, and instructions
- Real-time character counting with visual warnings
- Client-side validation matching API requirements
- Network error handling with data preservation
- Success feedback and automatic navigation
- Full Unicode support for special characters

## 2. View Routing

**Path:** `/recipes/new`

**File Location:** `src/pages/recipes/new.astro`

This is an Astro page that renders the React-based form component. The page should serves as the entry point for recipe creation.

## 3. Component Structure

```
AddRecipePage (Astro Page)
└── AddRecipeForm (React Component)
    ├── Form Header
    │   └── Heading: "Create Recipe"
    ├── FormField: Title
    │   ├── Label
    │   ├── Input
    │   ├── CharacterCounter (0 / 200)
    │   └── ErrorMessage
    ├── FormField: Ingredients
    │   ├── Label
    │   ├── Textarea
    │   └── ErrorMessage
    ├── FormField: Instructions
    │   ├── Label
    │   ├── Textarea
    │   └── ErrorMessage
    ├── CharacterCounter: Combined Content (0 / 10,000)
    ├── ErrorDisplay: General Errors
    └── FormActions
        ├── Button: Cancel
        └── Button: Save Recipe (primary)
```

**Component Hierarchy:**
1. **Page Level:** Astro page wrapper (`new.astro`)
2. **Form Level:** Main form component (`AddRecipeForm.tsx`)
3. **Field Level:** Reusable form fields with labels and errors
4. **UI Level:** Shadcn/ui primitives (Button, Input, Textarea, Label)

## 4. Component Details

### 4.1 AddRecipePage (Astro Page)

**Component Description:**
Astro page component that serves as the route handler for `/recipes/new`. This is a simple wrapper that imports and renders the React-based `AddRecipeForm` component within the application layout.

**Main Elements:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import AddRecipeForm from '@/components/recipes/AddRecipeForm';
---

<Layout title="Create Recipe">
  <main class="container mx-auto px-4 py-8">
    <AddRecipeForm client:load />
  </main>
</Layout>
```

**Handled Events:** None (static page wrapper)

**Validation Conditions:** None (handled in React component)

**Types:** None specific to this component

**Props:** None

---

### 4.2 AddRecipeForm (React Component)

**Component Description:**
Main form component that handles recipe creation. This component manages all form state, validation, API communication, and user feedback. It orchestrates the entire recipe creation flow from user input to successful save or error handling.

**Main Elements:**
- `<form>` element with `onSubmit` handler
- Page heading (`<h1>`)
- Three form field sections (title, ingredients, instructions)
- Two character counters (title-specific and combined content)
- Error display area for general/network errors
- Action buttons (Cancel and Save)
- Loading overlay/spinner during submission

**Handled Interactions:**
1. **Form submission** (`onSubmit`):
   - Prevents default form behavior
   - Validates all fields client-side
   - Calls API if validation passes
   - Handles success/error responses

2. **Field changes** (`onChange` for each input):
   - Updates form data state
   - Recalculates character counts
   - Clears field-specific errors

3. **Field blur** (`onBlur`):
   - Triggers field-level validation
   - Displays errors for invalid fields

4. **Cancel action** (`onClick` on Cancel button):
   - Navigates back to recipe list
   - Optionally shows confirmation if form has data

**Handled Validation:**

1. **Title Validation:**
   - Required: Must not be empty after trimming whitespace
   - Max length: 200 characters
   - Error messages:
     - Empty: "Title is required"
     - Too long: "Title must not exceed 200 characters"

2. **Ingredients Validation:**
   - Required: Must not be empty after trimming whitespace
   - Error message: "Ingredients are required"

3. **Instructions Validation:**
   - Required: Must not be empty after trimming whitespace
   - Error message: "Instructions are required"

4. **Combined Content Length Validation:**
   - Combined length: `ingredients.length + instructions.length <= 10,000`
   - Warning threshold: 9,000 characters (90%)
   - Error message: "Combined ingredients and instructions must not exceed 10,000 characters"

5. **Form-Level Validation:**
   - All fields must pass individual validation
   - Combined length must not exceed limit
   - Submit button disabled if any validation fails

**Types:**
- `AddRecipeFormData` (ViewModel)
- `FormErrors` (ViewModel)
- `CharacterCountInfo` (ViewModel)
- `CreateRecipeCommand` (DTO - request)
- `RecipeResponseDTO` (DTO - response)
- `APIErrorResponse` (DTO - error response)

**Props:** None (top-level form component)

---

### 4.3 CharacterCounter (React Component)

**Component Description:**
Displays current character count versus maximum allowed, with visual styling that changes based on usage threshold. Provides immediate feedback to help users stay within limits.

**Main Elements:**
- `<span>` container
- Text displaying: `{current} / {max}`
- Conditional CSS classes for warning/error states

**Visual States:**
1. **Normal** (0-89% of max): Default text color (e.g., `text-muted-foreground`)
2. **Warning** (90-99% of max): Warning color (e.g., `text-orange-600`)
3. **Exceeded** (100%+ of max): Error color (e.g., `text-destructive`)

**Handled Interactions:** None (display-only component)

**Validation Conditions:** None (receives calculated state)

**Types:**
- `CharacterCountInfo` (ViewModel)

**Props:**
```typescript
interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number; // Default: 0.9 (90%)
}
```

---

### 4.4 FormField Components (Shadcn/ui)

**Component Description:**
Wrapper components from Shadcn/ui that provide consistent styling and structure for form inputs. These include `Label`, `Input`, `Textarea`, and error message display.

**Components Used:**
- `FormField` - Wrapper for entire field
- `FormItem` - Container for field elements
- `FormLabel` - Accessible label
- `FormControl` - Input/Textarea wrapper
- `FormMessage` - Error message display

**Main Elements:**
- Label element with `htmlFor` matching input `id`
- Input or Textarea element
- Error message container (shown conditionally)
- Description text (optional)

**Handled Interactions:**
- Input change events (passed to parent)
- Blur events (passed to parent)

**Validation Conditions:**
Receives validation state from parent:
- `error` prop determines if error message is shown
- `aria-invalid` set on input when error exists

**Types:**
- Standard HTML input/textarea types
- Error messages as strings

**Props (for custom wrapper if not using Shadcn form components):**
```typescript
interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}
```

---

## 5. Types

### 5.1 Existing DTOs (from `src/types.ts`)

**CreateRecipeCommand:**
```typescript
type CreateRecipeCommand = Pick<
  RecipeEntity,
  "title" | "ingredients" | "instructions" | "is_ai_generated" | "parent_recipe_id"
> & {
  ai_metadata?: AIMetadataInput | null;
};
```

Used as the request body for `POST /api/recipes`. For this view:
- `title`: User input from title field
- `ingredients`: User input from ingredients textarea
- `instructions`: User input from instructions textarea
- `is_ai_generated`: Always `false` for manually created recipes
- `parent_recipe_id`: Always `null` for new recipes
- `ai_metadata`: Always `null` for manually created recipes

**RecipeResponseDTO:**
```typescript
type RecipeResponseDTO = RecipeWithAIMetadataDTO;

type RecipeWithAIMetadataDTO = RecipeEntity & {
  ai_metadata: RecipeAIMetadataEntity | null;
};
```

Response from successful recipe creation (201 status). Contains:
- All recipe fields including `id`, `owner_id`, `created_at`, `updated_at`
- `ai_metadata`: Will be `null` for manually created recipes

**APIErrorResponse:**
```typescript
interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}
```

Error response structure for validation errors (400) and server errors (500).

---

### 5.2 New ViewModel Types

**AddRecipeFormData:**
```typescript
interface AddRecipeFormData {
  title: string;
  ingredients: string;
  instructions: string;
}
```

Internal form state representing user input. All fields are strings to handle empty states and validation before submission.

**FormErrors:**
```typescript
interface FormErrors {
  title?: string;
  ingredients?: string;
  instructions?: string;
  combined?: string;
  general?: string;
}
```

Field breakdown:
- `title`: Error message for title field (e.g., "Title is required")
- `ingredients`: Error message for ingredients field
- `instructions`: Error message for instructions field
- `combined`: Error for combined content length validation
- `general`: Network errors or server errors that don't map to specific fields

**CharacterCountInfo:**
```typescript
interface CharacterCountInfo {
  current: number;
  max: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}
```

Field breakdown:
- `current`: Current character count
- `max`: Maximum allowed characters
- `percentage`: Current as percentage of max (0-100+)
- `isWarning`: True if >= 90% of max
- `isExceeded`: True if > 100% of max

---

## 6. State Management

### 6.1 State Architecture

State is managed within the `AddRecipeForm` component using React hooks. For better organization and reusability, state logic should be extracted into a custom hook: `useRecipeForm`.

### 6.2 Custom Hook: `useRecipeForm`

**Location:** `src/components/hooks/useRecipeForm.ts`

**Purpose:** Encapsulates all form logic including state management, validation, character counting, and API submission. This separation improves testability and keeps the component focused on rendering.

**Hook Interface:**
```typescript
interface UseRecipeFormReturn {
  // Form data
  formData: AddRecipeFormData;

  // Character counting
  titleCharCount: CharacterCountInfo;
  combinedCharCount: CharacterCountInfo;

  // Error state
  errors: FormErrors;

  // Loading state
  isSubmitting: boolean;

  // Actions
  handleFieldChange: (field: keyof AddRecipeFormData, value: string) => void;
  handleFieldBlur: (field: keyof AddRecipeFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

function useRecipeForm(): UseRecipeFormReturn;
```

**Internal State:**
```typescript
const [formData, setFormData] = useState<AddRecipeFormData>({
  title: '',
  ingredients: '',
  instructions: ''
});

const [errors, setErrors] = useState<FormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Computed State (via useMemo):**
```typescript
const titleCharCount = useMemo(() =>
  calculateCharCount(formData.title, 200),
  [formData.title]
);

const combinedCharCount = useMemo(() =>
  calculateCharCount(
    formData.ingredients + formData.instructions,
    10000
  ),
  [formData.ingredients, formData.instructions]
);
```

**Handler Functions:**

1. **handleFieldChange:**
   - Updates `formData` for the specified field
   - Clears field-specific error when user starts typing
   - Triggers character count recalculation automatically

2. **handleFieldBlur:**
   - Validates the specific field
   - Sets field-specific error if validation fails
   - Provides immediate feedback without waiting for submit

3. **handleSubmit:**
   - Prevents default form submission
   - Validates all fields
   - If valid: calls API, handles response
   - If invalid: sets errors and focuses first error field
   - Sets `isSubmitting` during API call

4. **resetForm:**
   - Clears all form data
   - Clears all errors
   - Useful after successful submission or for cancel action

### 6.3 Validation Logic

**Validation Usage in Hook:**
```typescript
const validateForm = (): boolean => {
  const result = addRecipeClientSchema.safeParse(formData);

  if (!result.success) {
    const newErrors: FormErrors = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] as keyof FormErrors;
      newErrors[field] = err.message;
    });
    setErrors(newErrors);
    return false;
  }

  setErrors({});
  return true;
};
```

---

## 7. API Integration

### 7.1 Endpoint Details

**Endpoint:** `POST /api/recipes`

**Request Type:** `CreateRecipeCommand`

**Response Type:** `RecipeResponseDTO` (success) or `APIErrorResponse` (error)

### 7.2 API Call Implementation

**Location:** Within `useRecipeForm` hook's `handleSubmit` function

**Request Construction:**
```typescript
const requestBody: CreateRecipeCommand = {
  title: formData.title.trim(),
  ingredients: formData.ingredients.trim(),
  instructions: formData.instructions.trim(),
  is_ai_generated: false,
  parent_recipe_id: null,
  ai_metadata: null
};
```

**API Call Flow:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Validate form
  if (!validateForm()) {
    // Focus first error field
    return;
  }

  // 2. Set loading state
  setIsSubmitting(true);

  try {
    // 3. Make API call
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // 4. Handle response
    if (response.ok) {
      const recipe: RecipeResponseDTO = await response.json();

      // 5. Success: navigate
      navigate(`/recipes/${recipe.id}`);
    } else {
      // 6. Error: parse and display
      const error: APIErrorResponse = await response.json();

      if (response.status === 400) {
        // Validation error from server
        handleServerValidationErrors(error);
      } else {
        // General server error
        setErrors({
          general: error.message || 'An error occurred while saving the recipe'
        });
      }
    }
  } catch (error) {
    // 7. Network error
    setErrors({
      general: 'Network error. Please check your connection and try again.'
    });
  } finally {
    // 8. Clear loading state
    setIsSubmitting(false);
  }
};
```

### 7.3 Error Response Handling

**Server Validation Errors (400):**
```typescript
const handleServerValidationErrors = (error: APIErrorResponse) => {
  const newErrors: FormErrors = {};

  if (error.details) {
    error.details.forEach((detail) => {
      // Try to map error to specific field
      if (detail.toLowerCase().includes('title')) {
        newErrors.title = detail;
      } else if (detail.toLowerCase().includes('ingredients')) {
        newErrors.ingredients = detail;
      } else if (detail.toLowerCase().includes('instructions')) {
        newErrors.instructions = detail;
      } else if (detail.toLowerCase().includes('combined')) {
        newErrors.combined = detail;
      } else {
        newErrors.general = detail;
      }
    });
  } else {
    newErrors.general = error.message;
  }

  setErrors(newErrors);
};
```

---

## 8. User Interactions

### 8.1 Input Interactions

**1. User types in Title field:**
- **Trigger:** `onChange` event on title input
- **Action:**
  - Update `formData.title` with new value
  - Clear `errors.title` if it exists
  - Character count automatically updates via `useMemo`
- **Visual Feedback:**
  - Title character counter updates: "X / 200"
  - Counter turns orange if >= 180 characters (warning)
  - Counter turns red if > 200 characters (exceeded)
  - Error message disappears if previously shown

**2. User types in Ingredients field:**
- **Trigger:** `onChange` event on ingredients textarea
- **Action:**
  - Update `formData.ingredients` with new value
  - Clear `errors.ingredients` if it exists
  - Combined character count automatically updates
- **Visual Feedback:**
  - Combined counter updates: "X / 10,000"
  - Counter styling changes based on threshold
  - Error message disappears if previously shown

**3. User types in Instructions field:**
- **Trigger:** `onChange` event on instructions textarea
- **Action:**
  - Update `formData.instructions` with new value
  - Clear `errors.instructions` if it exists
  - Combined character count automatically updates
- **Visual Feedback:**
  - Combined counter updates: "X / 10,000"
  - Counter styling changes based on threshold
  - Error message disappears if previously shown

**4. User leaves a field (blur):**
- **Trigger:** `onBlur` event on any input/textarea
- **Action:**
  - Run field-specific validation
  - Set `errors[field]` if validation fails
- **Visual Feedback:**
  - Error message appears below field (if invalid)
  - Field border turns red (via `aria-invalid`)
  - Error announced to screen readers (via `aria-live`)

### 8.2 Form Actions

**5. User clicks "Save Recipe" button:**
- **Trigger:** Form submit or button click
- **Action:**
  - Prevent default form submission
  - Run full form validation
  - If valid: submit to API
  - If invalid: display errors and focus first error
- **Visual Feedback:**
  - **During submission:**
    - Button shows loading spinner
    - Button text changes to "Saving..."
    - Button disabled
    - Form inputs disabled
  - **On success:**
    - Success toast: "Recipe saved successfully"
    - Navigate to recipe detail page
  - **On error:**
    - Error messages appear (inline or general)
    - Loading state cleared
    - Form remains editable for retry

**6. User clicks "Cancel" button:**
- **Trigger:** Button click
- **Action:**
  - If form has data: show confirmation dialog
  - If confirmed or form empty: navigate to `/recipes`
- **Visual Feedback:**
  - Confirmation dialog (if data exists):
    - Title: "Discard changes?"
    - Message: "You have unsaved changes. Are you sure you want to leave?"
    - Actions: "Stay" (default), "Discard"

### 8.3 Edge Case Interactions

**7. User pastes large text:**
- **Trigger:** Paste event in ingredients or instructions
- **Action:**
  - Text is pasted normally (no prevention)
  - Character counters update immediately
  - If exceeded: submit button becomes disabled
- **Visual Feedback:**
  - Character counter shows exceeded state (red)
  - Error message appears: "Combined ingredients and instructions must not exceed 10,000 characters"
  - Submit button disabled with tooltip

**8. User tries to submit with exceeded limit:**
- **Trigger:** Click submit with character limit exceeded
- **Action:**
  - Submit prevented (button should be disabled)
  - If somehow triggered: validation catches it
- **Visual Feedback:**
  - Submit button disabled (grayed out)
  - Tooltip on hover: "Character limit exceeded"

---

## 9. Conditions and Validation

### 9.1 Field-Level Validation Conditions

**Title Field:**

| Condition | Check | UI State | Error Message |
|-----------|-------|----------|---------------|
| Empty | `title.trim().length === 0` | Red border, error shown | "Title is required" |
| Too long | `title.length > 200` | Red border, error shown | "Title must not exceed 200 characters" |
| Valid | `1 <= title.trim().length <= 200` | Normal border, no error | None |
| Near limit | `title.length >= 180` | Orange counter | None (just warning) |

**Ingredients Field:**

| Condition | Check | UI State | Error Message |
|-----------|-------|----------|---------------|
| Empty | `ingredients.trim().length === 0` | Red border, error shown | "Ingredients are required" |
| Valid | `ingredients.trim().length > 0` | Normal border, no error | None |

**Instructions Field:**

| Condition | Check | UI State | Error Message |
|-----------|-------|----------|---------------|
| Empty | `instructions.trim().length === 0` | Red border, error shown | "Instructions are required" |
| Valid | `instructions.trim().length > 0` | Normal border, no error | None |

### 9.2 Form-Level Validation Conditions

**Combined Content Length:**

| Condition | Check | UI State | Error Message |
|-----------|-------|----------|---------------|
| Normal | `combined <= 9000` | Green/default counter | None |
| Warning | `9000 < combined <= 10000` | Orange counter | None (warning only) |
| Exceeded | `combined > 10000` | Red counter, submit disabled | "Combined ingredients and instructions must not exceed 10,000 characters" |

**Submit Button State:**

| Condition | Button State | Reason |
|-----------|-------------|---------|
| Any field empty | Disabled | Required fields missing |
| Combined length exceeded | Disabled | Validation will fail |
| Submitting | Disabled with spinner | Preventing double-submit |
| All valid | Enabled | Ready to submit |

### 9.3 Validation Timing

**Real-time Validation (onChange):**
- Character counting (immediate)
- Error clearing when user starts fixing (immediate)

**Deferred Validation (onBlur):**
- Field-specific validation
- Display of field errors

**Submit Validation:**
- Full form validation before API call
- All fields validated together
- Combined length checked

### 9.4 Interface State Affected by Conditions

**Submit Button:**
```typescript
const isSubmitDisabled =
  isSubmitting ||
  formData.title.trim().length === 0 ||
  formData.ingredients.trim().length === 0 ||
  formData.instructions.trim().length === 0 ||
  combinedCharCount.isExceeded;
```

**Field Visual State:**
```typescript
// Applied to each field
const fieldClassName = cn(
  "base-input-classes",
  errors[field] && "border-destructive",
  "focus-visible:ring-2"
);
```

**Character Counter Styling:**
```typescript
const counterClassName = cn(
  "text-sm",
  charCount.isExceeded && "text-destructive font-semibold",
  charCount.isWarning && !charCount.isExceeded && "text-orange-600",
  !charCount.isWarning && "text-muted-foreground"
);
```

---

## 10. Error Handling

### 10.1 Client-Side Validation Errors

**Scenario:** User submits form with invalid data

**Detection:**
- Triggered by submit handler
- Zod schema validation fails
- Returns validation errors

**Handling:**
1. Parse Zod errors and map to form fields
2. Set `errors` state with field-specific messages
3. Display error messages below each invalid field
4. Focus first field with error
5. Keep all form data intact

**UI Display:**
- Error text below field in red
- Field border turns red
- `aria-invalid="true"` on field
- `aria-describedby` links field to error message
- Error container uses `aria-live="polite"` for screen readers

**User Action:** User can immediately edit fields and see errors clear

---

### 10.2 Network Errors

**Scenario:** API call fails due to network issues (offline, timeout, connection error)

**Detection:**
- `fetch()` throws an error
- Caught in try-catch block

**Handling:**
1. Catch error in `handleSubmit`
2. Set `errors.general` with user-friendly message
3. Clear `isSubmitting` state
4. Keep all form data intact

**UI Display:**
- Error alert/banner at top of form
- Message: "Network error. Please check your connection and try again."
- Error is dismissible
- Submit button remains enabled for retry

**User Action:** User can retry submission after checking connection

---

### 10.3 Server Validation Errors (400)

**Scenario:** Server-side validation fails (should be rare since client validates first)

**Detection:**
- Response status 400
- Response body is `APIErrorResponse`

**Handling:**
1. Parse `error.details` array
2. Map errors to form fields if possible
3. Set `errors` state with mapped errors
4. Keep all form data intact

**UI Display:**
- Field-specific errors shown below fields (if mappable)
- General error shown at top if not mappable to specific field
- Same visual treatment as client-side errors

**User Action:** User can edit fields and resubmit

---

### 10.4 Server Errors (500)

**Scenario:** Unexpected server error during recipe creation

**Detection:**
- Response status 500
- Response body is `APIErrorResponse`

**Handling:**
1. Extract error message from response
2. Set `errors.general` with message
3. Log full error to console for debugging
4. Clear `isSubmitting` state
5. Keep all form data intact

**UI Display:**
- Error alert at top of form
- Message: "An unexpected error occurred while saving the recipe. Please try again."
- Error is dismissible
- Submit button remains enabled for retry

**User Action:** User can retry submission

---

### 10.5 Character Limit Exceeded

**Scenario:** User has entered content exceeding 10,000 character limit

**Detection:**
- Real-time via `combinedCharCount.isExceeded`
- Submit validation catches it if user bypasses disabled button

**Handling:**
1. Disable submit button
2. Display error message near combined counter
3. Highlight counter in red
4. Optionally: show tooltip on disabled button

**UI Display:**
- Combined character counter in red: "10,234 / 10,000"
- Error message: "Combined ingredients and instructions must not exceed 10,000 characters. Please shorten your recipe."
- Submit button disabled and grayed out
- Tooltip on hover: "Character limit exceeded"

**User Action:** User must edit content to reduce length before submitting

---

### 10.6 Form Data Loss Prevention

**Scenario:** User navigates away with unsaved data

**Detection:**
- `beforeunload` event listener
- Check if form has data: any field is non-empty

**Handling:**
```typescript
useEffect(() => {
  const hasData =
    formData.title.trim() ||
    formData.ingredients.trim() ||
    formData.instructions.trim();

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasData && !isSubmitting) {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [formData, isSubmitting]);
```

**UI Display:**
- Browser's native confirmation dialog
- Message: "You have unsaved changes. Are you sure you want to leave?"

**User Action:** User can choose to stay or leave

---

### 10.7 Error Accessibility

**ARIA Attributes:**
- `aria-invalid="true"` on fields with errors
- `aria-describedby` linking fields to error messages
- `aria-live="polite"` on error containers for dynamic announcements
- Unique IDs on error messages for proper linking

**Focus Management:**
- Focus first field with error on validation failure
- Use `useRef` to store field refs
- Call `firstErrorField.focus()` after setting errors

**Example Implementation:**
```typescript
const titleRef = useRef<HTMLInputElement>(null);
const ingredientsRef = useRef<HTMLTextAreaElement>(null);
const instructionsRef = useRef<HTMLTextAreaElement>(null);

const focusFirstError = (errors: FormErrors) => {
  if (errors.title) {
    titleRef.current?.focus();
  } else if (errors.ingredients) {
    ingredientsRef.current?.focus();
  } else if (errors.instructions) {
    instructionsRef.current?.focus();
  }
};
```

---

## 11. Implementation Steps

### Step 1: Create Custom Hook for Form Logic

**File:** `src/components/hooks/useRecipeForm.ts`

**Tasks:**
1. Define interfaces: `AddRecipeFormData`, `FormErrors`, `CharacterCountInfo`
2. Implement state management with `useState`:
   - `formData`
   - `errors`
   - `isSubmitting`
3. Implement computed values with `useMemo`:
   - `titleCharCount`
   - `combinedCharCount`
4. Implement helper function `calculateCharCount`
5. Implement `handleFieldChange` function
6. Implement `handleFieldBlur` function with field validation
7. Implement `validateForm` function using Zod schema
8. Implement `handleSubmit` function with API call
9. Implement `resetForm` function
10. Return hook interface

**Acceptance Criteria:**
- Hook manages all form state
- Character counting updates in real-time
- Validation works on blur and submit
- API call handles success and all error types
- Form data preserved on errors

---

### Step 2: Create Character Counter Component

**File:** `src/components/recipes/CharacterCounter.tsx`

**Tasks:**
1. Define component props interface
2. Calculate percentage and warning states
3. Apply conditional CSS classes based on state
4. Render counter text: "{current} / {max}"

**Acceptance Criteria:**
- Component displays current/max format
- Color changes at warning threshold (90%)
- Color changes to error when exceeded (100%+)
- Uses Tailwind classes for styling

---

### Step 3: Create Client-Side Validation Schema

**File:** `src/lib/schemas/recipe.schema.ts` (add to existing file)

**Tasks:**
1. Import Zod
2. Create `addRecipeClientSchema` with field validations
3. Add refine for combined length validation
4. Export schema

**Acceptance Criteria:**
- Schema matches API validation rules
- All error messages are user-friendly
- Combined length validation works correctly

---

### Step 4: Create Add Recipe Form Component

**File:** `src/components/recipes/AddRecipeForm.tsx`

**Tasks:**
1. Import necessary components (Shadcn/ui Form components, Button, etc.)
2. Import custom hook: `useRecipeForm`
3. Import CharacterCounter component
4. Call `useRecipeForm` hook to get state and handlers
5. Create form structure with proper HTML semantics
6. Implement title field with:
   - Label
   - Input
   - Character counter
   - Error message
7. Implement ingredients field with:
   - Label
   - Textarea (multiline)
   - Error message (individual)
8. Implement instructions field with:
   - Label
   - Textarea (multiline)
   - Error message (individual)
9. Add combined character counter after instructions
10. Add general error display area at top
11. Add form action buttons:
    - Cancel button (secondary)
    - Save button (primary) with loading state
12. Wire up all event handlers from hook
13. Add refs for focus management
14. Implement form submission handler
15. Add loading overlay/spinner

**Acceptance Criteria:**
- Form renders all fields correctly
- Character counters display and update
- Validation errors display properly
- Submit button shows loading state
- Success navigates to recipe detail
- Errors display and preserve form data
- Accessible markup with proper ARIA attributes

---

### Step 5: Create Astro Page

**File:** `src/pages/recipes/new.astro`

**Tasks:**
1. Import Layout component
2. Import AddRecipeForm component
3. Add authentication check (if required)
4. Render Layout with proper title
5. Render AddRecipeForm with `client:load` directive
6. Add appropriate container styling

**Acceptance Criteria:**
- Page accessible at `/recipes/new`
- Form loads and hydrates correctly
- Page title set appropriately
- Layout styling applied

---

### Step 6: Add Navigation Link

**File:** Update navigation component (e.g., `src/components/Navigation.astro`)

**Tasks:**
1. Add "New Recipe" or "Add Recipe" link
2. Link to `/recipes/new`
3. Use appropriate icon (e.g., plus icon)
4. Apply active state styling

**Acceptance Criteria:**
- Link visible in main navigation
- Link navigates to new recipe page
- Active state shown when on page

---

### Step 7: Implement Success Toast Notification

**File:** Add toast utility or use existing toast library

**Tasks:**
1. Install/configure toast library (e.g., sonner, react-hot-toast)
2. Add ToastProvider to layout if needed
3. Create success toast helper function
4. Call from `useRecipeForm` on successful submission

**Acceptance Criteria:**
- Toast appears on successful save
- Toast displays "Recipe saved successfully"
- Toast auto-dismisses after 3-5 seconds
- Toast is accessible (aria-live)

---

### Step 8: Add Data Loss Prevention

**File:** `src/components/hooks/useRecipeForm.ts` (update)

**Tasks:**
1. Add `useEffect` for `beforeunload` event
2. Check if form has unsaved data
3. Add event listener with prevention logic
4. Clean up listener on unmount

**Acceptance Criteria:**
- Warning shown when navigating away with unsaved data
- Warning not shown for empty form
- Warning not shown after successful save
- Works across all navigation methods

---

### Step 9: Implement Cancel Confirmation Dialog

**File:** `src/components/recipes/AddRecipeForm.tsx` (update)

**Tasks:**
1. Add state for dialog visibility
2. Create cancel handler that checks for unsaved data
3. Show confirmation dialog if data exists
4. Navigate to `/recipes` on confirmation
5. Use Shadcn/ui AlertDialog component

**Acceptance Criteria:**
- Cancel button shows dialog if form has data
- Dialog has clear message and actions
- "Stay" button closes dialog
- "Discard" button navigates away
- Direct navigation if form is empty

---

### Step 10: Add Accessibility Enhancements

**File:** `src/components/recipes/AddRecipeForm.tsx` (update)

**Tasks:**
1. Add unique IDs to all form fields
2. Link labels to inputs via `htmlFor`
3. Add `aria-invalid` to fields with errors
4. Add `aria-describedby` linking fields to error messages
5. Add `aria-live="polite"` to error containers
6. Implement focus management on validation errors
7. Add `aria-required` to required fields
8. Test with screen reader

**Acceptance Criteria:**
- All fields have proper labels
- Errors announced to screen readers
- Focus moves to first error on validation failure
- Keyboard navigation works throughout form
- Screen reader testing passes

---

### Step 11: Style and Polish

**Tasks:**
1. Apply responsive design (mobile-first)
2. Ensure proper spacing between elements
3. Style character counters with proper colors
4. Style loading states
5. Add transitions for error appearances
6. Test on multiple screen sizes
7. Ensure dark mode support (if applicable)
8. Add loading spinner with proper animation

**Acceptance Criteria:**
- Form works well on mobile, tablet, desktop
- Visual hierarchy is clear
- Loading states are obvious
- Animations are smooth
- Dark mode works (if supported)
- Follows design system

---

## Summary

This implementation plan provides a comprehensive guide for building the Add Recipe view. The key focus areas are:

1. **User Experience:** Real-time feedback, clear error messages, data preservation
2. **Validation:** Client-side validation matching API rules, preventing invalid submissions
3. **Error Handling:** Graceful handling of all error scenarios with retry capability
4. **Accessibility:** ARIA attributes, keyboard navigation, screen reader support
5. **Code Quality:** Separation of concerns with custom hook, reusable components, proper typing

The implementation follows React best practices, uses TypeScript for type safety, and integrates seamlessly with the existing Astro + React architecture. The form is designed to be maintainable, testable, and extensible for future enhancements.
