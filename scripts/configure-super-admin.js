#!/usr/bin/env node

/**
 * Super Admin Configuration Script (M2)
 *
 * This script safely configures the super admin user who cannot be demoted.
 * Run this once during initial deployment or when changing super admin.
 *
 * Usage: npm run admin:configure
 *
 * SECURITY NOTE:
 * - Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * - Only use this key server-side, NEVER in client code
 * - Store service role key in secure environment variables only
 */

import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureSuperAdmin() {
  console.log("\n🔒 Super Admin Configuration Tool\n");
  console.log(
    "This will set the user who cannot be demoted from admin status.\n"
  );

  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error(
      "❌ Error: VITE_SUPABASE_URL not found in environment variables"
    );
    console.error("   Make sure .env.local is properly configured");
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error(
      "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables"
    );
    console.error("   This is required to configure super admin");
    console.error(
      "   Get this from: https://app.supabase.com/project/YOUR_PROJECT/settings/api"
    );
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("✅ Connected to Supabase\n");

  // Get user ID from input
  const userId = await question("Enter super admin user ID (UUID): ");

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId.trim())) {
    console.error("❌ Error: Invalid UUID format");
    console.error("   Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    rl.close();
    process.exit(1);
  }

  // Verify user exists
  console.log("\n🔍 Verifying user...");
  const { data: authUser, error: authError } =
    await supabase.auth.admin.getUserById(userId.trim());

  if (authError || !authUser) {
    console.error("❌ Error: User not found in auth.users");
    console.error("   Make sure the user has completed signup");
    rl.close();
    process.exit(1);
  }

  console.log(`✅ Found user: ${authUser.user.email}`);

  // Verify user has a profile and is an admin
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_admin, created_at")
    .eq("user_id", userId.trim())
    .single();

  if (profileError) {
    console.error("❌ Error: User profile not found");
    console.error("   The user must have logged in at least once");
    rl.close();
    process.exit(1);
  }

  if (!profile.is_admin) {
    console.error("❌ Error: User is not currently an admin");
    console.error("   Please make them an admin first, then run this script");
    rl.close();
    process.exit(1);
  }

  console.log("✅ User is an admin\n");

  // Confirm action
  const confirm = await question(
    `⚠️  This will set ${authUser.user.email} as the SUPER ADMIN.\n   They will NOT be able to be demoted by other admins.\n   Continue? (yes/no): `
  );

  if (confirm.toLowerCase() !== "yes") {
    console.log("❌ Operation cancelled");
    rl.close();
    process.exit(0);
  }

  console.log("\n🔧 Setting super admin...");

  // Call the set_super_admin function
  const { error: rpcError } = await supabase.rpc("set_super_admin", {
    new_super_admin_id: userId.trim(),
  });

  if (rpcError) {
    console.error("❌ Error: Failed to set super admin");
    console.error("   Details:", rpcError.message);
    console.error("\n   Common issues:");
    console.error(
      "   - The set_super_admin function may not exist (run migrations)"
    );
    console.error("   - Service role key may be invalid");
    console.error("   - Database connection issues");
    rl.close();
    process.exit(1);
  }

  console.log("\n✅ SUCCESS! Super admin configured");
  console.log(`\n📋 Summary:`);
  console.log(`   User ID: ${userId.trim()}`);
  console.log(`   Email: ${authUser.user.email}`);
  console.log(`   Status: SUPER ADMIN (cannot be demoted)\n`);
  console.log(
    "⚠️  IMPORTANT: Keep a record of this user ID in a secure location\n"
  );

  rl.close();
}

// Run the configuration
configureSuperAdmin().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  rl.close();
  process.exit(1);
});
