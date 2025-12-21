import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/",
  "/login",
  "/register",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
];

// Helper to check if path is an API route
const isApiRoute = (pathname: string) => pathname.startsWith("/api/");

// Helper to check if path is an auth page
const isAuthPage = (pathname: string) =>
  pathname === "/login" || pathname === "/register" || pathname === "/reset-password";

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance with cookies
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store Supabase client in locals
  locals.supabase = supabase;

  // Extract user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Populate locals with user and session
  locals.user = user;
  locals.session = session;

  // Skip protection for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    // If user is authenticated and trying to access auth pages, redirect to /recipes
    if (user && isAuthPage(url.pathname)) {
      return redirect("/recipes");
    }
    return next();
  }

  // Handle authenticated users
  if (user) {
    return next();
  }

  // Handle unauthenticated users
  // API routes: Let them handle their own responses
  if (isApiRoute(url.pathname)) {
    return next();
  }

  // Page routes: Redirect to login with returnUrl
  const returnUrl = url.pathname + url.search;
  return redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
});
