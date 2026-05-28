import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as trackerService from "@/services/trackerService";
import type { MediaItem } from "@/components/shared";

export function useTrackerItems(filter: "active" | "done") {
  return useQuery({
    queryKey: queryKeys.tracker.items(filter),
    queryFn: async () => {
      const { data, error } = await trackerService.getTrackerItems(filter);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useTrackerStats() {
  return useQuery({
    queryKey: queryKeys.tracker.stats(),
    queryFn: async () => {
      const { data, error } = await trackerService.getTrackerStats();
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTrackerItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      item: MediaItem;
      status?: trackerService.TrackerStatus;
    }) => {
      const { data, error } = await trackerService.addTrackerItem(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tracker.all }),
      ]);
    },
  });
}

export function useUpdateTrackerItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      trackerItemId: string;
      updates: Partial<
        Pick<
          trackerService.TrackerItem,
          | "status"
          | "rating"
          | "note"
          | "api_media_source_snapshot"
          | "media_overrides"
          | "media_edited_fields"
          | "completed_at"
          | "tv_current_season"
          | "tv_current_episode"
          | "book_current_page"
          | "book_chapter_notes"
        >
      >;
    }) => {
      const { data, error } = await trackerService.updateTrackerItem(
        params.trackerItemId,
        params.updates,
      );

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracker.all });
    },
  });
}

export function useRemoveTrackerItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackerItemId: string) => {
      const { data, error } =
        await trackerService.removeTrackerItem(trackerItemId);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracker.all });
    },
  });
}
