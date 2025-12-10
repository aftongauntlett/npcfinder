/**
 * TanStack Query hooks for Admin Panel
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminService from "../services/adminService";
import * as inviteCodesLib from "../lib/inviteCodes";
import * as adminLib from "../lib/admin";
import { queryKeys } from "../lib/queryKeys";
import { parseSupabaseError } from "../utils/errorUtils";

/**
 * Get admin dashboard statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: async () => {
      try {
        return await adminService.getAdminStats();
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes (admin stats update infrequently)
  });
}

/**
 * Get paginated users list with search
 */
export function useAdminUsers(
  page: number,
  perPage: number,
  searchTerm: string = ""
) {
  return useQuery({
    queryKey: queryKeys.admin.users(page, searchTerm),
    queryFn: async () => {
      try {
        return await adminService.getUsers(page, perPage, searchTerm);
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    placeholderData: (previousData) => previousData, // Keep showing old data while loading new page
  });
}

/**
 * Get popular/most tracked media
 */
export function usePopularMedia() {
  return useQuery({
    queryKey: queryKeys.admin.popularMedia(),
    queryFn: async () => {
      try {
        return await adminService.getPopularMedia();
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Get recent platform activity
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.admin.recentActivity(),
    queryFn: async () => {
      try {
        return await adminService.getRecentActivity();
      } catch (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
}

/**
 * Get all invite codes (admin only)
 */
export function useInviteCodes() {
  return useQuery({
    queryKey: queryKeys.inviteCodes.list(),
    queryFn: async () => {
      const result = await inviteCodesLib.getAllInviteCodes();
      if (result.error) {
        const parsedError = parseSupabaseError(result.error);
        throw parsedError;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes (invite codes are relatively static until mutation)
  });
}

/**
 * Mutation: Create a single invite code
 * Simplified: only requires email, always 30 days, max 1 use
 */
export function useCreateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intendedEmail: string) => {
      const result = await inviteCodesLib.createInviteCode(intendedEmail);
      if (result.error) {
        const parsedError = parseSupabaseError(result.error);
        throw parsedError;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invite codes
      void queryClient.invalidateQueries({
        queryKey: queryKeys.inviteCodes.list(),
      });
    },
  });
}

/**
 * Mutation: Create multiple invite codes at once
 */
export function useBatchCreateInviteCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      count,
      notes,
      maxUses = 1,
      expiresInDays,
    }: {
      count: number;
      notes?: string;
      maxUses?: number;
      expiresInDays?: number;
    }) => {
      const result = await inviteCodesLib.batchCreateInviteCodes(
        count,
        notes,
        maxUses,
        expiresInDays
      );
      if (result.error) {
        const parsedError = parseSupabaseError(result.error);
        throw parsedError;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invite codes
      void queryClient.invalidateQueries({
        queryKey: queryKeys.inviteCodes.list(),
      });
    },
  });
}

/**
 * Mutation: Revoke an invite code
 */
export function useRevokeInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const result = await inviteCodesLib.revokeInviteCode(codeId);
      if (result.error) {
        const parsedError = parseSupabaseError(result.error);
        throw parsedError;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invite codes
      void queryClient.invalidateQueries({
        queryKey: queryKeys.inviteCodes.list(),
      });
    },
  });
}

/**
 * Mutation: Update user role (admin/user)
 */
export function useToggleUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: "user" | "admin";
    }) => {
      const result = await adminLib.updateUserRole(userId, newRole);
      if (!result.success) {
        // Parse as a generic error with the specific message
        const error = { message: result.error || "Failed to update user role" };
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate users query to refetch the list
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

/**
 * @deprecated Use useToggleUserRole instead
 * Mutation: Toggle admin status for a user (legacy function)
 */
export function useToggleAdminStatus() {
  return useToggleUserRole();
}
