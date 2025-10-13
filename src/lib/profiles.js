import { supabase } from "./supabase";

/**
 * User Profile utilities
 * Handles fetching and updating user profile data
 */

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If profile doesn't exist, return default structure
      if (error.code === "PGRST116") {
        return {
          data: {
            user_id: userId,
            display_name: null,
            bio: null,
            profile_picture_url: null,
          },
          error: null,
        };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Get profile error:", error);
    return { data: null, error };
  }
};

/**
 * Create or update user profile
 * Uses upsert with conflict resolution on user_id
 */
export const upsertUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          display_name: profileData.display_name || null,
          bio: profileData.bio || null,
          profile_picture_url: profileData.profile_picture_url || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id", // Specify which column to check for conflicts
          ignoreDuplicates: false, // Update existing records
        }
      )
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Upsert profile error:", error);
    return { data: null, error };
  }
};

/**
 * Update specific profile fields
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Update profile error:", error);
    return { data: null, error };
  }
};

/**
 * Get display name for a user (falls back to email)
 */
export const getDisplayName = async (userId, userEmail) => {
  const { data } = await getUserProfile(userId);
  return data?.display_name || userEmail || "User";
};
