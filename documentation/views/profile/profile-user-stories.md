# Profile & Dietary Preferences Page - User Stories

## US-005: Access Control
**Title**: Access Control
**Description**: As a user, I want my recipes to be private so that only I can view and modify them.
**Acceptance Criteria**:
- Unauthenticated users cannot access recipe pages
- Users can only view recipes they have created
- Users cannot access other users' recipes via URL manipulation
- System returns appropriate error for unauthorized access attempts

---

## US-006: View Profile
**Title**: View Profile
**Description**: As a logged-in user, I want to view my profile so that I can see my current dietary preferences.
**Acceptance Criteria**:
- User can navigate to profile page from main navigation
- Profile page displays user email
- Profile page displays all saved dietary preferences
- Profile page is only accessible when logged in

---

## US-007: Add Dietary Preferences
**Title**: Add Dietary Preferences
**Description**: As a user, I want to add my dietary preferences so that recipes can be adapted to my needs.
**Acceptance Criteria**:
- User can access dietary preferences form from profile page
- User can specify allergies or intolerances (e.g., gluten, dairy, nuts)
- User can select diet type (e.g., vegan, vegetarian, keto, paleo, omnivore)
- User can indicate religious dietary restrictions (e.g., halal, kosher)
- User can specify nutritional goals (e.g., low-sodium, high-protein, low-carb)
- User can list disliked ingredients
- User can save dietary preferences
- System confirms successful save
- Preferences persist across sessions

---

## US-008: Edit Dietary Preferences
**Title**: Edit Dietary Preferences
**Description**: As a user, I want to edit my dietary preferences so that I can update them as my needs change.
**Acceptance Criteria**:
- User can access edit function for dietary preferences
- Form is pre-populated with current preferences
- User can modify any preference field
- User can save updated preferences
- System confirms successful update
- Updated preferences are immediately reflected in profile view
- Updated preferences are used for subsequent recipe modifications

---

## US-009: No Dietary Preferences Set
**Title**: No Dietary Preferences Set
**Description**: As a new user, I want to be able to use the app even if I haven't set dietary preferences yet.
**Acceptance Criteria**:
- User can access recipe management features without setting dietary preferences
- System displays a prompt or notice encouraging user to complete dietary preferences
- AI recipe modification feature prompts user to set preferences if none exist
- User is not blocked from creating or viewing recipes without preferences
