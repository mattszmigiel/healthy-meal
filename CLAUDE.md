# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- Astro 5 - Modern web framework with SSR enabled (output: "server")
- TypeScript 5 - Type-safe JavaScript
- React 19 - UI library for interactive components
- Tailwind CSS 4 - Utility-first CSS framework
- Shadcn/ui - Component library
- Node.js adapter (standalone mode) - For server-side rendering

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
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints (use `export const prerender = false`)
- `./src/middleware/index.ts` - Astro middleware for request/response modification
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components (Astro for static, React for dynamic)
- `./src/components/ui` - Shadcn/ui components
- `./src/components/hooks` - Custom React hooks
- `./src/lib` - Services and helpers
- `./src/lib/services` - Business logic extracted from API routes
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
- Validate API input with Zod schemas
- **In Astro routes**: Access Supabase from `context.locals.supabase` (not direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts` (not from `@supabase/supabase-js`)
- Extract business logic into services in `src/lib/services`

## Git Hooks

Pre-commit hook runs `lint-staged`:
- Auto-fixes ESLint issues on `*.{ts,tsx,astro}` files
- Auto-formats `*.{json,css,md}` files with Prettier

## Important Notes

- Server runs on port 3000 by default
- Project uses SSR mode (`output: "server"`)
- Uses Node.js adapter in standalone mode
- Sitemap integration enabled
- Lint before committing (enforced by husky + lint-staged)
