import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";
import type { APIContext } from "astro";

interface RequestOverrides {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

interface MockAPIContextOverrides {
  request?: RequestOverrides;
  locals?: Partial<APIContext["locals"]>;
  params?: Record<string, string>;
  cookies?: Partial<APIContext["cookies"]>;
}

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
      exchangeCodeForSession: vi.fn(),
      updateUser: vi.fn(),
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
export function createMockAPIContext(overrides: MockAPIContextOverrides = {}) {
  // Build Request init options
  const requestInit: RequestInit = {
    method: overrides.request?.method || "GET",
  };

  // Add body if provided
  if (overrides.request?.body) {
    requestInit.body = overrides.request.body;
  }

  // Add headers if provided
  if (overrides.request?.headers) {
    requestInit.headers = overrides.request.headers;
  }

  return {
    request: new Request("http://localhost:3000/api/test", requestInit),
    locals: {
      supabase: createMockSupabaseClient(),
      ...overrides.locals,
    },
    params: overrides.params || {},
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    },
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
