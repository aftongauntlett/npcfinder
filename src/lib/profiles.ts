/**
 * Profile Service - Real Supabase implementation
 */

export type { UserProfile } from "./profiles.real";
export {
  getUserProfile,
  getUserProfileByUsername,
  upsertUserProfile,
  updateUserProfile,
  getDisplayName,
} from "./profiles.real";
