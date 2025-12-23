import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

/**
 * Creates a mock Supabase client for testing
 * This is a basic mock - extend as needed for your specific tests
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    } as unknown,
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  } as unknown as Partial<SupabaseClient>;
}

/**
 * Creates a mock APIContext for testing API routes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockAPIContext(overrides: any = {}) {
  return {
    request: new Request("http://localhost:3000/api/test", {
      method: "GET",
      ...overrides.request,
    }),
    locals: {
      supabase: createMockSupabaseClient(),
      ...overrides.locals,
    },
    params: {},
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    },
    ...overrides,
  };
}

/**
 * Helper to parse JSON response
 */
export async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
