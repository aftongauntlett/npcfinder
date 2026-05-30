import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  assignUserToTag,
  createFriendTag,
  deleteFriendTag,
  getFriendTagMembers,
  getFriendTags,
  removeUserFromTag,
} from "@/services/friendTagsService";

export function useFriendTags() {
  return useQuery({
    queryKey: queryKeys.friends.tags(),
    queryFn: getFriendTags,
  });
}

export function useFriendTagMembers() {
  return useQuery({
    queryKey: queryKeys.friends.tagMembers(),
    queryFn: getFriendTagMembers,
  });
}

export function useCreateFriendTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFriendTag,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useDeleteFriendTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFriendTag,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useAssignUserToTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignUserToTag,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.friends.tagMembers(),
      });
    },
  });
}

export function useRemoveUserFromTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeUserFromTag,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.friends.tagMembers(),
      });
    },
  });
}
