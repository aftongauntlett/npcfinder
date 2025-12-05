import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * User Profile utilities
 * Handles fetching and updating user profile data
 */

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  visible_cards?: string[]; // Array of card IDs to show on dashboard
  theme_color?: string; // User's chosen theme color (hex code)
  is_admin?: boolean; // Admin privileges
  created_at?: string;
  updated_at?: string;
}

interface ProfileResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (
  userId: string
): Promise<ProfileResult<UserProfile>> => {
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
    logger.error("Failed to get profile", { error, userId });
    return { data: null, error: error as PostgrestError };
  }
};

/**
 * Create or update user profile
 * Uses upsert with conflict resolution on user_id
 */
export const upsertUserProfile = async (
  userId: string,
  profileData: Partial<Omit<UserProfile, "user_id">>
): Promise<ProfileResult<UserProfile>> => {
  try {
    const updateData: Record<string, unknown> = {
      user_id: userId,
      display_name: profileData.display_name || null,
      bio: profileData.bio || null,
      profile_picture_url: profileData.profile_picture_url || null,
      updated_at: new Date().toISOString(),
    };

    // Include visible_cards if provided
    if (profileData.visible_cards !== undefined) {
      updateData.visible_cards = profileData.visible_cards;
    }

    // Include theme_color if provided
    if (profileData.theme_color !== undefined) {
      updateData.theme_color = profileData.theme_color;
    }

    // Only include is_admin if explicitly provided
    // This prevents accidentally changing admin status when updating other fields
    if (profileData.is_admin !== undefined) {
      updateData.is_admin = profileData.is_admin;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(updateData, {
        onConflict: "user_id", // Specify which column to check for conflicts
        ignoreDuplicates: false, // Update existing records
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error("Failed to upsert profile", { error, userId });
    return { data: null, error: error as PostgrestError };
  }
};

/**
 * Update specific profile fields
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, "user_id">>
): Promise<ProfileResult<UserProfile>> => {
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
    logger.error("Failed to update profile", { error, userId });
    return { data: null, error: error as PostgrestError };
  }
};

/**
 * Get display name for a user (falls back to email)
 */
export const getDisplayName = async (
  userId: string,
  userEmail?: string
): Promise<string> => {
  const { data } = await getUserProfile(userId);
  return data?.display_name || userEmail || "User";
};
