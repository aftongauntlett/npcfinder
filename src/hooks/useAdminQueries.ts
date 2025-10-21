/**
 * TanStack Query hooks for Admin Panel
 * Manages admin data fetching with smart mock/real data switching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "../services/config";
import * as adminService from "../services/adminService";
import * as adminServiceMock from "../services/adminService.mock";
import * as inviteCodesLib from "../lib/inviteCodes";
import * as adminLib from "../lib/admin";
import { queryKeys } from "../lib/queryKeys";

// Smart service switcher
const service = USE_MOCK_DATA ? adminServiceMock : adminService;

/**
 * Get admin dashboard statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: service.getAdminStats,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
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
    queryFn: () => service.getUsers(page, perPage, searchTerm),
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
    queryFn: service.getPopularMedia,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Get recent platform activity
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.admin.recentActivity(),
    queryFn: service.getRecentActivity,
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
      if (result.error) throw result.error;
      return result.data || [];
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
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
      if (result.error) throw result.error;
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
      if (result.error) throw result.error;
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
      if (result.error) throw result.error;
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
 * Mutation: Toggle admin status for a user
 */
export function useToggleAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      makeAdmin,
    }: {
      userId: string;
      makeAdmin: boolean;
    }) => {
      const result = await adminLib.toggleUserAdminStatus(userId, makeAdmin);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidate users query to refetch the list
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}
