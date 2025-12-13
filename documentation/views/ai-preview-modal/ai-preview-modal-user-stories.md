# User Stories for AI Preview Modal

## US-017: Modify Recipe with AI

**Title:** Modify Recipe with AI

**Description:** As a user, I want to modify a recipe based on my dietary preferences so that I can adapt it to my needs without manual effort.

**Acceptance Criteria:**
- "Modify Recipe" or "Adapt Recipe" button is visible on recipe detail view
- User can initiate AI modification with a single click
- System sends original recipe text and user's dietary preferences to AI service
- System displays loading indicator while processing
- System displays the AI-modified recipe upon completion
- Modified recipe clearly shows how it differs from the original
- Modification process completes within reasonable time (e.g., 30 seconds)

---

## US-018: Save AI-Modified Recipe

**Title:** Save AI-Modified Recipe

**Description:** As a user, I want to save an AI-modified recipe so that I can keep the adapted version for future use.

**Acceptance Criteria:**
- After viewing AI-modified recipe, user sees option to save it
- User can optionally edit the title before saving
- System saves the modified recipe as a new entry in user's recipe list
- New recipe is clearly marked or titled to indicate it's a modified version
- Original recipe remains unchanged
- User receives confirmation of successful save
- User can view the new recipe in their recipe list

---

## US-019: AI Modification Without Dietary Preferences

**Title:** AI Modification Without Dietary Preferences

**Description:** As a user who hasn't set dietary preferences, I want to be informed when trying to modify a recipe so that I know what to do.

**Acceptance Criteria:**
- If user has no dietary preferences set and attempts recipe modification, system displays informative message
- Message explains that dietary preferences are needed for modification
- Message provides link or button to navigate to profile/preferences page
- Modification is not attempted without preferences

---

## US-020: AI Modification Error Handling

**Title:** AI Modification Error Handling

**Description:** As a user, I want to be informed if recipe modification fails so that I understand what happened and can try again.

**Acceptance Criteria:**
- If AI service is unavailable, user sees clear error message
- If AI service returns an error, user sees appropriate error message
- Error message does not expose technical details to user
- User has option to retry modification
- Original recipe remains accessible if modification fails
- System logs technical errors for troubleshooting

---

## US-021: View AI Modification Explanation

**Title:** View AI Modification Explanation

**Description:** As a user, I want to understand how the AI modified my recipe so that I can learn about ingredient substitutions and dietary adaptations.

**Acceptance Criteria:**
- AI-modified recipe includes explanation of key changes made
- Explanation highlights substituted ingredients and why they were substituted
- Explanation is clear and easy to understand
- User can view both original and modified versions for comparison
