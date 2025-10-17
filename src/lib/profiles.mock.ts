import type { PostgrestError } from "@supabase/supabase-js";
import type { UserProfile } from "./profiles";

/**
 * Mock implementation of profile utilities for local development
 * Uses localStorage to persist profile data without hitting Supabase
 */

interface ProfileResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

const STORAGE_KEY = "mock_user_profiles";

// Get profiles from localStorage
const getStoredProfiles = (): Record<string, UserProfile> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save profiles to localStorage
const saveProfiles = (profiles: Record<string, UserProfile>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Failed to save profiles:", error);
  }
};

/**
 * Mock: Get user profile by user ID
 */
export const getUserProfile = async (
  userId: string
): Promise<ProfileResult<UserProfile>> => {
  console.log("🎭 [MOCK] Getting user profile for:", userId);

  const profiles = getStoredProfiles();
  const profile = profiles[userId];

  if (profile) {
    return { data: profile, error: null };
  }

  // Return default profile if not found
  const defaultProfile: UserProfile = {
    user_id: userId,
    display_name: null,
    bio: null,
    profile_picture_url: null,
    visible_cards: [],
    theme_color: "purple",
  };

  return { data: defaultProfile, error: null };
};

/**
 * Mock: Create or update user profile
 */
export const upsertUserProfile = async (
  userId: string,
  profileData: Partial<Omit<UserProfile, "user_id">>
): Promise<ProfileResult<UserProfile>> => {
  console.log("🎭 [MOCK] Upserting user profile:", { userId, profileData });

  const profiles = getStoredProfiles();
  const existing = profiles[userId];

  const updatedProfile: UserProfile = {
    user_id: userId,
    display_name: profileData.display_name ?? existing?.display_name ?? null,
    bio: profileData.bio ?? existing?.bio ?? null,
    profile_picture_url:
      profileData.profile_picture_url ?? existing?.profile_picture_url ?? null,
    visible_cards: profileData.visible_cards ?? existing?.visible_cards ?? [],
    theme_color: profileData.theme_color ?? existing?.theme_color ?? "purple",
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  profiles[userId] = updatedProfile;
  saveProfiles(profiles);

  return { data: updatedProfile, error: null };
};

/**
 * Mock: Get all user profiles (for friends list, etc.)
 */
export const getAllUserProfiles = async (): Promise<
  ProfileResult<UserProfile[]>
> => {
  console.log("🎭 [MOCK] Getting all user profiles");

  const profiles = getStoredProfiles();
  const allProfiles = Object.values(profiles);

  return { data: allProfiles, error: null };
};
