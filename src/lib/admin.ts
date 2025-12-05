import { supabase } from "./supabase";
import { logger } from "@/lib/logger";

// Admin utilities
// SECURITY: AdminContext gates routes, RLS enforces DB-level protection
// These functions perform direct database operations

// Toggle admin status for a user (admin only)
// Frontend check provides better UX; RLS rejects unauthorized updates
export const toggleUserAdminStatus = async (
  userId: string,
  makeAdmin: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify current user is admin (frontend check for UX)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if current user is admin
    const { data: currentUserProfile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!currentUserProfile?.is_admin) {
      return {
        success: false,
        error: "Unauthorized: Admin privileges required",
      };
    }

    // Attempt to update - RLS policies will enforce security at database level
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_admin: makeAdmin })
      .eq("user_id", userId);

    if (error) {
      // Check for specific RLS policy violation
      if (error.code === "42501" || error.message.includes("policy")) {
        return {
          success: false,
          error: "Permission denied: Cannot modify admin status",
        };
      }

      // Check for super admin protection
      if (error.message.includes("super admin")) {
        return {
          success: false,
          error: "Cannot modify super admin account",
        };
      }

      throw error;
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to toggle admin status", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
