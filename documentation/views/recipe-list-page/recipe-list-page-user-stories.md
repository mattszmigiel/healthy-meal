# Recipe List Page - Related User Stories

## US-005: Access Control
**Title**: Access Control
**Description**: As a user, I want my recipes to be private so that only I can view and modify them.
**Acceptance Criteria**:
- Unauthenticated users cannot access recipe pages
- Users can only view recipes they have created
- Users cannot access other users' recipes via URL manipulation
- System returns appropriate error for unauthorized access attempts

## US-010: Create Recipe
**Title**: Create Recipe
**Description**: As a user, I want to create and save a new recipe so that I can build my personal recipe collection.
**Acceptance Criteria**:
- User can access "Add Recipe" or "Create Recipe" function
- User can enter recipe title (required field)
- User can enter recipe content including ingredients and instructions (required field)
- Recipe title has a character limit (e.g., 200 characters)
- Recipe content has a character limit (e.g., 10,000 characters)
- User can save the recipe
- System validates required fields before saving
- Recipe is associated with the logged-in user's account
- User receives confirmation of successful save
- User is redirected to recipe list or recipe detail view after save

## US-011: View Recipe List
**Title**: View Recipe List
**Description**: As a user, I want to view a list of all my saved recipes so that I can easily find and access them.
**Acceptance Criteria**:
- User can access recipes list page after login
- Page displays all recipes owned by the user
- Each recipe entry shows at least the title and creation date
- List is ordered by most recently created by default
- Empty state is displayed if user has no recipes
- User can click on a recipe to view full details

## US-022: Handle Empty Recipe List
**Title**: Handle Empty Recipe List
**Description**: As a new user with no recipes, I want to see helpful guidance so that I know what to do next.
**Acceptance Criteria**:
- Empty state is displayed when user has no recipes
- Empty state message is friendly and encouraging
- Clear call-to-action button to create first recipe is visible
- Navigation to add recipe function is obvious

## US-024: Session Timeout
**Title**: Session Timeout
**Description**: As a user whose session has expired, I want to be redirected to login so that I can re-authenticate without losing context.
**Acceptance Criteria**:
- System detects expired session
- User is redirected to login page
- Message explains that session expired
- After re-login, user is returned to previous page if possible

## US-025: Network Error During Recipe Save
**Title**: Network Error During Recipe Save
**Description**: As a user experiencing network issues, I want to be informed if my recipe save fails so that I don't lose my work.
**Acceptance Criteria**:
- System detects network errors during save operation
- Error message clearly indicates the issue
- User's recipe content is preserved in the form
- User can attempt to save again
- Loading indicator is cleared when error occurs
