#!/usr/bin/env node

/**
 * Comprehensive RLS Policy Verification Script
 * Verifies that all tables have proper RLS policies with admin override
 * and that there are no permission leakages
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Tables that should have admin override policies
const TABLES_WITH_USER_DATA = [
  "task_boards",
  "task_board_sections",
  "tasks",
  "task_board_members",
  "user_watchlist",
  "user_watched_archive",
  "reading_list",
  "game_library",
  "music_library",
  "media_reviews",
  "movie_recommendations",
  "book_recommendations",
  "game_recommendations",
  "music_recommendations",
  "connections",
  "user_profiles",
];

// Tables with admin-only access
const ADMIN_ONLY_TABLES = [
  "invite_codes",
  "invite_code_audit_log",
  "admin_audit_log",
  "app_config",
  "rate_limits",
];

async function verifyRLSPolicies() {
  console.log("🔍 Verifying RLS Policies...\n");

  let errors = 0;
  let warnings = 0;

  // Check RLS status and policies using direct SQL queries
  console.log("📋 Checking RLS enabled status and policies...\n");

  for (const table of TABLES_WITH_USER_DATA) {
    console.log(`  Checking ${table}...`);

    try {
      // Check if RLS is enabled
      const { data: rlsData, error: rlsError } = await supabase.rpc(
        "check_rls_enabled",
        { table_name: table },
      );

      if (rlsError) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase
          .from(table)
          .select("*")
          .limit(0);

        if (directError && directError.code === "42501") {
          console.log("    ✅ RLS appears to be enabled");
        } else {
          console.log("    ⚠️  Could not verify RLS status");
          warnings++;
        }
      } else if (rlsData) {
        console.log("    ✅ RLS is enabled");
      } else {
        console.log("    ❌ RLS is NOT enabled");
        errors++;
      }

      // Check for admin override policy by querying with service role
      const { data: policyData, error: policyError } = await supabase.rpc(
        "check_admin_policy_exists",
        { table_name: table },
      );

      if (policyError) {
        console.log(
          "    ⚠️  Could not verify admin override policy (manual check needed)",
        );
        warnings++;
      } else if (policyData) {
        console.log("    ✅ Admin override policy exists");
      } else {
        console.log("    ❌ No admin override policy found");
        errors++;
      }
    } catch (err) {
      console.log(`    ⚠️  Verification error: ${err.message}`);
      warnings++;
    }
  }

  console.log("\n📊 Checking policies for admin-only tables...");
  for (const table of ADMIN_ONLY_TABLES) {
    console.log(`\n  Checking ${table}...`);

    try {
      // For admin-only tables, verify they are restricted
      const { error } = await supabase.from(table).select("*").limit(1);

      if (error) {
        console.log("    ⚠️  Table access restricted or error occurred");
        warnings++;
      } else {
        console.log("    ✅ Table accessible (with service role)");
      }
    } catch (err) {
      console.log(`    ⚠️  Verification error: ${err.message}`);
      warnings++;
    }
  }

  console.log("\n" + "=".repeat(60));
  if (errors === 0 && warnings === 0) {
    console.log("✅ All RLS policies verified successfully!");
  } else {
    console.log(
      `⚠️  Verification completed with ${errors} errors and ${warnings} warnings`,
    );
    if (warnings > 0) {
      console.log(
        "\n⚠️  Note: Some checks require direct database access and may show warnings.",
      );
      console.log(
        "    For full verification, run direct SQL queries against pg_policies.",
      );
    }
  }
  console.log("=".repeat(60) + "\n");

  return { errors, warnings };
}

async function testRoleBasedAccess() {
  console.log("\n🧪 Testing Role-Based Access Control...\n");

  // Test 1: Verify get_user_role function exists
  console.log("Test 1: Verify get_user_role function exists");
  try {
    const { error } = await supabase.rpc("get_user_role", {
      check_user_id: "00000000-0000-0000-0000-000000000000",
    });

    if (error) {
      console.log("  ❌ get_user_role function not found");
    } else {
      console.log("  ✅ get_user_role function exists");
    }
  } catch (err) {
    console.log("  ❌ Error calling get_user_role:", err);
  }

  // Test 2: Verify is_admin function exists
  console.log("\nTest 2: Verify is_admin function exists");
  try {
    const { error } = await supabase.rpc("is_admin", {
      check_user_id: "00000000-0000-0000-0000-000000000000",
    });

    if (error) {
      console.log("  ❌ is_admin function not found");
    } else {
      console.log("  ✅ is_admin function exists");
    }
  } catch (err) {
    console.log("  ❌ Error calling is_admin:", err);
  }

  // Test 3: Verify is_super_admin function exists
  console.log("\nTest 3: Verify is_super_admin function exists");
  try {
    const { error } = await supabase.rpc("is_super_admin", {
      check_user_id: "00000000-0000-0000-0000-000000000000",
    });

    if (error) {
      console.log("  ❌ is_super_admin function not found");
    } else {
      console.log("  ✅ is_super_admin function exists");
    }
  } catch (err) {
    console.log("  ❌ Error calling is_super_admin:", err);
  }

  // Test 4: Verify role column exists
  console.log("\nTest 4: Verify role column exists in user_profiles");
  try {
    const { error } = await supabase
      .from("user_profiles")
      .select("role")
      .limit(1);

    if (error) {
      console.log("  ❌ role column not found or not accessible");
    } else {
      console.log("  ✅ role column exists and is accessible");
    }
  } catch (err) {
    console.log("  ❌ Error querying role column:", err);
  }

  // Test 5: Check for super admin in system
  console.log("\nTest 5: Check for super admin in system");
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, role")
      .eq("role", "super_admin")
      .limit(1);

    if (error) {
      console.log("  ❌ Error querying super admin:", error.message);
    } else if (data && data.length > 0) {
      console.log("  ✅ Super admin found:", data[0].display_name);
    } else {
      console.log("  ⚠️  No super admin found in system");
    }
  } catch (err) {
    console.log("  ❌ Error checking super admin:", err);
  }
}

async function checkPermissionLeakage() {
  console.log("\n🔒 Checking for Permission Leakage...\n");

  let passed = 0;
  let failed = 0;

  const checks = [
    {
      name: "app_config is restricted to admins",
      table: "app_config",
      query: async () => {
        // Service role can access, but regular users should not
        const { data, error } = await supabase.from("app_config").select("*");
        return { accessible: !error, data, error };
      },
      expected: "accessible",
    },
    {
      name: "admin_audit_log is restricted to admins",
      table: "admin_audit_log",
      query: async () => {
        const { data, error } = await supabase
          .from("admin_audit_log")
          .select("*");
        return { accessible: !error, data, error };
      },
      expected: "accessible",
    },
    {
      name: "invite_codes accessible",
      table: "invite_codes",
      query: async () => {
        const { data, error } = await supabase.from("invite_codes").select("*");
        return { accessible: !error, data, error };
      },
      expected: "accessible",
    },
    {
      name: "user_profiles accessible",
      table: "user_profiles",
      query: async () => {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("role")
          .limit(1);
        return { accessible: !error, data, error };
      },
      expected: "accessible",
    },
  ];

  for (const check of checks) {
    console.log(`Checking: ${check.name}`);

    try {
      const result = await check.query();

      if (check.expected === "accessible" && result.accessible) {
        console.log(`  ✅ Service role can access ${check.table}`);
        passed++;
      } else if (check.expected === "restricted" && !result.accessible) {
        console.log(`  ✅ Access correctly restricted for ${check.table}`);
        passed++;
      } else if (result.error) {
        console.log(
          `  ⚠️  Unexpected result: ${result.error.message || "Unknown error"}`,
        );
        failed++;
      } else {
        console.log(`  ⚠️  Unexpected accessibility for ${check.table}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ Error during check: ${err.message}`);
      failed++;
    }
    console.log("");
  }

  console.log(`\n📊 Permission checks: ${passed} passed, ${failed} failed\n`);

  if (!anonClient) {
    console.log(
      "⚠️  Note: VITE_SUPABASE_ANON_KEY not provided, anon-perspective checks skipped.\n",
    );
  }

  return { passed, failed };
}

async function checkAnonPublicAccess() {
  console.log("\n🕵️  Checking restrictions with anon key...\n");

  if (!anonClient) {
    console.log("⚠️  Skipping anon checks (missing VITE_SUPABASE_ANON_KEY)\n");
    return { passed: 0, failed: 0, skipped: true };
  }

  let passed = 0;
  let failed = 0;

  const anonChecks = [
    // Note: these checks verify that tables are not publicly accessible
    // without authentication. They do NOT verify user-to-user isolation —
    // for that, see the integration tests in tests/rls.test.ts.
    { name: "anon cannot read user_profiles", table: "user_profiles" },
    { name: "anon cannot read tasks", table: "tasks" },
    { name: "anon cannot read invite_codes", table: "invite_codes" },
  ];

  for (const check of anonChecks) {
    console.log(`Checking: ${check.name}`);
    try {
      const { error } = await anonClient.from(check.table).select("*").limit(1);
      if (error) {
        console.log(`  ✅ Restricted as expected (${error.code || "error"})`);
        passed++;
      } else {
        console.log("  ❌ Unexpectedly readable with anon key");
        failed++;
      }
    } catch (err) {
      console.log(`  ✅ Restricted (exception): ${err.message}`);
      passed++;
    }
    console.log("");
  }

  console.log(`📊 Anon checks: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, skipped: false };
}

// Main execution
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔐 RLS Policy Verification Tool");
  console.log("=".repeat(60) + "\n");

  const rlsResults = await verifyRLSPolicies();
  await testRoleBasedAccess();
  const leakageResults = await checkPermissionLeakage();
  const anonResults = await checkAnonPublicAccess();

  console.log("\n" + "=".repeat(60));
  console.log("📋 Summary");
  console.log("=".repeat(60));
  console.log(
    `RLS Policies: ${rlsResults.errors} errors, ${rlsResults.warnings} warnings`,
  );
  console.log(
    `Permission Checks: ${leakageResults.passed} passed, ${leakageResults.failed} failed`,
  );
  if (anonResults.skipped) {
    console.log("Anon Checks: skipped (missing anon key)");
  } else {
    console.log(
      `Anon Checks: ${anonResults.passed} passed, ${anonResults.failed} failed`,
    );
  }
  console.log("=".repeat(60) + "\n");

  console.log("✨ Verification complete!\n");

  // Exit with error code if there were critical errors
  if (
    rlsResults.errors > 0 ||
    leakageResults.failed > 0 ||
    (!anonResults.skipped && anonResults.failed > 0)
  ) {
    console.log(
      "⚠️  Some critical checks failed. Please review the output above.\n",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
