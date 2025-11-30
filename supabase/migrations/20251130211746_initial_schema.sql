-- ============================================================================
-- Migration: Initial HealthyMeal Schema
-- ============================================================================
-- Purpose: Create the complete database schema for HealthyMeal application
-- Affected: Creates all core tables (profiles, dietary_preferences, recipes,
--           recipe_ai_metadata), custom types, RLS policies, indexes, and triggers
-- Author: System
-- Date: 2025-11-30
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Enable pgcrypto for UUID generation (gen_random_uuid)
create extension if not exists "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================
-- Diet type enumeration for dietary preferences
-- Can be extended later to support additional diet types
create type public.diet_type as enum (
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

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: public.profiles
-- ----------------------------------------------------------------------------
-- Purpose: One-to-one profile row per auth.users record
-- Notes:
--   - Serves as anchor for all user domain data
--   - Used as basis for RLS policies across the application
--   - Automatically created via trigger when auth.users record is created
-- ----------------------------------------------------------------------------
create table public.profiles (
  user_id    uuid primary key
             references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles table
-- Required: All Supabase tables must have RLS enabled for security
alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- Table: public.dietary_preferences
-- ----------------------------------------------------------------------------
-- Purpose: One-to-one dietary preferences per user
-- Notes:
--   - Row exists even if all preference fields are NULL (indicates no prefs set)
--   - Automatically created via trigger when profiles record is created
--   - allergies and disliked_ingredients are free-form text arrays
-- ----------------------------------------------------------------------------
create table public.dietary_preferences (
  user_id             uuid primary key
                      references public.profiles (user_id) on delete cascade,
  diet_type           public.diet_type null,
  allergies           text[] null,
  disliked_ingredients text[] null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Enable RLS on dietary_preferences table
alter table public.dietary_preferences enable row level security;

-- ----------------------------------------------------------------------------
-- Table: public.recipes
-- ----------------------------------------------------------------------------
-- Purpose: Core table for user-created and AI-modified recipes
-- Notes:
--   - owner_id: FK to profiles, ensures per-user privacy
--   - is_ai_generated: TRUE for AI-adapted recipes
--   - parent_recipe_id: Points to original recipe when AI created a variant
--   - Hard delete only (no soft-delete flag)
--   - Character limits enforced via CHECK constraints
-- ----------------------------------------------------------------------------
create table public.recipes (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null
                   references public.profiles (user_id) on delete cascade,
  title            text not null,
  ingredients      text not null,
  instructions     text not null,
  is_ai_generated  boolean not null default false,
  parent_recipe_id uuid null
                   references public.recipes (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Constraint: Recipe title cannot exceed 200 characters
  constraint recipes_title_length_chk
    check (char_length(title) <= 200),

  -- Constraint: Total content (ingredients + instructions) cannot exceed 10,000 characters
  constraint recipes_content_length_chk
    check (char_length(ingredients) + char_length(instructions) <= 10000)
);

-- Enable RLS on recipes table
alter table public.recipes enable row level security;

-- ----------------------------------------------------------------------------
-- Table: public.recipe_ai_metadata
-- ----------------------------------------------------------------------------
-- Purpose: Metadata about AI-generated recipes
-- Notes:
--   - One-to-zero-or-one relationship with recipes (only AI recipes have metadata)
--   - owner_id duplicates recipes.owner_id to simplify RLS checks
--   - raw_response stores the complete AI provider response as JSONB
--   - generation_duration stored in milliseconds
-- ----------------------------------------------------------------------------
create table public.recipe_ai_metadata (
  recipe_id           uuid primary key
                      references public.recipes (id) on delete cascade,
  owner_id            uuid not null
                      references public.profiles (user_id) on delete cascade,
  model               text not null,
  provider            text not null,
  created_at          timestamptz not null default now(),
  generation_duration integer not null,
  raw_response        jsonb not null
);

-- Enable RLS on recipe_ai_metadata table
alter table public.recipe_ai_metadata enable row level security;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index: Recipe list for a user, ordered by most recent
-- Used by: Recipe list queries with ORDER BY created_at DESC
create index idx_recipes_owner_created_at_desc
  on public.recipes (owner_id, created_at desc);

-- Index: Query AI-variants of a recipe by parent_recipe_id
-- Used by: Finding all AI-generated variants of an original recipe
create index idx_recipes_parent_recipe_id
  on public.recipes (parent_recipe_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies: public.profiles
-- ----------------------------------------------------------------------------
-- Security model: Users can only access their own profile
-- No DELETE policy: users cannot delete their profile directly (admin only)
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to select their own profile
create policy "Profiles select own"
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Allow authenticated users to insert their own profile
-- Note: Typically created via trigger, but policy allows client-side creation
create policy "Profiles insert own"
  on public.profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Allow authenticated users to update their own profile
create policy "Profiles update own"
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies: public.dietary_preferences
-- ----------------------------------------------------------------------------
-- Security model: Users can only access their own dietary preferences
-- No DELETE policy: preferences row is tied 1:1 to profile
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to select their own dietary preferences
create policy "Dietary prefs select own"
  on public.dietary_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Allow authenticated users to insert their own dietary preferences
-- Note: Typically created via trigger, but policy allows client-side creation
create policy "Dietary prefs insert own"
  on public.dietary_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Allow authenticated users to update their own dietary preferences
create policy "Dietary prefs update own"
  on public.dietary_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies: public.recipes
-- ----------------------------------------------------------------------------
-- Security model: Users can only access recipes they own
-- Full CRUD operations allowed for own recipes
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to select their own recipes
create policy "Recipes select own"
  on public.recipes
  for select
  to authenticated
  using (owner_id = auth.uid());

-- Policy: Allow authenticated users to insert recipes for themselves
create policy "Recipes insert own"
  on public.recipes
  for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Policy: Allow authenticated users to update their own recipes
create policy "Recipes update own"
  on public.recipes
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Policy: Allow authenticated users to delete their own recipes
create policy "Recipes delete own"
  on public.recipes
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS Policies: public.recipe_ai_metadata
-- ----------------------------------------------------------------------------
-- Security model: Users can only access metadata for recipes they own
-- Additional check on insert to ensure recipe belongs to user
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to select metadata for their own recipes
create policy "AI metadata select own"
  on public.recipe_ai_metadata
  for select
  to authenticated
  using (owner_id = auth.uid());

-- Policy: Allow authenticated users to insert metadata for their own recipes
-- Extra validation: Ensures the recipe_id references a recipe owned by the user
create policy "AI metadata insert own"
  on public.recipe_ai_metadata
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.recipes r
      where r.id = recipe_ai_metadata.recipe_id
        and r.owner_id = auth.uid()
    )
  );

-- Policy: Allow authenticated users to update their own metadata
create policy "AI metadata update own"
  on public.recipe_ai_metadata
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Policy: Allow authenticated users to delete their own metadata
create policy "AI metadata delete own"
  on public.recipe_ai_metadata
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: public.set_timestamp()
-- ----------------------------------------------------------------------------
-- Purpose: Automatically update updated_at timestamp on row updates
-- Used by: Triggers on all tables with updated_at column
-- ----------------------------------------------------------------------------
create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger: Auto-update updated_at on recipes table
create trigger set_timestamp_recipes
before update on public.recipes
for each row
execute function public.set_timestamp();

-- Trigger: Auto-update updated_at on profiles table
create trigger set_timestamp_profiles
before update on public.profiles
for each row
execute function public.set_timestamp();

-- Trigger: Auto-update updated_at on dietary_preferences table
create trigger set_timestamp_dietary_prefs
before update on public.dietary_preferences
for each row
execute function public.set_timestamp();

-- Trigger: Auto-update updated_at on recipe_ai_metadata table
create trigger set_timestamp_recipe_ai_metadata
before update on public.recipe_ai_metadata
for each row
execute function public.set_timestamp();

-- ----------------------------------------------------------------------------
-- Function: public.create_profile_for_user()
-- ----------------------------------------------------------------------------
-- Purpose: Automatically create a profile row when a new user is created
-- Notes:
--   - Ensures 1:1 relationship between auth.users and profiles
--   - Uses ON CONFLICT DO NOTHING for idempotency
--   - Eliminates need for existence checks in application code
-- ----------------------------------------------------------------------------
create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger: Auto-create profile when auth.users record is created
create trigger create_profile_after_user_insert
after insert on auth.users
for each row
execute function public.create_profile_for_user();

-- ----------------------------------------------------------------------------
-- Function: public.create_dietary_preferences_for_profile()
-- ----------------------------------------------------------------------------
-- Purpose: Automatically create dietary_preferences row when profile is created
-- Notes:
--   - Ensures 1:1 relationship between profiles and dietary_preferences
--   - Empty row (all NULL fields) indicates no preferences set yet
--   - Uses ON CONFLICT DO NOTHING for idempotency
-- ----------------------------------------------------------------------------
create or replace function public.create_dietary_preferences_for_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.dietary_preferences (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger: Auto-create dietary_preferences when profile is created
create trigger create_dietary_preferences_after_profile_insert
after insert on public.profiles
for each row
execute function public.create_dietary_preferences_for_profile();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
