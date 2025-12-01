#!/usr/bin/env node
/**
 * Create Bootstrap Admin Invite Code
 *
 * This script creates a permanent invite code for initial admin access
 * after running the baseline migration on a fresh database.
 *
 * Usage:
 *   npm run db:create-bootstrap-code
 *
 * The script will:
 * 1. Prompt for your admin email address
 * 2. Generate a secure invite code
 * 3. Insert it directly into the database
 * 4. Display the code for you to use during signup
 */

import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Determine which database to use based on environment
const isDev = process.argv.includes("--dev") || !process.env.VITE_SUPABASE_URL;

const supabaseUrl = isDev
  ? process.env.VITE_SUPABASE_DEV_URL
  : process.env.VITE_SUPABASE_URL;

const supabaseKey = isDev
  ? process.env.VITE_SUPABASE_DEV_ANON_KEY
  : process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ ERROR: Missing Supabase environment variables");
  console.error("\nRequired variables:");
  if (isDev) {
    console.error("  VITE_SUPABASE_DEV_URL");
    console.error("  VITE_SUPABASE_DEV_ANON_KEY");
  } else {
    console.error("  VITE_SUPABASE_URL");
    console.error("  VITE_SUPABASE_ANON_KEY");
  }
  console.error("\nCheck your .env.local file\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function main() {
  console.log("\n🔐 Bootstrap Admin Invite Code Generator");
  console.log("=========================================\n");
  console.log(`Target: ${isDev ? "DEVELOPMENT" : "PRODUCTION"} database`);
  console.log(`URL: ${supabaseUrl}\n`);

  // Prompt for email
  const email = await question("Enter your admin email address: ");

  if (!email || !email.includes("@")) {
    console.error("\n❌ Invalid email address\n");
    rl.close();
    process.exit(1);
  }

  // Generate code
  const code = generateCode();

  console.log("\n📝 Generated invite code:", code);
  console.log("📧 Admin email:", email);

  const confirm = await question("\nCreate this invite code? (yes/no): ");

  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("\n❌ Cancelled\n");
    rl.close();
    process.exit(0);
  }

  // Insert into database
  console.log("\n⏳ Inserting invite code into database...");

  const { error } = await supabase
    .from("invite_codes")
    .insert([
      {
        code: code,
        intended_email: email,
        created_by: null, // System-generated
        expires_at: "2099-12-31 23:59:59+00", // Effectively never expires
        is_active: true,
        max_uses: 1,
        current_uses: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nPossible causes:");
    console.error(
      "  • Database migration not applied yet (run: npm run db:push:dev)"
    );
    console.error("  • Invite code already exists");
    console.error("  • Database connection issue\n");
    rl.close();
    process.exit(1);
  }

  console.log("\n✅ SUCCESS! Bootstrap invite code created\n");
  console.log("┌─────────────────────────────────────┐");
  console.log("│  SAVE THESE CREDENTIALS             │");
  console.log("└─────────────────────────────────────┘");
  console.log("");
  console.log("  Invite Code:", code);
  console.log("  Admin Email:", email);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("  1. Go to your app signup page");
  console.log("  2. Sign up with email:", email);
  console.log("  3. Use invite code:", code);
  console.log("  4. You will have admin privileges");
  console.log("");
  console.log("⚠️  Keep this code secure! It grants admin access.\n");

  rl.close();
}

main().catch((err) => {
  console.error("\n❌ Unexpected error:", err);
  rl.close();
  process.exit(1);
});
