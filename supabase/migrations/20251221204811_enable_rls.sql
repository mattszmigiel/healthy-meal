-- ============================================================================
-- Migration: Enable Row Level Security (RLS)
-- ============================================================================
-- Purpose: Enable RLS and create policies for all tables to enforce per-user
--          data isolation based on authenticated user sessions
-- Affected: profiles, dietary_preferences, recipes, recipe_ai_metadata
-- Author: System
-- Date: 2025-12-21
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ai_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile (handled by trigger, but allow explicit insert)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DIETARY PREFERENCES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own dietary preferences
CREATE POLICY "Users can view own dietary preferences"
  ON public.dietary_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own dietary preferences
CREATE POLICY "Users can update own dietary preferences"
  ON public.dietary_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own dietary preferences (handled by trigger, but allow explicit insert)
CREATE POLICY "Users can insert own dietary preferences"
  ON public.dietary_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RECIPES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own recipes
CREATE POLICY "Users can view own recipes"
  ON public.recipes
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON public.recipes
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON public.recipes
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- RECIPE AI METADATA TABLE POLICIES
-- ============================================================================

-- Policy: Users can view AI metadata for their own recipes
CREATE POLICY "Users can view own recipe AI metadata"
  ON public.recipe_ai_metadata
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert AI metadata for their own recipes
CREATE POLICY "Users can insert own recipe AI metadata"
  ON public.recipe_ai_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update AI metadata for their own recipes
CREATE POLICY "Users can update own recipe AI metadata"
  ON public.recipe_ai_metadata
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Policy: Users can delete AI metadata for their own recipes
CREATE POLICY "Users can delete own recipe AI metadata"
  ON public.recipe_ai_metadata
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
