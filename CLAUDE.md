# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- Astro 5 - Modern web framework with SSR enabled (output: "server")
- TypeScript 5 - Type-safe JavaScript
- React 19 - UI library for interactive components
- Tailwind CSS 4 - Utility-first CSS framework
- Shadcn/ui - Component library built on Radix UI
- Node.js adapter (standalone mode) - For server-side rendering
- Supabase - PostgreSQL database with authentication and Row-Level Security (RLS)
- Zod - Schema validation for API requests/responses
- OpenRouter API - AI integration for recipe modification (currently using gpt-4o-mini)
- React Hook Form - Form state management with Zod validation integration
- Sonner - Toast notification system
- Lucide React - Icon library

## Development Commands

```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Project Structure

The project follows a strict directory organization:

- `./src` - source code
- `./src/layouts` - Astro layouts (Layout.astro, LandingLayout.astro, AuthenticatedLayout.astro)
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints (use `export const prerender = false`)
  - API routes follow pattern: `/api/recipes.ts` (collection), `/api/recipes/[id].ts` (single resource)
- `./src/middleware/index.ts` - Astro middleware that injects Supabase client into `context.locals.supabase`
- `./src/db` - Supabase clients and types
  - `database.types.ts` - Auto-generated Supabase types
  - `supabase.client.ts` - Singleton Supabase client
- `./src/types.ts` - **Central type definitions** for ALL entities, DTOs, ViewModels, Commands, and component props
- `./src/components` - Client-side components (Astro for static, React for dynamic)
  - `./src/components/ui` - Shadcn/ui components
  - `./src/components/hooks` - Custom React hooks
  - `./src/components/auth` - Authentication forms (LoginForm, RegisterForm, etc.)
  - `./src/components/navigation` - Navigation components (GlobalNav, UserMenu, etc.)
  - `./src/components/profile` - Profile management components
  - `./src/components/recipes` - Recipe management components
- `./src/lib` - Services and helpers
  - `./src/lib/services` - Business logic extracted from API routes (RecipeService, AIPreviewService, etc.)
  - `./src/lib/schemas` - Zod validation schemas for all API endpoints
  - `./src/lib/utils` - Utility functions (logger, api-responses, rate-limiter)
- `./src/styles` - Global styles (global.css with Tailwind directives)
- `./src/assets` - Static internal assets
- `./public` - Public assets

**Path alias**: Use `@/*` for imports (resolves to `./src/*`)

## Coding Practices

### Error Handling Pattern
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions (avoid deeply nested if statements)
- Place the happy path last in the function
- Avoid unnecessary else statements; use if-return pattern instead
- Use guard clauses for preconditions and invalid states
- Implement proper error logging and user-friendly error messages

### Component Guidelines

**Astro Components** (`.astro`):
- Use for static content and layout
- Leverage Server Endpoints for API routes
- Use uppercase format for endpoint handlers: `GET`, `POST`, etc.
- Use `export const prerender = false` for API routes
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`
- Use View Transitions API with ClientRouter for smooth page transitions

**React Components** (`.tsx`):
- Use functional components with hooks (never class components)
- **NEVER use "use client"** or other Next.js directives (this is Astro, not Next.js)
- Extract logic into custom hooks in `src/components/hooks`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` and `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for generating unique accessibility IDs
- Use `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates

### Styling with Tailwind
- Use `@layer` directive to organize styles (components, utilities, base)
- Use arbitrary values with square brackets: `w-[123px]`
- Implement dark mode with `dark:` variant
- Use responsive variants: `sm:`, `md:`, `lg:`, etc.
- Use state variants: `hover:`, `focus-visible:`, `active:`, etc.
- Access Tailwind theme values in CSS with `theme()` function

### Accessibility Requirements
- Use ARIA landmarks (main, navigation, search, etc.)
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions with appropriate politeness settings
- Apply `aria-hidden` to decorative content
- Use `aria-label` or `aria-labelledby` for elements without visible labels
- Use `aria-describedby` for descriptive text associations
- Apply `aria-current` for indicating current item in navigation
- Avoid redundant ARIA that duplicates native HTML semantics

### Backend and Database
- Use Supabase for backend services (authentication, database)
- Validate API input with Zod schemas defined in `src/lib/schemas`
- **In Astro routes**: Access Supabase from `context.locals.supabase` (injected by middleware, not direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts` (not from `@supabase/supabase-js`)
- Extract business logic into services in `src/lib/services`
- Services follow dependency injection pattern: pass `locals.supabase` to constructor
- All types (entities, DTOs, commands) must be defined in central `src/types.ts` file

### API Route Pattern
```typescript
// File: src/pages/api/recipes.ts
export const prerender = false; // Required for dynamic API routes

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Validate input with Zod schema
  const body = await request.json();
  const validationResult = createRecipeSchema.safeParse(body);

  if (!validationResult.success) {
    return apiError("Invalid request body", 400);
  }

  // 2. Instantiate service with Supabase client from locals
  const service = new RecipeService(locals.supabase);

  // 3. Execute business logic
  const result = await service.createRecipe(userId, validationResult.data);

  // 4. Return standardized response
  return apiSuccess(result, 201);
};
```

### Service Layer Pattern
- Services handle all business logic and database operations
- Each service is instantiated with Supabase client dependency
- Services throw specific errors that API routes catch and transform to user-friendly responses
- Example: `RecipeService`, `AIPreviewService`, `DietaryPreferencesService`

### Type System Organization
**All types centralized in `src/types.ts`:**
- **Entities**: Domain models (User, Recipe, RecipeAIMetadata, DietaryPreferences)
- **DTOs**: API response types (ProfileDTO, RecipeResponseDTO, RecipeListResponseDTO)
- **Commands**: API request types (CreateRecipeCommand, UpdateDietaryPreferencesCommand)
- **ViewModels**: Complex UI state (RecipeDetailViewModel, RecipeListViewModel)
- **Component Props**: React component prop types (RecipeFormProps, RecipeCardProps)

### Authentication
- Supabase handles authentication with email/password
- Row-Level Security (RLS) enforces data isolation per user
- Currently using hardcoded DEFAULT_USER for development: `ce4988b8-5c26-4741-b5c3-fd372088ed89`
- Access user session via `locals.supabase.auth.getUser()`

## Git Hooks

Pre-commit hook runs `lint-staged`:
- Auto-fixes ESLint issues on `*.{ts,tsx,astro}` files
- Auto-formats `*.{json,css,md}` files with Prettier

## AI Integration (OpenRouter)

The app uses OpenRouter API for AI-powered recipe modification:

- **Service**: `src/lib/services/openrouter/openrouter.service.ts`
- **Current Model**: `gpt-4o-mini` (configurable via environment)
- **Features**: Retry logic, error handling, structured output validation
- **Use Case**: Modify recipes based on user dietary preferences
- **Architecture**: Modular service with separate validation, transformation, and helper modules

### AI Preview Flow
1. User requests recipe modification on recipe detail page
2. Frontend calls `/api/recipes/[id]/ai-preview` endpoint
3. API route validates request and fetches recipe + dietary preferences
4. `AIPreviewService` constructs prompt with recipe data and preferences
5. OpenRouter processes request and returns modified recipe
6. Response validated with Zod schema and returned to client
7. User can save AI-modified version as new recipe

## Data Flow Architecture

### Adding a New Feature (Standard Pattern)
1. Define types in `src/types.ts` (Entity, DTO, Command, Props)
2. Create Zod validation schema in `src/lib/schemas/`
3. Create service class in `src/lib/services/` with business logic
4. Create API route in `src/pages/api/` following the API Route Pattern
5. Create React components in `src/components/` (if needed)
6. Create custom hook in `src/components/hooks/` for complex client state (if needed)

### Request Flow
```
Astro Page (SSR)
  ↓ Server-side data fetch
React Component (receives initial data as props)
  ↓ User interaction (form submit, button click)
API Route (validates with Zod)
  ↓ Instantiates service with locals.supabase
Service Layer (executes business logic)
  ↓ Database operations via Supabase
Response (standardized DTO)
  ↓ Updates client state
React Component (re-renders)
```

## Important Notes

- Server runs on port 3000 by default
- Project uses SSR mode (`output: "server"`)
- Uses Node.js adapter in standalone mode
- Sitemap integration enabled
- Lint before committing (enforced by husky + lint-staged)
- All environment variables accessed via `import.meta.env`
- View Transitions API enabled for smooth client-side navigation
- React Compiler plugin available for optimization hints
