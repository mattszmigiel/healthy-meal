### Backend and Database
- Use Supabase for backend services (authentication, database)
- Validate API input with Zod schemas
- **In Astro routes**: Access Supabase from `context.locals.supabase` (not direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts` (not from `@supabase/supabase-js`)
- Extract business logic into services in `src/lib/services`
