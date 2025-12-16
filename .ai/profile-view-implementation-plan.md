# View Implementation Plan: Profile & Dietary Preferences

## 1. Overview

The Profile & Dietary Preferences view allows authenticated users to view their account information (email) and manage their dietary preferences. Users can view their current preferences in read-only mode and toggle to edit mode to update their diet type, allergies, and disliked ingredients. The view implements inline editing with clear visual feedback, accessibility features, and robust error handling.

**Key Features:**
- Display user email (read-only)
- View dietary preferences (read-only by default)
- Inline editing of dietary preferences
- Tag-based input for allergies and disliked ingredients
- Responsive layout (single column on mobile, two columns on desktop)
- Full keyboard accessibility
- Screen reader support with ARIA live regions
- Loading states and error handling

## 2. View Routing

**Path:** `/profile`

**Access Control:**
- Requires authentication (enforce via Astro middleware or page-level check)
- Redirect to login page if user is not authenticated

## 3. Component Structure

```
src/pages/profile.astro (Astro SSR Page)
└── ProfileView (React Component)
    ├── AccountSection (React Component)
    │   └── Shadcn Button (Logout)
    └── DietaryPreferencesSection (React Component)
        ├── ReadOnlyView
        │   ├── Display current preferences
        │   └── Edit Button
        └── EditMode
            ├── DietTypeSelect (React Component)
            │   └── Shadcn Select
            ├── TagInput (React Component) [Allergies]
            │   ├── Shadcn Input
            │   └── Shadcn Badge (for each tag)
            ├── TagInput (React Component) [Disliked Ingredients]
            │   ├── Shadcn Input
            │   └── Shadcn Badge (for each tag)
            └── Action Buttons (Save/Cancel)
                └── Shadcn Button
```

## 4. Component Details

### ProfilePage (Astro Page Component)
**File:** `src/pages/profile.astro`

- **Purpose:** Server-side page component that handles authentication, fetches initial dietary preferences data, and renders the ProfileView React component.

- **Main Elements:**
  - Layout wrapper
  - ProfileView React component
  - Error boundary for API failures

- **Server-Side Logic:**
  - Fetch dietary preferences via GET /api/profile/dietary-preferences
  - Handle 404 (no preferences) by passing null
  - Pass user email and preferences to ProfileView

- **Types:**
  - `DietaryPreferencesDTO | null`
  - `APIErrorResponse`

- **Props:** None (Astro page component)

---

### ProfileView (React Component)
**File:** `src/components/profile/ProfileView.tsx`

- **Purpose:** Main client-side container component that orchestrates the profile view layout and manages the relationship between AccountSection and DietaryPreferencesSection.

- **Main Elements:**
  - Container div with responsive grid layout
  - AccountSection component
  - DietaryPreferencesSection component

- **Handled Interactions:** None (delegates to children)

- **Validation:** None (delegates to children)

- **Types:**
  - `ProfileViewProps`
  - `DietaryPreferencesDTO`

- **Props:**
  ```typescript
  interface ProfileViewProps {
    initialPreferences: DietaryPreferencesDTO | null;
    userEmail: string;
  }
  ```

---

### AccountSection (React Component)
**File:** `src/components/profile/AccountSection.tsx`

- **Purpose:** Displays user account information (email) and provides logout functionality.

- **Main Elements:**
  - Card container (Shadcn Card)
  - CardHeader with title "Account"
  - CardContent with email display
  - Logout button (Shadcn Button)

- **Handled Interactions:**
  - Logout button click

- **Validation:** None

- **Types:**
  - `AccountSectionProps`

- **Props:**
  ```typescript
  interface AccountSectionProps {
    userEmail: string;
  }
  ```

---

### DietaryPreferencesSection (React Component)
**File:** `src/components/profile/DietaryPreferencesSection.tsx`

- **Purpose:** Manages the display and editing of dietary preferences. Handles the toggle between read-only and edit modes, form state management, and API calls for updating preferences.

- **Main Elements:**
  - Card container (Shadcn Card)
  - CardHeader with title "Dietary Preferences" and Edit button (read-only mode)
  - CardContent with:
    - **Read-only mode:** Display current preferences
    - **Edit mode:** Form with DietTypeSelect, TagInput components, and Save/Cancel buttons
  - Toast notifications (Shadcn Sonner)
  - Error message display
  - Loading spinner during save

- **Handled Interactions:**
  - Edit button click (enter edit mode)
  - Cancel button click (exit edit mode, discard changes)
  - Save button click (validate and submit to API)
  - Form field changes (update form state)

- **Validation:**
  - At least one field must be changed to enable save
  - Diet type must be valid enum value or null
  - Allergies must be array of non-empty strings
  - Disliked ingredients must be array of non-empty strings

- **Types:**
  - `DietaryPreferencesSectionProps`
  - `DietaryPreferencesDTO`
  - `UpdateDietaryPreferencesCommand`
  - `APIErrorResponse`

- **Props:**
  ```typescript
  interface DietaryPreferencesSectionProps {
    preferences: DietaryPreferencesDTO | null;
    onPreferencesUpdated: (preferences: DietaryPreferencesDTO) => void;
  }
  ```

---

### DietTypeSelect (React Component)
**File:** `src/components/profile/DietTypeSelect.tsx`

- **Purpose:** Dropdown component for selecting diet type from allowed values.

- **Main Elements:**
  - Label element
  - Shadcn Select component
  - SelectTrigger
  - SelectContent with SelectItem for each diet type
  - "Not specified" option for null value

- **Handled Interactions:**
  - Select value change

- **Validation:**
  - Value must be one of: "omnivore", "vegetarian", "vegan", "pescatarian", "keto", "paleo", "low_carb", "low_fat", "mediterranean", "other", or null

- **Types:**
  - `DietTypeSelectProps`
  - `DietType`

- **Props:**
  ```typescript
  interface DietTypeSelectProps {
    value: DietType | null;
    onChange: (value: DietType | null) => void;
    disabled?: boolean;
    id: string;
  }
  ```

---

### TagInput (React Component)
**File:** `src/components/profile/TagInput.tsx`

- **Purpose:** Reusable component for managing a list of string tags (used for allergies and disliked ingredients). Supports keyboard navigation and accessibility features.

- **Main Elements:**
  - Label element
  - Container div with existing tags (Shadcn Badge components with X button)
  - Input field (Shadcn Input)
  - ARIA live region for screen reader announcements

- **Handled Interactions:**
  - Enter key press: Add new tag
  - Backspace key press on empty input: Remove last tag
  - Click X button on tag: Remove specific tag
  - Input blur: Clear input if not empty (optional behavior)

- **Validation:**
  - Trim whitespace from input
  - Prevent adding empty strings
  - Prevent adding duplicate tags (case-insensitive comparison)
  - Maximum tag length: 50 characters (reasonable limit)

- **Types:**
  - `TagInputProps`

- **Props:**
  ```typescript
  interface TagInputProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    id: string;
    ariaDescribedBy?: string;
  }
  ```

---

### Custom Hook: useDietaryPreferences
**File:** `src/components/hooks/useDietaryPreferences.ts`

- **Purpose:** Custom React hook that encapsulates the logic for managing dietary preferences state, edit mode, form state, API calls, and error handling.

- **State Management:**
  - `preferences`: Current saved preferences from server
  - `formState`: Edited preferences in edit mode
  - `isEditing`: Boolean flag for edit mode
  - `isSaving`: Boolean flag for save operation
  - `error`: Error message string or null

- **Methods:**
  - `startEditing()`: Switch to edit mode, copy preferences to formState
  - `cancelEditing()`: Exit edit mode, discard changes
  - `updateFormField(field, value)`: Update a specific form field
  - `savePreferences()`: Validate and submit to API
  - `resetError()`: Clear error message

- **Return Value:**
  ```typescript
  {
    preferences: DietaryPreferencesDTO | null;
    formState: DietaryPreferencesFormState;
    isEditing: boolean;
    isSaving: boolean;
    error: string | null;
    hasChanges: boolean;
    startEditing: () => void;
    cancelEditing: () => void;
    updateFormField: (field: keyof DietaryPreferencesFormState, value: any) => void;
    savePreferences: () => Promise<void>;
    resetError: () => void;
  }
  ```

## 5. Types

### Existing Types (from `src/types.ts`)

```typescript
// Response from GET /api/profile/dietary-preferences
export type DietaryPreferencesDTO = DietaryPreferencesEntity;

// Request for PUT /api/profile/dietary-preferences
export type UpdateDietaryPreferencesCommand = Pick<
  DietaryPreferencesEntity,
  "diet_type" | "allergies" | "disliked_ingredients"
>;

// Allowed diet type values
export type DietType = Database["public"]["Enums"]["diet_type"];
// Values: "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "low_carb" | "low_fat" | "mediterranean" | "other"

// Standard error response
export interface APIErrorResponse {
  error: string;
  message: string;
  details?: string[];
}
```

### New Types to Add (in `src/types.ts`)

```typescript
// ============================================================================
// PROFILE VIEW TYPES
// ============================================================================

/**
 * Props for ProfileView component
 * Contains initial data fetched server-side
 */
export interface ProfileViewProps {
  initialPreferences: DietaryPreferencesDTO | null;
  userEmail: string;
}

/**
 * Props for AccountSection component
 */
export interface AccountSectionProps {
  userEmail: string;
}

/**
 * Props for DietaryPreferencesSection component
 */
export interface DietaryPreferencesSectionProps {
  preferences: DietaryPreferencesDTO | null;
  onPreferencesUpdated: (preferences: DietaryPreferencesDTO) => void;
}

/**
 * Props for DietTypeSelect component
 */
export interface DietTypeSelectProps {
  value: DietType | null;
  onChange: (value: DietType | null) => void;
  disabled?: boolean;
  id: string;
}

/**
 * Props for TagInput component
 */
export interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id: string;
  ariaDescribedBy?: string;
}

/**
 * Form state for dietary preferences editing
 */
export interface DietaryPreferencesFormState {
  diet_type: DietType | null;
  allergies: string[];
  disliked_ingredients: string[];
}

/**
 * Return type for useDietaryPreferences hook
 */
export interface UseDietaryPreferencesReturn {
  preferences: DietaryPreferencesDTO | null;
  formState: DietaryPreferencesFormState;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  updateFormField: (field: keyof DietaryPreferencesFormState, value: any) => void;
  savePreferences: () => Promise<void>;
  resetError: () => void;
}
```

## 6. State Management

### State Architecture

The Profile view uses a **component-local state** approach with a custom hook for encapsulating complex logic.

### State Flow

1. **Initial Data Loading (SSR):**
   - Astro page fetches data server-side via GET /api/profile/dietary-preferences
   - Data passed as props to ProfileView React component

2. **Client-Side State Management:**
   - `DietaryPreferencesSection` uses `useDietaryPreferences` custom hook
   - Hook manages three state layers:
     - **Server state:** `preferences` (source of truth from API)
     - **Form state:** `formState` (edited values in edit mode)
     - **UI state:** `isEditing`, `isSaving`, `error`

3. **State Transitions:**
   - **Read-only → Edit mode:** Copy `preferences` to `formState`
   - **Edit mode → Read-only (cancel):** Discard `formState`, revert to `preferences`
   - **Edit mode → Read-only (save success):** Update `preferences` with API response, discard `formState`
   - **Save failure:** Keep `formState` and `isEditing` true, show error

### Custom Hook: useDietaryPreferences

**Purpose:** Centralize all dietary preferences logic, making the component cleaner and the logic testable.

**State Variables:**
```typescript
const [preferences, setPreferences] = useState<DietaryPreferencesDTO | null>(initialPreferences);
const [formState, setFormState] = useState<DietaryPreferencesFormState>(initialFormState);
const [isEditing, setIsEditing] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Computed Values:**
```typescript
// Check if form has changes compared to saved preferences
const hasChanges = useMemo(() => {
  if (!preferences) return true; // New preferences, always allow save
  return (
    formState.diet_type !== preferences.diet_type ||
    JSON.stringify(formState.allergies) !== JSON.stringify(preferences.allergies) ||
    JSON.stringify(formState.disliked_ingredients) !== JSON.stringify(preferences.disliked_ingredients)
  );
}, [formState, preferences]);
```

**Methods:**

1. **startEditing()**
   - Set `isEditing` to true
   - Initialize `formState` with current `preferences` values (or defaults if null)

2. **cancelEditing()**
   - Set `isEditing` to false
   - Clear `formState`
   - Clear `error`

3. **updateFormField(field, value)**
   - Update specific field in `formState`

4. **savePreferences()**
   - Validate form (at least one change)
   - Set `isSaving` to true
   - Build request body (only include changed fields)
   - Call PUT /api/profile/dietary-preferences
   - On success:
     - Update `preferences` with response
     - Set `isEditing` to false
     - Show success toast
   - On failure:
     - Set `error` message
     - Keep `isEditing` true
   - Finally: Set `isSaving` to false

5. **resetError()**
   - Clear `error` message

## 7. API Integration

### Endpoint: GET /api/profile/dietary-preferences

**When:** Page load (server-side in Astro component)

**Request:**
- Method: GET
- Headers: None (session cookie handled by middleware)
- Body: None

**Response Types:**
- **Success (200):** `DietaryPreferencesDTO`
  ```typescript
  {
    user_id: string;
    diet_type: DietType | null;
    allergies: string[];
    disliked_ingredients: string[];
    created_at: string;
    updated_at: string;
  }
  ```

- **Not Found (404):** `APIErrorResponse` - Treat as no preferences set, pass null to component

- **Unauthorized (401):** Redirect to login page

- **Server Error (500):** `APIErrorResponse` - Show error page

**Implementation in Astro:**
```typescript
// In profile.astro
const response = await fetch(`${Astro.url.origin}/api/profile/dietary-preferences`, {
  headers: {
    Cookie: Astro.request.headers.get('Cookie') || ''
  }
});

if (!response.ok) {
  if (response.status === 401) {
    return Astro.redirect('/login');
  }
  if (response.status === 404) {
    // No preferences set yet, pass null
    preferences = null;
  } else {
    // Show error page
    throw new Error('Failed to load preferences');
  }
} else {
  preferences = await response.json();
}
```

---

### Endpoint: PUT /api/profile/dietary-preferences

**When:** User clicks Save button in edit mode

**Request:**
- Method: PUT
- Headers:
  - `Content-Type: application/json`
  - Session cookie (automatic)
- Body: `UpdateDietaryPreferencesCommand`
  ```typescript
  {
    diet_type?: DietType | null;
    allergies?: string[];
    disliked_ingredients?: string[];
  }
  ```

**Response Types:**
- **Success (200):** `DietaryPreferencesDTO`

- **Bad Request (400):** `APIErrorResponse`
  ```typescript
  {
    error: "Bad Request";
    message: string;
    details?: string[]; // Validation error details
  }
  ```

- **Unauthorized (401):** `APIErrorResponse` - Redirect to login

- **Not Found (404):** `APIErrorResponse` - Should not happen, show error

- **Server Error (500):** `APIErrorResponse` - Show error message

**Implementation in useDietaryPreferences:**
```typescript
const savePreferences = async () => {
  setIsSaving(true);
  setError(null);

  try {
    // Build request body with only changed fields
    const requestBody: Partial<UpdateDietaryPreferencesCommand> = {};

    if (formState.diet_type !== preferences?.diet_type) {
      requestBody.diet_type = formState.diet_type;
    }
    if (JSON.stringify(formState.allergies) !== JSON.stringify(preferences?.allergies || [])) {
      requestBody.allergies = formState.allergies;
    }
    if (JSON.stringify(formState.disliked_ingredients) !== JSON.stringify(preferences?.disliked_ingredients || [])) {
      requestBody.disliked_ingredients = formState.disliked_ingredients;
    }

    const response = await fetch('/api/profile/dietary-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const errorData: APIErrorResponse = await response.json();
      throw new Error(errorData.message || 'Failed to update preferences');
    }

    const updatedPreferences: DietaryPreferencesDTO = await response.json();
    setPreferences(updatedPreferences);
    setIsEditing(false);

    // Show success toast
    toast.success('Preferences updated successfully');

  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unexpected error occurred');
  } finally {
    setIsSaving(false);
  }
};
```

## 8. User Interactions

### 1. View Profile Page
**Trigger:** User navigates to `/profile`

**Flow:**
1. User clicks "Profile" link in navigation
2. Browser navigates to `/profile`
3. Astro page checks authentication
4. If authenticated: Fetch preferences, render ProfileView
5. If not authenticated: Redirect to `/login`

**Outcome:** User sees profile page with email and dietary preferences

---

### 2. Enter Edit Mode
**Trigger:** User clicks "Edit" button

**Flow:**
1. User clicks "Edit" button in Dietary Preferences section
2. Component calls `startEditing()` from hook
3. Current preferences copied to form state
4. UI switches to edit mode:
   - Edit button hidden
   - Form fields enabled (DietTypeSelect, TagInputs)
   - Save and Cancel buttons shown

**Outcome:** User can now edit dietary preferences

---

### 3. Change Diet Type
**Trigger:** User selects value from dropdown

**Flow:**
1. User clicks DietTypeSelect dropdown
2. Dropdown opens showing all allowed values + "Not specified"
3. User selects a value
4. Component calls `updateFormField('diet_type', selectedValue)`
5. Form state updated
6. Dropdown closes and displays selected value

**Outcome:** Diet type updated in form state

---

### 4. Add Allergy Tag
**Trigger:** User types in allergies input and presses Enter

**Flow:**
1. User types allergy name (e.g., "gluten")
2. User presses Enter key
3. TagInput component:
   - Trims whitespace from input
   - Validates: not empty, not duplicate (case-insensitive)
   - If valid: Adds to array, calls `onChange` with new array
   - Clears input field
   - Announces "Added gluten" via aria-live region
4. New badge appears in tag list

**Outcome:** Allergy tag added to list

---

### 5. Remove Allergy Tag
**Trigger:** User clicks X on tag OR presses Backspace on empty input

**Flow:**
1. **Via X button:**
   - User clicks X button on badge
   - Component removes tag from array
   - Calls `onChange` with updated array
   - Announces "Removed gluten" via aria-live region

2. **Via Backspace:**
   - User focuses input field (empty)
   - User presses Backspace
   - Component removes last tag from array
   - Calls `onChange` with updated array
   - Announces "Removed gluten" via aria-live region

**Outcome:** Allergy tag removed from list

---

### 6. Add Disliked Ingredient Tag
**Trigger:** User types in disliked ingredients input and presses Enter

**Flow:** Same as "Add Allergy Tag" but for disliked_ingredients field

**Outcome:** Disliked ingredient tag added to list

---

### 7. Remove Disliked Ingredient Tag
**Trigger:** User clicks X on tag OR presses Backspace on empty input

**Flow:** Same as "Remove Allergy Tag" but for disliked_ingredients field

**Outcome:** Disliked ingredient tag removed from list

---

### 8. Save Changes
**Trigger:** User clicks "Save" button

**Flow:**
1. User clicks "Save" button
2. Component calls `savePreferences()` from hook
3. UI updates:
   - Save button disabled, shows spinner
   - Form fields disabled
4. API request sent to PUT /api/profile/dietary-preferences
5. **On success:**
   - Preferences state updated with API response
   - Edit mode exited
   - Success toast shown: "Preferences updated"
   - Form fields hidden, read-only view shown
6. **On failure:**
   - Error message displayed above form
   - Edit mode remains active
   - Form fields re-enabled
   - Save button re-enabled

**Outcome:** Preferences saved to database OR error shown

---

### 9. Cancel Edit
**Trigger:** User clicks "Cancel" button

**Flow:**
1. User clicks "Cancel" button
2. Component calls `cancelEditing()` from hook
3. Form state discarded
4. Edit mode exited
5. UI switches to read-only view with original preferences

**Outcome:** Changes discarded, returns to read-only mode

---

### 10. Logout
**Trigger:** User clicks "Logout" button

**Flow:**
1. User clicks "Logout" button in Account section
2. Component uses useLogout hook - it's already there

**Outcome:** User logged out and redirected

## 9. Conditions and Validation

### 1. At Least One Field Must Be Changed

**Condition:** PUT endpoint requires at least one field to be provided in the request

**Affected Components:** DietaryPreferencesSection, Save button

**Validation:**
- Compare current form state with saved preferences
- Enable Save button only if `hasChanges` is true
- If no changes: Show tooltip or disable button with explanation

**UI State:**
```typescript
const hasChanges = useMemo(() => {
  if (!preferences) return true; // New preferences
  return (
    formState.diet_type !== preferences.diet_type ||
    JSON.stringify(formState.allergies) !== JSON.stringify(preferences.allergies) ||
    JSON.stringify(formState.disliked_ingredients) !== JSON.stringify(preferences.disliked_ingredients)
  );
}, [formState, preferences]);

// In render:
<Button disabled={!hasChanges || isSaving}>Save</Button>
```

---

### 2. Diet Type Must Be Valid Enum or Null

**Condition:** diet_type must be one of: "omnivore", "vegetarian", "vegan", "pescatarian", "keto", "paleo", "low_carb", "low_fat", "mediterranean", "other", or null

**Affected Components:** DietTypeSelect

**Validation:**
- Dropdown only shows valid options
- Backend validates enum
- Frontend validation not strictly necessary (dropdown ensures valid value)

**UI State:**
```typescript
const dietTypeOptions: Array<{ value: DietType | null; label: string }> = [
  { value: null, label: 'Not specified' },
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'low_fat', label: 'Low Fat' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'other', label: 'Other' }
];
```

---

### 3. Allergies Must Be Non-Empty String Array

**Condition:** allergies must be an array of strings, can be empty array, but individual strings cannot be empty

**Affected Components:** TagInput (allergies instance)

**Validation:**
- Trim whitespace before adding tag
- Reject empty strings
- Prevent duplicate tags (case-insensitive)
- Optional: Maximum length per tag (50 characters)

**UI State:**
```typescript
const addTag = (input: string) => {
  const trimmed = input.trim();

  // Validate
  if (trimmed === '') return; // Empty
  if (trimmed.length > 50) {
    // Show error: "Tag too long"
    return;
  }
  if (value.some(tag => tag.toLowerCase() === trimmed.toLowerCase())) {
    // Show warning: "Already added"
    return;
  }

  // Add tag
  onChange([...value, trimmed]);
};
```

---

### 4. Disliked Ingredients Must Be Non-Empty String Array

**Condition:** disliked_ingredients must be an array of strings, can be empty array, but individual strings cannot be empty

**Affected Components:** TagInput (disliked ingredients instance)

**Validation:** Same as allergies validation (see above)

---

### 5. Network and Server Error Handling

**Condition:** API calls may fail due to network issues or server errors

**Affected Components:** DietaryPreferencesSection

**Validation:**
- Catch all API errors
- Display user-friendly error messages
- Allow retry
- Handle specific error codes:
  - 400: Show validation details
  - 401: Redirect to login
  - 404: Show "Preferences not found" error
  - 500: Show generic error message

**UI State:**
```typescript
{error && (
  <Alert variant="destructive" className="mb-4">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## 10. Error Handling

### Error Categories and Handling Strategies

#### 1. Authentication Errors (401)

**Scenarios:**
- GET fails with 401 on page load
- PUT fails with 401 during save

**Handling:**
- **On page load:** Redirect to `/login` (Astro server-side)
- **During save:** Show error message, redirect to login after 2 seconds
- Clear any in-progress edits

**User Message:** "Your session has expired. Redirecting to login..."

---

#### 2. Not Found Errors (404)

**Scenarios:**
- GET returns 404 (no preferences set yet)
- PUT returns 404 (should not happen)

**Handling:**
- **GET 404:** Treat as normal case, pass `null` to component
- **PUT 404:** Show error message, log error for debugging

**User Message (PUT 404):** "Preferences not found. Please refresh the page and try again."

---

#### 3. Validation Errors (400)

**Scenarios:**
- PUT returns 400 with validation details
- Invalid diet_type
- Invalid array format
- No fields provided

**Handling:**
- Display error message from API response
- Show validation details if available
- Keep edit mode active
- Allow user to correct and retry

**User Message:**
```typescript
// From API response
{
  error: "Bad Request",
  message: "Invalid input data",
  details: [
    "diet_type must be one of: omnivore, vegetarian, vegan, ..."
  ]
}

// Display as:
"Invalid input data: diet_type must be one of: omnivore, vegetarian, vegan, ..."
```

---

#### 4. Network Errors

**Scenarios:**
- Network connection lost during API call
- Request timeout
- CORS issues

**Handling:**
- Catch network errors in try-catch
- Show generic error message with retry option
- Keep edit mode active
- Preserve form state

**User Message:** "Network error. Please check your connection and try again."

---

#### 5. Server Errors (500)

**Scenarios:**
- Database connection issues
- Unexpected server errors
- RLS policy violations (shouldn't happen with correct auth)

**Handling:**
- Display generic error message (don't expose technical details)
- Log full error details for debugging
- Keep edit mode active
- Allow retry

**User Message:** "An unexpected error occurred. Please try again later."

---

#### 6. Client-Side Validation Errors

**Scenarios:**
- Empty tag input submitted
- Duplicate tag added
- Tag too long (>50 characters)

**Handling:**
- Prevent invalid input (don't add to array)
- Show subtle feedback (e.g., input border flash red)
- Optional: Show tooltip with reason
- No need for modal or intrusive error

**User Message:**
- Empty: (no message, just ignore)
- Duplicate: "This item has already been added"
- Too long: "Maximum 50 characters"

---

### Error Display Patterns

**Location:** Display errors where they occur:
- API errors: Above form in Alert component
- Tag input errors: Below input field or as tooltip
- Save button errors: Above form

**Components:**
- Use Shadcn Alert component for API errors
- Use inline error text for field-level errors
- Use Toast for success confirmations

**Accessibility:**
- Use `role="alert"` for error messages
- Set `aria-describedby` to link form fields with error messages
- Announce errors via aria-live regions

**Example:**
```typescript
{error && (
  <Alert variant="destructive" className="mb-4" role="alert">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## 11. Implementation Steps

### Step 1: Add New Types to `src/types.ts`

1. Open `src/types.ts`
2. Add all types defined in Section 5 under a new comment block "PROFILE VIEW TYPES"
3. Ensure all types are exported
4. Verify no naming conflicts with existing types

**Estimated Time:** 15 minutes

---

### Step 2: Install Required Shadcn Components

1. Verify existing components in `src/components/ui/`:
   - Button
   - Card (CardHeader, CardTitle, CardContent)
   - Select (SelectTrigger, SelectContent, SelectItem)
   - Input
   - Badge
   - Alert (AlertTitle, AlertDescription)

2. If any are missing, install via CLI:
   ```bash
   npx shadcn@latest add [component-name]
   ```

3. Install Sonner for toast notifications:
   ```bash
   npx shadcn@latest add sonner
   ```

**Estimated Time:** 10 minutes

---

### Step 3: Create TagInput Component

**File:** `src/components/profile/TagInput.tsx`

1. Create new file and import dependencies (React, Shadcn components)
2. Define component with props interface
3. Implement state for input value
4. Implement addTag handler with validation:
   - Trim whitespace
   - Check for empty string
   - Check for duplicates (case-insensitive)
   - Check max length (50 characters)
5. Implement removeTag handler
6. Implement keyboard handlers:
   - Enter: add tag
   - Backspace on empty input: remove last tag
7. Implement ARIA live region for announcements
8. Render:
   - Label
   - Container with existing tags (Badge components with X button)
   - Input field
   - Hidden aria-live region
9. Add accessibility attributes:
   - `aria-label` for input
   - `aria-describedby` for help text
   - `role="button"` and `aria-label` for X buttons

**Key Implementation Details:**
```typescript
const [inputValue, setInputValue] = useState('');
const [announcement, setAnnouncement] = useState('');

const addTag = () => {
  const trimmed = inputValue.trim();
  if (!trimmed) return;
  if (trimmed.length > 50) return;
  if (value.some(tag => tag.toLowerCase() === trimmed.toLowerCase())) return;

  onChange([...value, trimmed]);
  setInputValue('');
  setAnnouncement(`Added ${trimmed}`);
};

const removeTag = (index: number) => {
  const removed = value[index];
  onChange(value.filter((_, i) => i !== index));
  setAnnouncement(`Removed ${removed}`);
};
```

**Estimated Time:** 1 hour

---

### Step 4: Create DietTypeSelect Component

**File:** `src/components/profile/DietTypeSelect.tsx`

1. Create new file and import dependencies
2. Define diet type options array (all enum values + "Not specified")
3. Implement component using Shadcn Select
4. Handle value change and call onChange prop
5. Add label and accessibility attributes
6. Style with Tailwind classes

**Key Implementation Details:**
```typescript
const options = [
  { value: null, label: 'Not specified' },
  { value: 'omnivore', label: 'Omnivore' },
  // ... other options
];

return (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Select
      value={value || 'not-specified'}
      onValueChange={(v) => onChange(v === 'not-specified' ? null : v as DietType)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value || 'not-specified'} value={opt.value || 'not-specified'}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
```

**Estimated Time:** 30 minutes

---

### Step 5: Create useDietaryPreferences Hook

**File:** `src/components/hooks/useDietaryPreferences.ts`

1. Create new file and import dependencies
2. Define hook function accepting initial preferences
3. Initialize state variables (preferences, formState, isEditing, isSaving, error)
4. Implement `hasChanges` computed value with useMemo
5. Implement `startEditing` function
6. Implement `cancelEditing` function
7. Implement `updateFormField` function
8. Implement `savePreferences` async function:
   - Build request body with only changed fields
   - Call PUT API
   - Handle success: update state, exit edit mode, show toast
   - Handle errors: set error message, keep edit mode
9. Implement `resetError` function
10. Return all state and methods

**Key Implementation Details:**
```typescript
const savePreferences = async () => {
  setIsSaving(true);
  setError(null);

  try {
    const requestBody: Partial<UpdateDietaryPreferencesCommand> = {};

    // Only include changed fields
    if (formState.diet_type !== preferences?.diet_type) {
      requestBody.diet_type = formState.diet_type;
    }
    // ... same for other fields

    const response = await fetch('/api/profile/dietary-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Handle errors
    }

    const updated = await response.json();
    setPreferences(updated);
    setIsEditing(false);
    toast.success('Preferences updated');

  } catch (err) {
    setError(err.message);
  } finally {
    setIsSaving(false);
  }
};
```

**Estimated Time:** 1.5 hours

---

### Step 6: Create AccountSection Component

**File:** `src/components/profile/AccountSection.tsx`

1. Create new file and import dependencies
2. Implement simple component with Card layout
3. Display user email (read-only)
4. Add Logout button (implement logout handler or pass as prop)
5. Style with Tailwind classes

**Key Implementation Details:**
```typescript
export function AccountSection({ userEmail }: AccountSectionProps) {
  const handleLogout = async () => {
    // Call logout API (implementation depends on auth setup)
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Estimated Time:** 30 minutes

---

### Step 7: Create DietaryPreferencesSection Component

**File:** `src/components/profile/DietaryPreferencesSection.tsx`

1. Create new file and import dependencies (including custom hook and child components)
2. Use `useDietaryPreferences` hook
3. Implement read-only view:
   - Display current preferences
   - Edit button
4. Implement edit mode view:
   - DietTypeSelect component
   - TagInput for allergies
   - TagInput for disliked ingredients
   - Save and Cancel buttons
   - Error display
5. Add loading states (spinner in Save button)
6. Add Toaster component for notifications
7. Style with Tailwind classes

**Key Implementation Details:**
```typescript
export function DietaryPreferencesSection({ preferences: initialPreferences, onPreferencesUpdated }: DietaryPreferencesSectionProps) {
  const {
    preferences,
    formState,
    isEditing,
    isSaving,
    error,
    hasChanges,
    startEditing,
    cancelEditing,
    updateFormField,
    savePreferences,
    resetError
  } = useDietaryPreferences(initialPreferences);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dietary Preferences</CardTitle>
          {!isEditing && (
            <Button onClick={startEditing} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isEditing ? (
          // Read-only view
          <ReadOnlyView preferences={preferences} />
        ) : (
          // Edit mode
          <div className="space-y-4">
            <DietTypeSelect
              value={formState.diet_type}
              onChange={(v) => updateFormField('diet_type', v)}
              disabled={isSaving}
              id="diet-type"
            />
            <TagInput
              label="Allergies & Intolerances"
              value={formState.allergies}
              onChange={(v) => updateFormField('allergies', v)}
              placeholder="Type and press Enter to add"
              disabled={isSaving}
              id="allergies"
            />
            <TagInput
              label="Disliked Ingredients"
              value={formState.disliked_ingredients}
              onChange={(v) => updateFormField('disliked_ingredients', v)}
              placeholder="Type and press Enter to add"
              disabled={isSaving}
              id="disliked-ingredients"
            />
            <div className="flex gap-2">
              <Button
                onClick={savePreferences}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={cancelEditing}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <Toaster />
    </Card>
  );
}
```

**Estimated Time:** 1.5 hours

---

### Step 8: Create ProfileView Component

**File:** `src/components/profile/ProfileView.tsx`

1. Create new file and import child components
2. Implement simple container component
3. Use responsive grid layout (single column mobile, two columns desktop)
4. Render AccountSection and DietaryPreferencesSection
5. Style with Tailwind classes

**Key Implementation Details:**
```typescript
export function ProfileView({ initialPreferences, userEmail }: ProfileViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountSection userEmail={userEmail} />
        <DietaryPreferencesSection
          preferences={initialPreferences}
          onPreferencesUpdated={(updated) => {
            // Optional: callback for parent component
          }}
        />
      </div>
    </div>
  );
}
```

**Estimated Time:** 30 minutes

---

### Step 9: Create Profile Astro Page

**File:** `src/pages/profile.astro`

1. Create new file
2. Add authentication check (using Astro.locals.user or DEFAULT_USER for testing)
3. If not authenticated, redirect to login
4. Fetch dietary preferences server-side via GET API
5. Handle 404 (no preferences) by setting preferences to null
6. Handle other errors appropriately
7. Render ProfileView with initial data
8. Wrap in layout component

**Key Implementation Details:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ProfileView } from '@/components/profile/ProfileView';
import type { DietaryPreferencesDTO } from '@/types';

// Check authentication
const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/login');
}

// Fetch dietary preferences
let preferences: DietaryPreferencesDTO | null = null;
try {
  const response = await fetch(`${Astro.url.origin}/api/profile/dietary-preferences`, {
    headers: {
      Cookie: Astro.request.headers.get('Cookie') || ''
    }
  });

  if (response.ok) {
    preferences = await response.json();
  } else if (response.status === 404) {
    // No preferences set yet
    preferences = null;
  } else if (response.status === 401) {
    return Astro.redirect('/login');
  } else {
    throw new Error('Failed to load preferences');
  }
} catch (error) {
  console.error('Error loading preferences:', error);
  // Show error page or continue with null preferences
}

const userEmail = user.email || 'user@example.com';
---

<Layout title="Profile - HealthyMeal">
  <ProfileView
    client:load
    initialPreferences={preferences}
    userEmail={userEmail}
  />
</Layout>
```