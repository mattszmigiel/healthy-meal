1. Product Goal & Target
Goal: Help “healthy eaters” quickly adapt any recipe to their dietary preferences using AI.
Main problems solved:
Replacing meat with vegetarian alternatives.
Removing or replacing disliked ingredients.
Enforcing dietary patterns and allergens.
Target user: General “healthy eaters” (not medically focused), primarily mobile web users.
2. Platforms & Scope
Platform: Responsive web app, optimized for mobile (no native apps, no offline mode).
Not in MVP:
Recipe import from URL.
Photos/media.
Sharing/social features.
Advanced analytics dashboards.
Content moderation.
Email verification.
Fancy support system.
3. Accounts, Auth, and Security
Account:
Email + password only.
No social login, no email verification.
“Forgot password” flow with single-use links valid 1–2 hours.
Password policy: 8–10+ characters, at least two character types (letters + numbers/symbols), with a simple strength indicator.
Sessions:
Long-lived session (~30 days of inactivity).
Explicit “Log out” option in Profile.
Deletion:
Account deletion requires password re-entry and confirmation that all data will be permanently lost.
On deletion: fully delete user-linked data (recipes, preferences) and cascade-delete adapted recipes.
Security:
Passwords stored with strong one-way hash (e.g., bcrypt/argon2).
All traffic over HTTPS.
Logs can include real user IDs (no hashing required), but only minimal info: timestamps, userId, error types, recipe/response sizes.
4. User Profile & Preferences
Access:
Profile/Preferences accessible via bottom navigation (“Profile”).
Preferences collected in a single, scrollable wizard page right after sign-up:
Diet (required: at least one):
Classic, Vegetarian, Vegan, Pescatarian, Mediterranean, Keto.
“Classic” can coexist with others (no special deselection logic).
Allergens:
Milk, Eggs, Peanuts, Tree Nuts, Fish, Shellfish, Wheat, Soy, Sesame, Mustard.
Users can confirm “none” or select from list.
Disliked ingredients:
Free-text field, comma-separated (helper text provided).
Editing:
Users can edit preferences later in Profile.
Changes apply only to future adaptations (existing recipes are not updated or flagged).
Data collected: Email + dietary preferences only (no extra personal info).
5. Recipes: Data Model & Limits
Structure
Recipe fields:
Required: title, ingredients, steps.
Optional: servings, prep time, cook time, tags.
Tags:
Meal type: Breakfast, Lunch, Dinner, Snack (multi-select).
Cuisine: Italian, Asian, American, Mediterranean (single-select).
Ingredients:
One ingredient per line in a free-text multiline field (e.g., “1 cup chopped carrots”).
Steps:
Single block of text for all steps (not individually structured).
Limits & Validation
Hard limits:
Max 20 ingredients.
Max 15 steps (interpreted by user; enforcement via structure/length guidance).
Max 5,000 characters total (recipe text).
Validation:
Strict structural validation on create:
Required fields present.
Ingredient/step/character limits respected.
Inline error messages near fields (e.g., “Maximum 20 ingredients allowed”).
Recipe cannot be saved if structural errors exist.
Unit/format issues are not blockers; just guidance.
CRUD:
Users can create recipes by:
Manually filling structured fields.
Pasting and then manually mapping into fields.
No manual editing after save (both original and adapted recipes are non-editable).
Deletion:
Immediate permanent deletion (no trash).
If original is deleted, all its adapted child recipes are also deleted.
6. Recipe Browsing & Navigation
Navigation (mobile-first):
Bottom navigation with: Recipes / New Recipe / Profile.
Recipes list:
Shows all recipes (original + adapted) in a single list.
Sorted by last modified first.
No search, no filters in MVP.
Pagination: show e.g. 20 recipes, then “Load more” button.
For adapted recipes:
Show “Adapted” badge.
Show “Based on: [Original title]”.
Max 200 recipes per user (soft data limit, no special UX around hitting it yet).
7. AI Adaptation Behavior
Trigger & Flow
Adaptation is only available:
On the recipe detail page.
For original recipes (no “adapt the adapted” chain).
Main actions:
“Adapt to my preferences” button.
Optional free-text field: “Extra instructions for this adaptation (optional)” that apply only to this run and are not saved.
Limits:
Hard-block adaptation if:
Recipe exceeds ingredient/step/character limits.
Adaptation quota:
Max 50 adaptations per user per calendar day.
Day resets at UTC midnight.
When hitting the limit:
Show inline message: “You’ve reached today’s adaptation limit (50). Please try again tomorrow.”
Button remains enabled (no disabling in MVP), but message explains limit.
Constraints & Logic
On every adaptation call:
Always re-check and strictly enforce:
Diet constraints (Vegetarian, Vegan, etc.).
Allergens (never include them).
Disliked ingredients (best-effort soft constraint).
Diet/allergen constraints always override extra instructions.
If adaptation is impossible (e.g., strict diet vs. recipe type):
Show inline message near the Adapt button:
“This recipe can’t be adapted to your preferences. Try a different recipe or adjust your preferences.”
Do not generate a low-quality or partial adaptation.
If recipe input format/units are problematic:
Inform user the recipe should be fixed; do not generate anything.
Since no editing is allowed, user would have to re-create the recipe correctly.
Output Format & Tone
Output:
Follow consistent schema in AI prompts:
Title, servings, prep time, cook time, ingredients list, steps.
Ingredients as a clear list; steps in text but structured logically.
Units: metric target; when pasted recipes use imperial, system will not auto-convert in MVP and will instead inform the user the recipe should be fixed (no adaptation).
“What changed”:
Short, concise summary of key changes (1–3 bullets).
Collapsed by default with a “Show what changed” link.
Expansion state remembered while user stays on the page.
Style:
Concise, neutral, instruction-focused.
No chatty tone.
Errors & Failures
Generic AI failure (timeout/provider error):
Visible loading indicator.
Timeout ~10–15 seconds.
Friendly error message:
“We couldn’t adapt this recipe right now. Please try again in a moment.”
Simple “Try again” option.
AI provider:
Third-party is acceptable.
You’re comfortable with sending recipes/preferences to provider.
Preference (not strictly enforced in MVP) to opt out of provider training if possible.
8. Disclaimers & Legal
Not a medical app:
Clear disclaimer:
On landing page.
Near/under the “Adapt recipe” area.
Example: “This app does not provide medical advice.”
No explicit age gating or legal text beyond standard terms/privacy as needed (no strict requirements defined).
9. Metrics & Evaluation
Key success criteria:
90% of users have completed dietary preferences.
Completed = at least one diet selected (including “Classic”) + allergen section confirmed (even if none).
75% of users generate one or more recipes per calendar week.
Denominator: users with completed preferences.
“Per week”: calendar week definition (not rolling 7-day).
Measurement:
No analytics tool in MVP.
You’ll run manual DB queries ad hoc:
Count users with completed preferences.
Count AI adaptations per week.
10. Other UX & Content
Landing page:
Headline focused on personalization:
Example: “Recipes that fit your life.”
Tagline: “Recipes that fit your life.”
Messaging: “quickly adapt recipes to your tastes and diet.”
Simple “How it works” (3 steps).
Single primary CTA: “Sign up.”
Colors: light green + white.
Branding:
Minimal: simple text logo (“HealthyMeal” or similar) plus color scheme above.
No strict design system beyond basic consistency.
Support:
No in-app support or contact channel in MVP.
Data retention:
Keep accounts and data indefinitely for now (until manual deletion by user).
Backups:
No explicit backups or recovery procedures in MVP.
Non-functional:
Support latest two major versions of modern browsers on mobile and desktop.
No explicit performance SLAs beyond the AI timeout.
11. Testing Focus
Top concerns:
AI correctness (respect diets, allergens, dislikes).
Simplicity of flows (sign-up → preferences → create/paste → adapt).
Manual test suite:
10–20 recipes with:
Coverage of each diet type.
Coverage of each allergen (recipes that contain them).
“Hard cases” like cheese-heavy recipe for Vegan, etc.
Acceptance criteria:
0 critical violations (no allergens, no diet breaks).
<10–20% minor issues (e.g., imperfect substitutions).