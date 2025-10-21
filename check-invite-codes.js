#!/usr/bin/env node
/**
 * Quick script to check invite codes in the database
 * Run with: node check-invite-codes.js
 */

import { createClient } from "@supabase/supabase-js";

// Get from .env file or hardcode temporarily
const supabaseUrl = "https://hugcstixszgqcrqmqoss.supabase.co";
const supabaseKey = "YOUR_ANON_KEY_HERE"; // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInviteCodes() {
  console.log("🔍 Checking invite codes in database...\n");

  // Get all invite codes
  const { data: codes, error: codesError } = await supabase
    .from("invite_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (codesError) {
    console.error("❌ Error fetching codes:", codesError);
    return;
  }

  console.log(`📊 Total invite codes: ${codes?.length || 0}\n`);

  codes?.forEach((code, index) => {
    console.log(`--- Code ${index + 1} ---`);
    console.log(`Code: ${code.code}`);
    console.log(`Status: ${code.is_active ? "✅ Active" : "❌ Inactive"}`);
    console.log(`Created by: ${code.created_by || "N/A"}`);
    console.log(`Used by: ${code.used_by || "❌ NOT USED YET"}`);
    console.log(`Used at: ${code.used_at || "N/A"}`);
    console.log(`Current uses: ${code.current_uses} / ${code.max_uses}`);
    console.log(`Expires: ${code.expires_at || "Never"}`);
    console.log("");
  });

  // Check user profiles for emails
  console.log("👤 Checking user profiles...\n");

  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, email");

  if (profilesError) {
    console.error("❌ Error fetching profiles:", profilesError);
    return;
  }

  console.log(`📊 Total users: ${profiles?.length || 0}\n`);

  profiles?.forEach((profile, index) => {
    console.log(`--- User ${index + 1} ---`);
    console.log(`Display name: ${profile.display_name || "N/A"}`);
    console.log(`Email: ${profile.email || "❌ NULL (THIS IS THE PROBLEM!)"}`);
    console.log(`User ID: ${profile.user_id}`);
    console.log("");
  });

  // Summary
  const usedCodes = codes?.filter((c) => c.used_by !== null) || [];
  const nullEmails = profiles?.filter((p) => !p.email) || [];

  console.log("📈 Summary:");
  console.log(`✅ Codes actually used: ${usedCodes.length}`);
  console.log(`❌ Users with NULL email: ${nullEmails.length}`);

  if (nullEmails.length > 0) {
    console.log("\n⚠️  ACTION NEEDED:");
    console.log("Run this migration to fix emails:");
    console.log("  npx supabase db push");
    console.log("\nOr run the SQL directly in Supabase dashboard:");
    console.log(
      "  supabase/migrations/20250129000000_add_email_to_user_profiles.sql"
    );
  }
}

checkInviteCodes().catch(console.error);
