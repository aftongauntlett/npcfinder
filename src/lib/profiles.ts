/**
 * Profile Service - Smart switcher between mock and real implementations
 *
 * Set VITE_USE_MOCK=true in .env.local for development with mock data
 * Set VITE_USE_MOCK=false (or omit) for production with real Supabase
 */

import { USE_MOCK_DATA } from "../services/config";
import * as mockProfiles from "./profiles.mock";
import * as realProfiles from "./profiles.real";

// Export the UserProfile type (same for both implementations)
export type { UserProfile } from "./profiles.real";

// Log which implementation we're using
if (USE_MOCK_DATA) {
  console.log("🎭 Using MOCK profile data (localStorage)");
} else {
  console.log("🔌 Using REAL profile data (Supabase)");
}

// Export the appropriate implementation based on env variable
const profileService = USE_MOCK_DATA ? mockProfiles : realProfiles;

export const getUserProfile = profileService.getUserProfile;
export const upsertUserProfile = profileService.upsertUserProfile;

// These only exist in real profiles, so conditionally export
export const updateUserProfile =
  "updateUserProfile" in profileService
    ? profileService.updateUserProfile
    : undefined;
export const getDisplayName =
  "getDisplayName" in profileService
    ? profileService.getDisplayName
    : undefined;
