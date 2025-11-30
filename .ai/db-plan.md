# HealthyMeal – PostgreSQL Schema (Supabase)

---

## 1. List of tables, types, and columns

### 1.1. Custom types & extensions

```sql
-- UUID generation (Supabase typically enables this)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Diet type ENUM (can be extended later if needed)
CREATE TYPE public.diet_type AS ENUM (
  'omnivore',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'low_carb',
  'low_fat',
  'mediterranean',
  'other'
);
```
### 1.2. Reference table (managed by Supabase)
auth.users (reference only, not managed by this schema)
Managed by Supabase Auth. Shown here only to document relationships.

Relevant columns:

id UUID PRIMARY KEY – user identifier, referenced by public.profiles.user_id
email TEXT – used in UI (profile view, login)
plus other Supabase-auth managed columns (password hash, created_at, etc.)
### 1.3. Application tables (schema public)
#### 1.3.1. public.profiles
One-to-one profile row per auth.users record. Serves as anchor for domain data and RLS.
```sql
CREATE TABLE public.profiles (
  user_id    UUID PRIMARY KEY
             REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
Constraints:

user_id is both PK and FK to auth.users(id) – guarantees max. one profile per auth user.
Timestamps stored in UTC (via server setting).
#### 1.3.2. public.dietary_preferences
One-to-one dietary preferences per profile/user. Row exists even if all fields are NULL → “no preferences set yet”.
```sql
CREATE TABLE public.dietary_preferences (
  user_id             UUID PRIMARY KEY
                      REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  diet_type           public.diet_type NULL,
  allergies           TEXT[] NULL,
  disliked_ingredients TEXT[] NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
Notes:

diet_type is a single value for MVP (can be expanded later if multi-diet support is needed).
allergies and disliked_ingredients are free-form text arrays (e.g. '{gluten,dairy}').
#### 1.3.3. public.recipes
Core table for both user-created and AI-modified recipes.

```sql
CREATE TABLE public.recipes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL
                   REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  ingredients      TEXT NOT NULL,
  instructions     TEXT NOT NULL,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  parent_recipe_id UUID NULL
                   REFERENCES public.recipes (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recipes_title_length_chk
    CHECK (char_length(title) <= 200),
  CONSTRAINT recipes_content_length_chk
    CHECK (char_length(ingredients) + char_length(instructions) <= 10000)
);
```
Notes:

owner_id → recipe owner (per-user privacy).
is_ai_generated = TRUE for AI-adapted recipes.
parent_recipe_id points to the original recipe when AI created this one (NULL for originals).
Hard delete only; no soft-delete flag.
#### 1.3.4. public.recipe_ai_metadata
Metadata about AI-generated recipes: explanation, model, provider, raw response, etc.

```sql
CREATE TABLE public.recipe_ai_metadata (
  recipe_id      UUID PRIMARY KEY
                 REFERENCES public.recipes (id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL
                 REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  model          TEXT NOT NULL,
  provider       TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generation_duration INTEGER NOT NULL,
  raw_response   JSONB NOT NULL
);
```
Notes:

Exactly zero or one metadata row per recipe (enforced by PRIMARY KEY (recipe_id)).
Only AI-generated recipes are expected to have a metadata row, but the table does not enforce that; app logic does.
owner_id duplicates recipes.owner_id to simplify RLS checks and per-user queries.
## 2. Relationships between tables
auth.users ↔ profiles

auth.users.id (PK) → profiles.user_id (PK, FK)
Cardinality: 1:1
On delete user: cascade delete profile (and all dependent data via further cascades).
profiles ↔ dietary_preferences

profiles.user_id (PK) → dietary_preferences.user_id (PK, FK)
Cardinality: 1:1
On delete profile: cascade delete dietary preferences.
profiles ↔ recipes

profiles.user_id (PK) → recipes.owner_id (FK)
Cardinality: 1:N (one profile, many recipes)
On delete profile: cascade delete all recipes.
recipes ↔ recipes (self-relation)

recipes.id (PK) → recipes.parent_recipe_id (FK)
Cardinality: 1:N (one original recipe, many AI-derived variants)
On delete original: parent_recipe_id in children set to NULL.
recipes ↔ recipe_ai_metadata

recipes.id (PK) → recipe_ai_metadata.recipe_id (PK, FK)
Cardinality: 1:0..1 (one recipe may have one metadata record, typically AI-only)
On delete recipe: cascade delete metadata.
profiles ↔ recipe_ai_metadata

profiles.user_id (PK) → recipe_ai_metadata.owner_id (FK)
Cardinality: 1:N (one profile, many AI metadata rows)
On delete profile: cascade delete recipe_ai_metadata (via this FK and/or via recipes).
## 3. Indexes
All tables get implicit indexes on primary keys.

### 3.1. Explicit indexes
-- Recipe list for a user, ordered by most recent
CREATE INDEX idx_recipes_owner_created_at_desc
  ON public.recipes (owner_id, created_at DESC);

-- Query AI-variants of a recipe by parent_recipe_id
CREATE INDEX idx_recipes_parent_recipe_id
  ON public.recipes (parent_recipe_id);
(Other PK/FK-based indexes are implicit or not needed in the MVP.)

## 4. PostgreSQL Row-Level Security (RLS) Policies
All RLS policies assume Supabase’s auth.uid() returns auth.users.id of the logged-in user.

### 4.1. public.profiles
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can see only their own profile
CREATE POLICY "Profiles select own"
  ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own profile row (if done from client)
CREATE POLICY "Profiles insert own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "Profiles update own"
  ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No DELETE policy: users cannot delete their profile directly.
-- Admin/service role can bypass RLS if needed.
```
### 4.2. public.dietary_preferences
```sql
ALTER TABLE public.dietary_preferences ENABLE ROW LEVEL SECURITY;

-- Users can see only their own dietary preferences
CREATE POLICY "Dietary prefs select own"
  ON public.dietary_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow insert for own record (normally created via trigger or backend)
CREATE POLICY "Dietary prefs insert own"
  ON public.dietary_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own preferences
CREATE POLICY "Dietary prefs update own"
  ON public.dietary_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No DELETE policy: users cannot delete preferences row (it is tied 1:1 to profile).
```

### 4.3. public.recipes
```sql
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Users can view only their own recipes
CREATE POLICY "Recipes select own"
  ON public.recipes
  FOR SELECT
  USING (owner_id = auth.uid());

-- Users can insert recipes only for themselves
CREATE POLICY "Recipes insert own"
  ON public.recipes
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update only their own recipes
CREATE POLICY "Recipes update own"
  ON public.recipes
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete only their own recipes
CREATE POLICY "Recipes delete own"
  ON public.recipes
  FOR DELETE
  USING (owner_id = auth.uid());
```
### 4.4. public.recipe_ai_metadata
```sql
ALTER TABLE public.recipe_ai_metadata ENABLE ROW LEVEL SECURITY;

-- Users can view only metadata for their own recipes
CREATE POLICY "AI metadata select own"
  ON public.recipe_ai_metadata
  FOR SELECT
  USING (owner_id = auth.uid());

-- Users can insert metadata only for recipes they own
CREATE POLICY "AI metadata insert own"
  ON public.recipe_ai_metadata
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.recipes r
      WHERE r.id = recipe_ai_metadata.recipe_id
        AND r.owner_id = auth.uid()
    )
  );

-- Users can update only their own metadata rows
CREATE POLICY "AI metadata update own"
  ON public.recipe_ai_metadata
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete only their own metadata rows
CREATE POLICY "AI metadata delete own"
  ON public.recipe_ai_metadata
  FOR DELETE
  USING (owner_id = auth.uid());
```
## 5. Additional notes & design decisions
### 5.1. Timestamps and optimistic concurrency
Common trigger function:
```sql
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
Apply at least to recipes (and optionally to other tables):

CREATE TRIGGER set_timestamp_recipes
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Optional (nice-to-have) for consistency:
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_dietary_prefs
BEFORE UPDATE ON public.dietary_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_recipe_ai_metadata
BEFORE UPDATE ON public.recipe_ai_metadata
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();
Application-side optimistic locking for recipe editing (US‑027):

When updating a recipe, the client sends id and the last known updated_at.

Update is performed with a predicate such as:

UPDATE public.recipes
SET title = $1,
    ingredients = $2,
    instructions = $3
WHERE id = $4
  AND updated_at = $5;
If no rows are affected, the app detects a concurrent modification and warns the user.
```
### 5.2. Automatic creation of profile row
To guarantee exactly one profile row per user (and avoid checking for existence in app code), a trigger can create it on profile insert:
```sql
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_after_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();
```
### 5.3. Automatic creation of dietary_preferences row
To guarantee exactly one preferences row per profile (and avoid checking for existence in app code), a trigger can create it on profile insert:
```sql
CREATE OR REPLACE FUNCTION public.create_dietary_preferences_for_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.dietary_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_dietary_preferences_after_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_dietary_preferences_for_profile();
```
This matches the planning decision that an “empty” row (all preference fields NULL) signifies no preferences set yet.

### 5.4. Character limits and validation
Recipe title limit (200 chars) and content limit (10,000 chars across ingredients + instructions) are enforced via CHECK constraints.
Frontend should also enforce and show friendly validation messages based on these limits.
Arrays (allergies, disliked_ingredients) do not enforce value vocabularies; AI prompt building logic can normalize values if needed.
### 5.5. Metrics & analytics
Many product metrics in the PRD can be computed from existing tables:
Dietary Preferences Completion Rate: users with non-NULL diet_type or non-empty allergies / disliked_ingredients vs total profiles.
AI Modification Usage & Save Rate: via recipes.is_ai_generated, recipes.parent_recipe_id, and presence of recipe_ai_metadata.
No dedicated user_events or analytics tables are included in MVP; can be added later if more detailed tracking is required.
### 5.6. AI error logging (US‑020)
The PRD’s requirement “System logs technical errors for troubleshooting” is assumed to be met via application / infrastructure logs (e.g., Supabase logs, application logging).
If DB-level error logging is later desired, a simple ai_error_logs table (request, error message, user_id, timestamps) can be added without impacting current schema.
### 5.7. Security
All user-specific tables (profiles, dietary_preferences, recipes, recipe_ai_metadata) have strict per-user RLS based on auth.uid().
No sensitive data is stored in cleartext beyond what is necessary for the app’s operation; most sensitive authentication data remains in auth.users.
Column-level encryption is intentionally not used in MVP; platform/disk-level encryption and RLS are considered sufficient at this stage.