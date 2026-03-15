import { useMemo } from "react";
import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Music,
  Tv as TvIcon,
} from "lucide-react";
import {
  InlineRecommendationsLayout,
  MediaRecommendationCard,
  type BaseRecommendation,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  useDeleteRec,
  useFriendsWithRecs,
  useQuickStats,
  useRecommendations,
  useUpdateRecipientNote,
  useUpdateSenderNote,
  useUpdateStatus,
  type MediaTypeKey,
} from "@/hooks/useRecommendations";
import { TAB_CONFIG, type RecommendationMediaTab } from "./recommendationTabs";

interface RecommendationWithMedia extends BaseRecommendation {
  media_type?: string;
  release_date?: string | null;
  overview?: string | null;
  poster_url?: string | null;
  cover_url?: string | null;
  background_image?: string | null;
  subtitle?: string | null;
  genres?: string | null;
  platforms?: string | null;
}

type RawRecommendation = Record<string, unknown>;

function normalizeRecommendation(
  rec: RawRecommendation,
  consumedStatus: string,
): RecommendationWithMedia {
  const status = String(rec.status || "pending");
  return {
    ...(rec as unknown as RecommendationWithMedia),
    title: String(rec.title || "Untitled"),
    sent_message: (rec.sent_message as string | null | undefined) ?? null,
    sent_at: String(rec.sent_at || rec.created_at || ""),
    consumed_at:
      (rec.consumed_at as string | null | undefined) ||
      (rec.watched_at as string | null | undefined) ||
      null,
    sender_comment:
      (rec.sender_comment as string | null | undefined) ||
      (rec.sender_note as string | null | undefined) ||
      null,
    comment:
      (rec.comment as string | null | undefined) ||
      (rec.recipient_comment as string | null | undefined) ||
      (rec.recipient_note as string | null | undefined) ||
      null,
    status: status === "consumed" ? consumedStatus : status,
    subtitle:
      (rec.subtitle as string | null | undefined) ||
      [rec.author, rec.artist, rec.album].filter(Boolean).join(" • ") ||
      null,
    media_type: rec.media_type as string | undefined,
  };
}

export function RecommendationsTabPanel({
  tabId,
}: {
  tabId: RecommendationMediaTab;
}) {
  const config = TAB_CONFIG.find((tab) => tab.id === tabId)!;
  const { data: friendsWithRecs = [], isLoading } = useFriendsWithRecs(tabId);
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useQuickStats(tabId);
  const { data: hitsRaw = [] } = useRecommendations("hits", undefined, tabId);
  const { data: missesRaw = [] } = useRecommendations(
    "misses",
    undefined,
    tabId,
  );
  const { data: sentRaw = [] } = useRecommendations("sent", undefined, tabId);
  const { data: queueRaw = [] } = useRecommendations("queue", undefined, tabId);

  const updateStatus = useUpdateStatus(tabId as MediaTypeKey);
  const deleteRec = useDeleteRec(tabId as MediaTypeKey);
  const updateSenderNote = useUpdateSenderNote(tabId as MediaTypeKey);
  const updateRecipientNote = useUpdateRecipientNote(tabId as MediaTypeKey);

  const hits = useMemo(
    () =>
      (hitsRaw as unknown as RawRecommendation[]).map((rec) =>
        normalizeRecommendation(rec, config.consumedStatus),
      ),
    [hitsRaw, config.consumedStatus],
  );
  const misses = useMemo(
    () =>
      (missesRaw as unknown as RawRecommendation[]).map((rec) =>
        normalizeRecommendation(rec, config.consumedStatus),
      ),
    [missesRaw, config.consumedStatus],
  );
  const sent = useMemo(
    () =>
      (sentRaw as unknown as RawRecommendation[]).map((rec) =>
        normalizeRecommendation(rec, config.consumedStatus),
      ),
    [sentRaw, config.consumedStatus],
  );

  const { friendRecommendations, userNameMap } = useMemo(() => {
    const grouped = new Map<string, RecommendationWithMedia[]>();
    const names = new Map<string, string>();
    friendsWithRecs.forEach((friend) =>
      names.set(friend.user_id, friend.display_name),
    );

    (queueRaw as unknown as RawRecommendation[]).forEach((raw) => {
      const rec = normalizeRecommendation(raw, config.consumedStatus);
      const fromUserId = String(rec.from_user_id);
      const senderName = raw.sender_name as string | undefined;
      if (senderName) names.set(fromUserId, senderName);
      if (!grouped.has(fromUserId)) grouped.set(fromUserId, []);
      grouped.get(fromUserId)?.push(rec);
    });

    (sentRaw as unknown as RawRecommendation[]).forEach((raw) => {
      const toUserId = raw.to_user_id as string | undefined;
      const recipientName = raw.recipient_name as string | undefined;
      if (toUserId && recipientName) names.set(toUserId, recipientName);
    });

    return { friendRecommendations: grouped, userNameMap: names };
  }, [friendsWithRecs, queueRaw, sentRaw, config.consumedStatus]);

  return (
    <InlineRecommendationsLayout<RecommendationWithMedia>
      mediaType={config.label}
      mediaIcon={config.icon}
      emptyMessage="No recommendations yet"
      emptySubMessage={config.emptySubMessage}
      loading={isLoading}
      friendsWithRecs={friendsWithRecs}
      quickStats={quickStats}
      hits={hits}
      misses={misses}
      sent={sent}
      friendRecommendations={friendRecommendations}
      renderRecommendationCard={(rec, isReceived, index = 0) => {
        const senderName = isReceived
          ? userNameMap.get(rec.from_user_id) || "Unknown User"
          : userNameMap.get(rec.to_user_id) || "Unknown User";

        return (
          <MediaRecommendationCard
            key={rec.id}
            rec={rec}
            index={index}
            isReceived={isReceived}
            senderName={senderName}
            onStatusUpdate={async (recId, status, comment) => {
              try {
                await updateStatus.mutateAsync({ recId, status });
                if (comment !== undefined) {
                  await updateRecipientNote.mutateAsync({
                    recId,
                    note: comment,
                  });
                }
              } catch (error) {
                logger.error("Failed to update recommendation", {
                  error,
                  tabId,
                  recId,
                });
              }
            }}
            onDelete={async (recId) => {
              try {
                await deleteRec.mutateAsync(recId);
              } catch (error) {
                logger.error("Failed to delete recommendation", {
                  error,
                  tabId,
                  recId,
                });
              }
            }}
            onUpdateSenderComment={async (recId, note) => {
              try {
                await updateSenderNote.mutateAsync({ recId, note });
              } catch (error) {
                logger.error("Failed to update sender comment", {
                  error,
                  tabId,
                  recId,
                });
              }
            }}
            renderMediaArt={(item) => {
              const imageUrl =
                item.poster_url || item.cover_url || item.background_image;
              if (imageUrl) {
                return (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-12 h-16 rounded object-cover"
                  />
                );
              }
              const FallbackIcon =
                tabId === "movies-tv"
                  ? item.media_type === "tv"
                    ? TvIcon
                    : Clapperboard
                  : tabId === "books"
                    ? BookOpen
                    : tabId === "games"
                      ? Gamepad2
                      : Music;
              return (
                <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <FallbackIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
              );
            }}
            renderMediaInfo={(item) => (
              <>
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </div>
                {item.subtitle ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.subtitle}
                  </div>
                ) : null}
                {item.release_date || item.genres || item.platforms ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {item.release_date || item.genres || item.platforms}
                  </div>
                ) : null}
                {item.overview ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.overview}
                  </div>
                ) : null}
              </>
            )}
          />
        );
      }}
    />
  );
}
