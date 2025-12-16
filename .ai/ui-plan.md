# UI Architecture for HealthyMeal

## 1. UI Structure Overview

HealthyMeal is a web-based, account-centric application organized around a small set of primary views:

- Public / unauthenticated:
  - Landing / marketing page
  - Authentication pages (login, register, reset password)
- Authenticated:
  - Recipe list (home for logged-in users)
  - Recipe detail
  - Recipe create / edit
  - Profile & dietary preferences
- System:
  - Error pages (404, 500)
- Overlays / shared components:
  - AI preview modal (AI recipe modification)
  - Delete confirmation dialog
  - Welcome/onboarding modal & banner
  - Toast notification system

Underlying principles:

- **Core workflow focus**: Make it very easy to go from registration → preferences → first recipe → AI modification.
- **Privacy by design**: All content is account-scoped and private; UI never exposes cross-user data.
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA for dialogs and live regions, WCAG AA contrast.
- **Resilience**: Clear error/empty states, preserved form content on errors, strong feedback for long-running AI operations.

---

## 2. View List

For each view:

- View name
- View path
- Main purpose
- Key information to display
- Key view components
- UX, accessibility, and security considerations
- Related requirements (FR = Functional Requirement, US = User Story)

---

### 2.1 Landing / Marketing Page

- **View name**: Landing
- **Path**: `/`
- **Main purpose**:
  - Present HealthyMeal’s value proposition.
  - Provide clear calls to action for new and returning users.
- **Key information to display**:
  - Product positioning: AI-powered dietary-aware recipe adaptation.
  - Short explanation of how it works (set preferences → save recipes → adapt with AI).
  - Primary actions: “Sign Up” and “Log In”.
- **Key view components**:
  - Hero section (headline, subheadline, CTA buttons).
  - Brief feature highlights (personal recipe library, AI modification, dietary profiles).
- **UX, accessibility, and security considerations**:
  - Clear heading hierarchy (e.g., `h1` for main value prop).
  - Buttons with descriptive labels (“Sign Up for Free”, “Log In”).
  - If user is already authenticated, immediately redirect to `/recipes` (avoids confusion).
  - No sensitive data displayed; no account-specific content until authenticated.
- **Related requirements**:
  - Supports overall onboarding context for all auth and recipe-related US/FR.

---

### 2.2 Login Page

- **View name**: Login
- **Path**: `/login`
- **Main purpose**:
  - Allow registered users to authenticate with email and password.
- **Key information to display**:
  - Email and password fields.
  - Link to registration.
  - “Forgot your password?” link.
  - Error messages for invalid credentials.
- **Key view components**:
  - Centered card layout.
  - Form:
    - Email input (`type="email"`).
    - Password input (`type="password"`).
    - Submit button.
  - Links:
    - “Create an account” → `/register`.
    - “Forgot password?” → `/reset-password`.
- **UX, accessibility, and security considerations**:
  - No main navigation header (focus user on auth).
  - Inline validation for email format; errors announced via `aria-live`.
  - Generic error messaging on failed login (do not confirm if email exists).
  - On success, redirect to `/recipes` (or to `returnUrl` if provided).
  - Prevent access to protected pages without auth; redirect here with context.
- **Related requirements**:
  - FR-002, FR-004, FR-005
  - US-002, US-003, US-005, US-024

---

### 2.3 Registration Page

- **View name**: Registration
- **Path**: `/register`
- **Main purpose**:
  - Enable new users to create an account using email and password.
- **Key information to display**:
  - Email, password, confirm password fields.
  - Password requirements (min 8 chars, etc.).
  - Errors for invalid email, weak password, duplicate email.
- **Key view components**:
  - Centered card layout.
  - Form:
    - Email input.
    - Password input + nearby text for requirements.
    - Confirm password input.
    - Submit button.
  - Link to `/login`.
- **UX, accessibility, and security considerations**:
  - Real-time or on-blur validation:
    - Email format with example (e.g., `name@example.com`).
    - Password strength & policy text.
  - Error text associated with inputs (`aria-describedby`).
  - After successful registration:
    - Auto-login.
    - Redirect to `/recipes`.
    - Trigger welcome/onboarding modal.
  - Avoid exposing “email already exists” in a way that leaks account existence; generic message or careful phrasing.
- **Related requirements**:
  - FR-001, FR-004
  - US-001, US-028, US-029, US-024

---

### 2.4 Password Reset Page

- **View name**: Password Reset
- **Path**: `/reset-password`
- **Main purpose**:
  - Handle both requesting a reset email and setting a new password via reset link.
- **Key information to display**:
  - Mode 1: Request reset link → email input.
  - Mode 2: Set new password → password + confirm fields (when accessed via token link).
  - Success / error messages (“Check your email”, “Password updated”).
- **Key view components**:
  - Centered card layout.
  - Form (mode-dependent).
  - Link back to login.
- **UX, accessibility, and security considerations**:
  - Clear headings per mode (“Reset your password”, “Choose a new password”).
  - Don’t reveal whether the email is registered; generic success message (“If an account exists…”).
  - Enforce same password requirements as registration.
  - Show message for expired/invalid reset link.
- **Related requirements**:
  - FR-003
  - US-004

---

### 2.5 Recipe List Page

- **View name**: Recipe List
- **Path**: `/recipes`
- **Main purpose**:
  - Main authenticated home.
  - Display user’s recipe library and entry point to creation and AI workflows.
- **Key information to display**:
  - User’s recipes, segmented:
    - “My Recipes” (originals by default).
    - “AI Modified” (AI-generated).
  - Recipe metadata:
    - Title (truncated).
    - Creation date
    - Badges for AI-modified recipes and parent recipe name (in AI view).
  - Pagination info (“Showing 1–20 of 45 recipes”).
  - Empty state messaging when no recipes.
  - Onboarding banner if no dietary preferences yet.
- **Key view components**:
  - **Global navigation header** (for all authenticated views):
    - Logo → `/recipes`.
    - Nav links: “Recipes”, “Profile”.
    - User menu dropdown (email, Logout).
  - **View toggle**:
    - Segmented control / tabs: “My Recipes” / “AI Modified”.
    - Controlled by `?view=my-recipes | ai-modified` URL parameter.
  - **Recipe grid**:
    - Cards, responsive: 1 col (mobile), 2 (md), 3 (lg).
    - Card elements:
      - Title.
      - Creation date.
      - Badge “AI Modified” + parent recipe title (for AI recipes).
      - Entire card clickable → detail.
  - **Pagination**:
    - “Load More” button.
    - Total & range display.
  - **Actions / CTAs**:
    - “Add Recipe” button in header or page top.
  - **Empty state**:
    - Illustration/placeholder.
    - Heading: “No recipes yet”.
    - Subtext & primary CTA: “Add Your First Recipe”.
    - Tip about setting dietary preferences to get better AI modifications.
  - **Onboarding banner**:
    - Visible if user has no preferences set (or minimal).
    - Message + “Set dietary preferences” button → `/profile`.
    - Dismissible until preferences are set.
  - **Loading states**:
    - Skeleton cards while fetching.
- **UX, accessibility, and security considerations**:
  - Main section labelled appropriately (`<main>` with `h1` “My Recipes”).
  - Segmented control uses proper tab semantics; ensures arrow-key navigation.
  - Skeletons maintain layout to minimize visual shift.
  - Recipe data strictly from `/api/recipes` filtered by authenticated user; no shared content.
  - “Load More” button uses clear loading state; screen reader announcement when new items appear (aria-live).
- **API alignment**:
  - `GET /api/recipes?page=1&limit=20&is_ai_generated=false` for “My Recipes”.
  - `GET /api/recipes?...&is_ai_generated=true` for “AI Modified”.
- **Related requirements**:
  - FR-010, FR-011, FR-012, FR-026–FR-028, FR-029–FR-031
  - US-005, US-010, US-011, US-022, US-024, US-025

---

### 2.6 Recipe Detail Page

- **View name**: Recipe Detail
- **Path**: `/recipes/[id]`
- **Main purpose**:
  - Present full recipe content.
  - Provide primary entry point to AI modification, editing, and deletion.
  - For AI recipes: show relationship to original and support comparison.
- **Key information to display**:
  - Recipe title.
  - Creation date, last modified date.
  - Ingredients (plain text).
  - Instructions (plain text).
  - Indicators:
    - “AI Modified” badge if `is_ai_generated=true`.
    - Link to parent/original recipe if AI-generated.
  - AI variants:
    - For an original recipe, list AI-modified children.
  - For AI recipes: compare view with original.
- **Key view components**:
  - **Sticky action bar** (top of viewport / page):
    - Primary button: “Modify with AI” (for original recipes and maybe AI ones if allowed).
    - Secondary: “Edit”.
    - Overflow menu with “Delete” (and potentially other actions).
  - **Content sections**:
    - `h1` Title.
    - Metadata (created/updated timestamps).
    - Ingredients section: heading + body.
    - Instructions section: heading + body.
  - **AI indicators**:
    - For AI recipes:
      - Badge “AI Modified”.
      - Text “Adapted from: [Original Recipe Title]” (link to parent).
  - **AI variants section** (for originals):
    - Collapsible section: “AI Modified Versions (X)”.
    - Chevon icon, collapsed by default.
    - Inside: list of variant cards:
      - Title.
      - Creation date.
      - Optionally a summary of preferences used.
  - **Compare with Original section** (for AI recipes):
    - Collapsible section.
    - When open:
      - Two-column layout on desktop; stacked on mobile.
      - Left: original ingredients & instructions.
      - Right: AI-modified version.
      - Differences visually indicated (e.g., additions highlighted, removals struck-through).
- **UX, accessibility, and security considerations**:
  - Breadcrumb/“Back to recipes” link for easy navigation.
  - Collapsibles use buttons with `aria-expanded` and `aria-controls`.
  - Comparison view ensures color is not the sole differentiator; uses text markers (e.g., “Replaced X with Y”).
  - Delete action does not occur immediately; must confirm in a separate dialog.
  - All data fetched via `/api/recipes/:id` + optionally `/api/recipes?parent_recipe_id=...`; RLS ensures only owner’s data is returned.
- **API alignment**:
  - `GET /api/recipes/:id` for base recipe.
  - `GET /api/recipes?parent_recipe_id=:id` for its AI variants.
  - For AI recipes, additional `GET /api/recipes/:parentId` to retrieve original for comparison.
- **Related requirements**:
  - FR-011–FR-013, FR-019–FR-024, FR-026–FR-028, FR-030–FR-032
  - US-005, US-012, US-013, US-014, US-017, US-018, US-021, US-020

---

### 2.7 Recipe Create Page

- **View name**: Create Recipe
- **Path**: `/recipes/new`
- **Main purpose**:
  - Allow users to create and save new original recipes into their personal library.
- **Key information to display**:
  - Input fields:
    - Title (required, ≤ 200 chars).
    - Ingredients (required).
    - Instructions (required).
  - Character count:
    - Title: current / 200.
    - Combined ingredients + instructions: current / 10,000.
  - Validation errors and status messages.
- **Key view components**:
  - Page heading: “Create Recipe”.
  - Single-step form divided into three sections:
    1. Title (text input + counter).
    2. Ingredients (textarea; multi-line).
    3. Instructions (textarea; multi-line).
  - Submit button (“Save Recipe”) + cancel/back link.
  - Inline validation messages below fields.
- **UX, accessibility, and security considerations**:
  - Client-side validation (Zod) aligned with API:
    - Required fields.
    - Max lengths.
  - Character counters near fields, with warning styling near limits.
  - On validation error:
    - Form data remains; no loss of input.
    - Errors described and announced via `aria-live`.
  - On network error (US-025):
    - Show clear error toast.
    - Keep inputs untouched; user can retry.
  - On submit success:
    - Toast “Recipe saved”.
    - Redirect to recipe detail (or list) to continue flow into AI modification.
  - Special characters fully supported; just textareas with Unicode support.
- **API alignment**:
  - `POST /api/recipes` with `{ title, ingredients, instructions, is_ai_generated: false }`.
- **Related requirements**:
  - FR-010, FR-011, FR-028, FR-031–FR-032
  - US-010, US-023, US-025, US-026

---


### 2.9 Profile & Dietary Preferences Page

- **View name**: Profile
- **Path**: `/profile`
- **Main purpose**:
  - Allow users to review account info and configure dietary preferences that drive AI modifications.
- **Key information to display**:
  - Account section:
    - User email (read-only).
  - Dietary preferences section:
    - Diet type (e.g., omnivore, vegetarian, vegan, etc.).
    - Allergies/intolerances (array of strings).
    - Disliked ingredients (array of strings).
    - (Religious restrictions / nutritional goals can be integrated later as backend supports).
- **Key view components**:
  - Layout:
    - Single column on mobile; two columns on large screens (Account / Preferences).
  - Account panel:
    - Email display.
    - “Logout” button (also in header menu).
  - Dietary Preferences panel:
    - Default read-only view.
    - “Edit” button to toggle edit mode.
    - In edit mode:
      - Diet Type dropdown (Select) with allowed values:
        - omnivore, vegetarian, vegan, pescatarian, keto, paleo, low_carb, low_fat, mediterranean, other, plus “Not specified”.
      - Allergies:
        - Tag input component (type + Enter to add).
      - Disliked ingredients:
        - Tag input component.
      - “Save” and “Cancel” buttons.
- **UX, accessibility, and security considerations**:
  - Inline edit mode clearly signaled (e.g., border, labels).
  - Tag input:
    - Keyboard-friendly: Enter to add, Backspace/Delete to remove.
    - Announce additions/removals via `aria-live` (polite).
  - On save:
    - Disable controls, show spinner in button.
    - On success, show toast “Preferences updated”.
    - Reload view in read-only state.
  - On error:
    - Keep edited values; show error message.
  - Preferences are private health-related data; never shared or exposed.
- **API alignment**:
  - `GET /api/profile/dietary-preferences` on page load.
  - `PUT /api/profile/dietary-preferences` on Save.
- **Related requirements**:
  - FR-006–FR-009, FR-026–FR-028, FR-029–FR-032
  - US-005, US-006, US-007, US-008, US-009

---

### 2.10 AI Preview Modal (AI Recipe Modification)

- **View name**: AI Preview Modal
- **Path**: Overlay triggered from `/recipes/[id]`
- **Main purpose**:
  - Allow users to generate, inspect, and optionally save AI-modified versions of a recipe, based on their dietary preferences.
- **Key information to display**:
  - While loading:
    - “Generating modifications…” message.
  - On success:
    - Modified recipe title (editable).
    - Modified ingredients.
    - Modified instructions.
    - Explanation section:
      - Key changes (e.g., substitutions and reasons).
      - Note that the AI used user’s saved preferences (diet type, allergies, dislikes).
  - On errors or missing preferences:
    - Clear user-friendly messages and guidance.
- **Key view components**:
  - **Dialog container**:
    - Header: “AI Modified Recipe” + close button.
    - Scrollable body.
    - Sticky footer.
  - **Body content**:
    - Editable title input.
    - Ingredients (read-only text area).
    - Instructions.
    - Explanation card in a muted style.
  - **Footer**:
    - Primary button: “Save as New Recipe”.
    - Secondary: “Cancel”.
  - **Loading overlay**:
    - Overlay with spinner and multi-stage message (“Generating modifications…”).
    - “Cancel” button to abort request.
  - **Missing preferences state**:
    - Message: “Set your dietary preferences to use AI modifications”.
    - Visual hint about types of preferences.
    - Button: “Go to Profile” → `/profile`.
  - **Error state**:
    - Short explanation (e.g., “The AI service is temporarily unavailable. Please try again later.”).
    - Retry button for retriable cases.
- **UX, accessibility, and security considerations**:
  - Uses `role="dialog"` with `aria-modal="true"`, labelled by header.
  - Focus trap inside modal; focus returns to “Modify with AI” button on close.
  - Loading state should be cancelable to avoid user feeling locked.
  - For rate limits (429), show countdown or instruction not to retry immediately.
  - Do not show raw AI `raw_response` to user; keep explanation human-readable only.
- **API alignment**:
  - Triggers `POST /api/recipes/:id/ai-preview`.
  - On “Save as New Recipe”, uses `POST /api/recipes` with:
    - `is_ai_generated: true`.
    - `parent_recipe_id`.
    - `ai_metadata` from preview.
- **Related requirements**:
  - FR-018–FR-025
  - US-017, US-018, US-019, US-020, US-021

---

### 2.11 Delete Confirmation Dialog

- **View name**: Delete Confirmation Dialog
- **Path**: Overlay triggered from detail (and potentially list)
- **Main purpose**:
  - Prevent accidental deletion of recipes by requiring explicit confirmation.
- **Key information to display**:
  - Recipe title to be deleted.
  - Warning: “This action cannot be undone.”
  - Buttons: “Cancel” and “Delete”.
- **Key view components**:
  - Alert dialog:
    - Title: “Delete [Recipe Title]?”
    - Description: short, plain-language explanation of impact.
  - Buttons:
    - Cancel (non-destructive, default focus).
    - Delete (destructive styling).
- **UX, accessibility, and security considerations**:
  - `role="alertdialog"`, with `aria-labelledby` and `aria-describedby`.
  - Default focus on Cancel to reduce accidental confirmation.
  - On confirm:
    - Show loading state until server confirms deletion.
    - Then redirect to `/recipes` + success toast.
  - Deletion is permanent; no “undo” beyond API.
- **API alignment**:
  - `DELETE /api/recipes/:id`.
- **Related requirements**:
  - FR-015, FR-028, FR-031
  - US-014, US-025

---

### 2.12 Welcome / Onboarding Modal & Banner

- **View name**: Onboarding
- **Path**: Overlays in `/recipes`
- **Main purpose**:
  - Help new users understand the value of dietary preferences and guide them to set them up.
- **Key information to display**:
  - Welcome message after registration.
  - Benefit explanation: “AI uses your dietary preferences to adapt recipes automatically.”
  - Actions:
    - “Set Up Now” → `/profile`.
    - “I’ll Do This Later” → dismiss.
  - Persistent banner (if user skipped) until preferences are configured.
- **Key view components**:
  - Modal:
    - Title: “Welcome to HealthyMeal”.
    - Short step-by-step explanation of main flow.
    - CTA button + “Later” link/button.
  - Banner on `/recipes`:
    - Compact message bar at top of recipe list.
    - Button: “Set dietary preferences”.
    - Dismiss icon (persist dismissal until prefs set).
- **UX, accessibility, and security considerations**:
  - Modal accessible as dialog; not blocking if user chooses to skip.
  - Banner: visually subtle but noticeable; screen-reader accessible.
  - Ensures compliance with US-009 (app is usable even without prefs).
- **Related requirements**:
  - FR-006–FR-009, FR-030
  - US-006–US-009
  - Supports success metrics around preferences completion and AI usage.

---

### 2.13 404 Not Found Page

- **View name**: 404 Error
- **Path**: `/404` (or global catch)
- **Main purpose**:
  - Inform users when a page does not exist and guide them back to a safe place.
- **Key information to display**:
  - Heading: “Page not found”.
  - Explanation.
  - Primary action: “Go to Recipes” (if authenticated) or “Go to Home” (if not).
- **Key view components**:
  - Centered card layout.
  - Button linking to `/recipes` or `/`.
- **UX, accessibility, and security considerations**:
  - Clear, friendly copy.
  - No technical details.
- **Related requirements**:
  - Supports robustness and user guidance; complements US-005 (no unauthorized access to others’ recipes via URL).

---

### 2.14 500 Error Page

- **View name**: 500 Error
- **Path**: `/500` (or global error boundary)
- **Main purpose**:
  - Provide a friendly fallback when an unexpected server error occurs.
- **Key information to display**:
  - Heading: “Something went wrong”.
  - Explanation (“We’re working on it. Please try again.”).
  - Actions: “Try Again” (reload) and/or “Go to Recipes”.
- **Key view components**:
  - Centered card layout similar to 404.
- **UX, accessibility, and security considerations**:
  - No stack traces or technical details shown to user.
  - Reassuring language.
- **Related requirements**:
  - FR-031, error handling standards from API plan.

---

## 3. User Journey Map

### 3.1 Primary Journey: New User to AI-Modified Recipe

1. **Discover & Register**
   - User lands on `/` (Landing).
   - Reads brief description; clicks “Sign Up” → `/register`.
   - Fills in email & password, passes validation → account created (US-001).
   - Auto-login; redirected to `/recipes` (empty list).

2. **First Visit to Recipe List & Onboarding**
   - `/recipes` shows:
     - Empty state (US-022).
     - Welcome modal encouraging dietary preferences setup (US-007–US-009).
   - User clicks “Set Up Now” → `/profile`.

3. **Configure Dietary Preferences**
   - On `/profile`, user:
     - Sees email + empty preferences.
     - Clicks “Edit” → preferences become editable.
     - Selects diet type, adds allergies & disliked ingredients.
     - Clicks “Save” → PUT `/api/profile/dietary-preferences`.
   - On success:
     - Toast: “Preferences updated”.
     - Preferences persist (US-007, US-008).

4. **Create First Recipe**
   - User returns to `/recipes` via nav or back.
   - Clicks “Add Recipe” / empty state CTA → `/recipes/new`.
   - On `/recipes/new`, user:
     - Enters title, ingredients, instructions.
     - Sees char counts and inline validation (US-010, US-023).
     - Clicks “Save Recipe” → POST `/api/recipes`.
   - On success:
     - Toast displayed.
     - Redirect to `/recipes/[id]` detail page.

5. **Modify Recipe via AI**
   - On `/recipes/[id]`, user:
     - Reviews ingredients & instructions.
     - Clicks “Modify with AI” button (US-017).
   - AI Preview Modal opens; triggers POST `/api/recipes/:id/ai-preview`.
   - Loading overlay shows “Generating modifications…”.
   - On success:
     - Modal displays modified title, ingredients, instructions, and explanation (US-021).
   - User adjusts title (optional) and clicks “Save as New Recipe”:
     - POST `/api/recipes` with `is_ai_generated=true`, `parent_recipe_id`, `ai_metadata` (US-018).
   - On success:
     - Modal closes; toast “AI-modified recipe saved”.
     - Navigation to new recipe detail `/recipes/[newId]`.

6. **Understand & Compare Modifications**
   - On AI recipe detail page:
     - “AI Modified” badge visible (FR-024).
     - Link to original recipe.
     - Collapsible “Compare with Original” section shows side-by-side diff (US-021).
   - User reviews differences and explanation, gaining confidence and knowledge about substitutions.

### 3.2 Alternative & Edge Flows (Highlights)

- **Try AI without preferences set**:
  - User skips preferences, creates recipe, then clicks “Modify with AI”.
  - AI Preview Modal immediately shows “You need dietary preferences to use this feature,” with button to `/profile`; no AI call made (US-019).

- **Password recovery**:
  - From `/login`, click “Forgot password?” → `/reset-password`.
  - Enter email; receive link; use link to set new password (US-004).

- **Concurrent editing conflict**:
  - Two tabs editing same recipe.
  - First tab saves OK; second tab’s save returns `409`.
  - UI shows toast “This recipe was updated in another tab. We’re showing you the latest version.”
  - Reload updated data and allow user to adjust before saving again (US-027).

- **Network error on save**:
  - On create/edit, network failure:
    - Inline error or toast explains issue.
    - Form content preserved; user can retry (US-025).

- **AI service errors or rate limiting**:
  - API `503`/`504`/`429` responses:
    - Modal switches to error state with user-friendly message and retry guidance (US-020).

---

## 4. Layout and Navigation Structure

### 4.1 Global Navigation (Authenticated Views)

Displayed on `/recipes*` and `/profile` (not on auth or marketing):

- **Header (top)**:
  - Left:
    - App logo / name → `/recipes`.
  - Center (optional on small screens):
    - Nav links:
      - “Recipes” → `/recipes`.
      - “Profile” → `/profile`.
  - Right:
    - User menu (dropdown):
      - Display user email or avatar icon.
      - Menu items:
        - “Profile” → `/profile`.
        - “Logout” → signs out and redirects to `/`.
- **Mobile**:
  - Hamburger icon toggles a slide-out nav:
    - Links to Recipes, Profile, Logout.

### 4.2 Non-Authenticated Layout

On `/`, `/login`, `/register`, `/reset-password`:

- Simple layout, no top app navigation.
- Landing (`/`):
  - May include header with logo and small “Log In” / “Sign Up” links.
- Auth pages:
  - Centered card with brand logo and form.
  - Minimal distractions.

### 4.3 Route Protection & Redirection

- Protected routes: `/recipes*`, `/profile`.
  - Middleware checks authentication:
    - If not authenticated → redirect to `/login?returnUrl=<original>`.
  - After successful login, redirect to `returnUrl` if present.
- Attempt to access recipe that doesn’t exist or not owned:
  - API returns 404; UI can show 404 page or an inline message with “Go to Recipes.”

### 4.4 Intra-App Navigation Patterns

- **From Recipe List**:
  - Click card → Recipe Detail.
  - “Add Recipe” button → Create Recipe page.
- **From Recipe Detail**:
  - “Modify with AI” → AI Preview Modal (no route change).
  - Back to list via logo or “Back to recipes” link.
  - From AI-generated recipe: link to parent/original.
- **From Profile**:
  - Return to recipes via nav header.
- **Error Pages**:
  - 404/500 → “Go to Recipes” or “Go Home”.

### 4.5 URL State Management

- Recipe list view:
  - `?view=my-recipes` (default) or `?view=ai-modified` persisted in URL:
    - Supports deep-linking to AI view.
    - Browser back/forward respects tab changes.
- Potential future filter/pagination state can be appended without UI rework.

---

## 5. Key Components

These components are reused across multiple views and encapsulate key UX, accessibility, and security patterns.

### 5.1 Navigation Header

- Appears on all authenticated views.
- Contains:
  - Logo link.
  - Nav links (“Recipes”, “Profile”).
  - User menu (email, logout).
- Accessibility:
  - `<nav role="navigation">` with skip-to-content link for screen readers and keyboard users.

### 5.2 Recipe Card

- Used in recipe list and AI variants section.
- Displays:
  - Title (truncated).
  - Creation date.
  - “AI Modified” badge and parent recipe title (for AI).
- Behavior:
  - Entire card is a single clickable link (no nested interactive elements to avoid focus confusion).
- Accessibility:
  - `article` role optional; link has descriptive `aria-label`.

### 5.3 Recipe Form

- Shared between Create and Edit pages.
- Encapsulates:
  - Title input with max length and counter.
  - Ingredients and instructions textareas with combined char counter.
  - Inline validation messages.
- Behavior:
  - Client-side validation on blur and submit.
  - Preserves values on error.
- Accessibility:
  - Each field with `<label>` and error message tied by `aria-describedby`.
  - `aria-live` region to announce submission errors.

### 5.4 AI Preview Modal

- Complex interactive component for AI modification preview.
- Contains:
  - Loading state and cancel control.
  - Modified recipe fields.
  - Explanation card.
  - Error and “no preferences” states.
- Accessibility:
  - Uses dialog semantics and focus trapping.
  - Buttons clearly labelled (“Save as New Recipe”, “Cancel”).
- Security:
  - Only uses data for current user’s recipe.
  - Does not expose raw AI provider metadata to user, beyond what’s needed.

### 5.5 Compare With Original Panel

- Used in AI recipe detail view.
- Shows:
  - Side-by-side original vs modified recipe.
  - Highlighted differences (additions/removals).
- UX:
  - Collapsed by default to avoid information overload.
  - Clear indication of which side is which.
- Accessibility:
  - Semantic headings for each column.
  - Differences not communicated by color alone (e.g., “Replaced sugar with xylitol”).

### 5.6 Dietary Preferences Editor

- Inline editable section on Profile page.
- Subcomponents:
  - Diet Type Select:
    - Predefined options from API enum.
    - “Not specified” option.
  - Tag Input (for allergies and disliked ingredients):
    - Type + Enter to add tag.
    - Each tag is a chip with remove button.
- Accessibility:
  - Uses list semantics (`role="list"`, `role="listitem"`).
  - Remove buttons have descriptive `aria-label`.
- Security:
  - Sensitive data is only displayed to the owner; not logged to console or exposed.

### 5.7 Delete Confirmation Dialog

- Alert dialog for recipe deletion.
- Reusable in different contexts (list, detail).
- Accessibility:
  - `role="alertdialog"` with proper labelling.
  - Focus defaults to Cancel.
- Security:
  - Prevents accidental destructive actions.

### 5.8 Toast Notification System

- Global, used for:
  - Success messages (recipe saved, preferences updated).
  - Errors (network issues, AI errors, session expiration).
- Behavior:
  - Success toasts auto-dismiss (e.g., after 5s).
  - Error toasts require manual close.
- Accessibility:
  - `aria-live="polite"` for success, `aria-live="assertive"` for errors.
  - Non-intrusive placement (top-right on desktop, top-center on mobile).

### 5.9 Skeleton & Loading Components

- Used for:
  - Recipe list.
  - Recipe detail.
- Behavior:
  - Mirror final layout to reduce layout shifts.
- Accessibility:
  - Marked as `aria-hidden="true"`; actual content area indicates “Loading…” via `aria-live` region.

### 5.10 Authentication Forms

- Shared patterns for Login, Register, and Password Reset:
  - Card layout.
  - Email/password inputs with validation.
  - Error messages and helper text.
- Security:
  - Inputs of type `password` for secrets.
  - Proper handling of error messages to avoid information leaks about account existence.

---

### 5.11 Requirement-to-UI Mapping (Summary)

- **Auth & Account (FR-001–FR-005, US-001–US-005, US-024, US-028, US-029)**:
  - Login/Register/Reset views, header user menu Logout, route guards, session-expiry handling.
- **Profile & Preferences (FR-006–FR-009, US-006–US-009)**:
  - Profile page with inline preferences editor, Onboarding modal & banner.
- **Recipe Management (FR-010–FR-015, FR-026–FR-028, US-010–US-014, US-022, US-023, US-025–US-027)**:
  - `/recipes` list, `/recipes/[id]` detail, `/recipes/new`, `/recipes/[id]/edit`, Delete dialog, recipe form & cards.
- **AI Modification (FR-018–FR-025, US-017–US-021)**:
  - “Modify with AI” button, AI Preview Modal, AI variants section, AI badges and comparison panel.
- **UI & Feedback (FR-029–FR-032, US-020, US-022–US-026)**:
  - Responsive layouts, navigation, skeletons, toasts, form validation, error pages, empty states.

This UI architecture ensures that all PRD requirements, API capabilities, and planning decisions are reflected in a cohesive, accessible, and secure user interface that directly addresses user pain points around dietary-specific recipe adaptation.