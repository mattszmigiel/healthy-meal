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