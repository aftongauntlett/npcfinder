import { supabase } from "../lib/supabase";

/**
 * Test Supabase connection and database setup
 * Open browser console to see results
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  console.log("🧪 Testing Supabase Connection...");
  console.log("-----------------------------------");

  try {
    // Test 1: Check if Supabase client is initialized
    if (!supabase) {
      console.error("❌ Supabase client not initialized");
      return false;
    }
    console.log("✅ Supabase client initialized");

    // Test 2: Try to fetch from media_items table
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Database query failed:", error.message);
      console.error("   Make sure you ran the SQL schema!");
      return false;
    }

    console.log("✅ Database connection successful");
    console.log(`   Found ${data?.length || 0} items in media_items table`);

    // Test 3: Check if we can query user_media
    const { error: userMediaError } = await supabase
      .from("user_media")
      .select("*")
      .limit(1);

    if (userMediaError) {
      console.error(
        "❌ user_media table query failed:",
        userMediaError.message
      );
      return false;
    }

    console.log("✅ user_media table accessible");

    console.log("-----------------------------------");
    console.log("🎉 All tests passed! Database is ready!");
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
};

interface MediaItem {
  id?: string;
  type: string;
  title: string;
  release_year: number;
  description: string;
  critic_rating: number;
  audience_rating: number;
  [key: string]: any;
}

/**
 * Add a test movie to the database
 */
export const addTestMovie = async (): Promise<MediaItem | false> => {
  try {
    // First, add to media_items
    const { data: mediaItem, error: mediaError } = await supabase
      .from("media_items")
      .insert({
        type: "movie",
        title: "The Shawshank Redemption",
        release_year: 1994,
        description: "Two imprisoned men bond over a number of years...",
        critic_rating: 91,
        audience_rating: 98,
      })
      .select()
      .single();

    if (mediaError) {
      console.error("❌ Failed to add test movie:", mediaError);
      return false;
    }

    console.log("✅ Added test movie:", mediaItem.title);
    return mediaItem;
  } catch (err) {
    console.error("❌ Error adding test movie:", err);
    return false;
  }
};
