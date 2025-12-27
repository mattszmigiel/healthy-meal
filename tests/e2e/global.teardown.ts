import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

async function globalTeardown() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY environment variables must be set");
  }

  if (!testEmail || !testPassword) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
  }

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Sign in as the test user to get their ID
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to authenticate test user: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // Delete all recipes owned by the test user
  const { error: deleteError } = await supabase.from("recipes").delete().eq("owner_id", userId);

  if (deleteError) {
    throw new Error(`Failed to delete recipes: ${deleteError.message}`);
  }

  // Sign out
  await supabase.auth.signOut();

  console.log("✓ All test recipes cleaned up successfully");
}

export default globalTeardown;
