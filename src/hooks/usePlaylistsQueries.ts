import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as playlistsService from "@/services/playlistsService";

export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists.lists(),
    queryFn: async () => {
      const { data, error } = await playlistsService.getPlaylists();
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePlaylist(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.playlists.detail(slug || ""),
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await playlistsService.getPlaylist(slug);
      if (error) throw error;
      return data;
    },
  });
}

export function usePlaylistItems(playlistId: string | null) {
  return useQuery({
    queryKey: queryKeys.playlists.items(playlistId || ""),
    enabled: !!playlistId,
    queryFn: async () => {
      if (!playlistId) return [];
      const { data, error } =
        await playlistsService.getPlaylistItems(playlistId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePlaylistShares(playlistId: string | null) {
  return useQuery({
    queryKey: queryKeys.playlists.shares(playlistId || ""),
    enabled: !!playlistId,
    queryFn: async () => {
      if (!playlistId) return [];
      const { data, error } =
        await playlistsService.getPlaylistShares(playlistId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string | null;
      is_private?: boolean;
      icon?: string;
    }) => {
      const { data, error } = await playlistsService.createPlaylist(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.all,
      });
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      playlistId: string;
      updates: {
        name?: string;
        description?: string | null;
        is_private?: boolean;
        tags?: string[];
        icon?: string;
      };
    }) => {
      const { data, error } = await playlistsService.updatePlaylist(
        params.playlistId,
        params.updates,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.all,
      });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { data, error } = await playlistsService.deletePlaylist(playlistId);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.all,
      });
    },
  });
}

export function useAddPlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      playlistId: string;
      mediaId: string;
      note?: string | null;
    }) => {
      const { data, error } = await playlistsService.addPlaylistItem(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.playlists.items(variables.playlistId),
        }),
      ]);
    },
  });
}

export function useUpdatePlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      playlistId: string;
      playlistItemId: string;
      updates: { note?: string | null; position?: number };
    }) => {
      const { data, error } = await playlistsService.updatePlaylistItem(
        params.playlistItemId,
        params.updates,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.items(variables.playlistId),
      });
    },
  });
}

export function useRemovePlaylistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      playlistId: string;
      playlistItemId: string;
    }) => {
      const { data, error } = await playlistsService.removePlaylistItem(
        params.playlistItemId,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.playlists.items(variables.playlistId),
        }),
      ]);
    },
  });
}

export function useReorderPlaylistItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      playlistId: string;
      orderedItemIds: string[];
    }) => {
      const { data, error } =
        await playlistsService.reorderPlaylistItems(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.items(variables.playlistId),
      });
    },
  });
}

export function useSharePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { playlistId: string; userIds: string[] }) => {
      const { data, error } = await playlistsService.sharePlaylist(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.shares(variables.playlistId),
      });
    },
  });
}

export function useUnsharePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { playlistId: string; userId: string }) => {
      const { data, error } = await playlistsService.unsharePlaylist(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.shares(variables.playlistId),
      });
    },
  });
}
