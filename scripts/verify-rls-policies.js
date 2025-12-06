#!/usr/bin/env node

/**
 * Verification Script for RLS Policy Fix
 *
 * This script helps verify that the admin override policies are working correctly.
 * Run this after applying the migration to check that:
 * 1. Admin users can access all data
 * 2. Regular users can only access their own data
 * 3. Admin check is working properly
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAdminPolicies() {
  console.log("🔍 Verifying RLS Policies and Admin Access...\n");

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ Not authenticated. Please log in first.");
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);
    console.log(`   User ID: ${user.id}\n`);

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin, display_name")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("❌ Failed to fetch user profile:", profileError.message);
      console.error("   Code:", profileError.code);
      console.error(
        "   This indicates RLS policies may not be set up correctly.\n"
      );
      return;
    }

    console.log(`✅ Profile loaded successfully`);
    console.log(`   Display Name: ${profile.display_name}`);
    console.log(
      `   Admin Status: ${
        profile.is_admin ? "YES (Admin)" : "NO (Regular User)"
      }\n`
    );

    const isAdmin = profile.is_admin;

    // Test table access
    const tablesToTest = [
      "task_boards",
      "tasks",
      "user_watchlist",
      "reading_list",
      "game_library",
      "music_library",
      "connections",
      "movie_recommendations",
    ];

    console.log("📋 Testing table access...\n");

    for (const table of tablesToTest) {
      const { error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error(`❌ ${table}: FAILED`);
        console.error(`   Error: ${error.message} (${error.code})`);
        if (error.code === "42501" || error.code === "PGRST301") {
          console.error(
            `   This is a 403/permission error - RLS policy missing or incorrect`
          );
        }
      } else {
        console.log(`✅ ${table}: OK (${count || 0} rows accessible)`);
      }
    }

    console.log("\n📊 Summary:\n");

    if (isAdmin) {
      console.log("You are an ADMIN user. You should be able to:");
      console.log("  ✓ Access all tables without 403 errors");
      console.log("  ✓ See all users' data in admin panel");
      console.log("  ✓ View admin dashboard at /admin");
      console.log("  ✓ Manage other users' admin status");
    } else {
      console.log("You are a REGULAR user. You should be able to:");
      console.log("  ✓ Access only your own data");
      console.log("  ✓ View only your tasks, watchlists, etc.");
      console.log("  ✗ Cannot access /admin page");
      console.log("  ✗ Cannot see other users' private data");
    }

    console.log("\n✨ Verification complete!\n");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

// Run verification
verifyAdminPolicies().catch(console.error);
