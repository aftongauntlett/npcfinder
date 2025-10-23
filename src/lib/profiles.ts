/**
 * Profile Service - Real Supabase implementation
 */

export type { UserProfile } from "./profiles.real";
export {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
  getDisplayName,
} from "./profiles.real";
