import { supabase } from "./supabase";
import { logger } from "@/lib/logger";

// Admin utilities
// SECURITY: AdminContext gates routes, RLS enforces DB-level protection
// These functions perform direct database operations

// Type for user roles
export type UserRole = "user" | "admin" | "super_admin";

// Get user role from database
export const getUserRole = async (userId: string): Promise<UserRole> => {
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return (data?.role as UserRole) || "user";
};

// Check if user is admin (admin or super_admin)
export const isAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return ["admin", "super_admin"].includes(role);
};

// Check if user is super admin
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === "super_admin";
};

// Update user role (admin only)
// Frontend check provides better UX; RLS rejects unauthorized updates
export const updateUserRole = async (
  userId: string,
  newRole: "user" | "admin"
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
    const currentUserRole = await getUserRole(user.id);
    if (!["admin", "super_admin"].includes(currentUserRole)) {
      return {
        success: false,
        error: "Unauthorized: Admin privileges required",
      };
    }

    // Attempt to update - RLS policies will enforce security at database level
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      // Check for specific RLS policy violation
      if (error.code === "42501" || error.message.includes("policy")) {
        return {
          success: false,
          error: "Permission denied: Cannot modify user role",
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

    // Log admin action for audit trail
    try {
      await supabase.rpc("log_admin_action", {
        p_action:
          newRole === "admin" ? "grant_admin_role" : "revoke_admin_role",
        p_target_user_id: userId,
        p_details: { newRole },
      });
    } catch (logError) {
      // Don't fail the operation if logging fails
      logger.warn("Failed to log admin action", { error: logError });
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to update user role", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
