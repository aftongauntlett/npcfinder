import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import {
  Button,
  Card,
  EmptyState,
  LocalSearchInput,
  Modal,
} from "@/components/shared";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import {
  usePlaylists,
  useSetProfileShowcaseOrder,
} from "@/hooks/usePlaylistsQueries";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import {
  getUsernameFromProfileTabId,
  isProfileTabId,
  toProfileTabId,
  useSocialProfileTabs,
} from "@/hooks/useSocialProfileTabs";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import { useDraggableList } from "@/hooks/useDraggableList";
import { getUserProfileByUsername } from "@/lib/profiles";
import { updateUserProfile } from "@/lib/profiles";
import { queryKeys } from "@/lib/queryKeys";
import { usePageMeta } from "@/hooks/usePageMeta";
import { uploadProfilePhoto } from "@/lib/profilePhotos";
import ProfileInformationSection from "@/components/settings/ProfileInformationSection";
import { logger } from "@/lib/logger";
import {
  Cloud,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  ListMusic,
  Plus,
  Settings,
  UserCircle2,
  GripVertical,
  X,
} from "lucide-react";

interface EditableProfile {
  username: string;
  display_name: string;
  bio: string;
  birthday: string;
  location: string;
  profile_picture_url: string;
  personal_links: string[];
}

interface Message {
  type: "success" | "error";
  text: string;
}

type SocialPlatform = "bluesky" | "linkedin" | "instagram" | "github";

interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

function normalizeLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.replace(/\r\n/g, "\n"))
    .flatMap((entry) => entry.split(/\n|\\n/g))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidate = /^(https?:)?\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function detectSocialPlatform(hostname: string): SocialPlatform | null {
  const host = hostname.toLowerCase();

  if (host.includes("bsky.app") || host.includes("bluesky")) {
    return "bluesky";
  }
  if (host.includes("linkedin.com")) {
    return "linkedin";
  }
  if (host.includes("instagram.com")) {
    return "instagram";
  }
  if (host.includes("github.com")) {
    return "github";
  }

  return null;
}

function extractSocialLinks(links: string[]): SocialLink[] {
  const ordered: SocialPlatform[] = [
    "bluesky",
    "linkedin",
    "instagram",
    "github",
  ];
  const map = new Map<SocialPlatform, string>();

  for (const link of links) {
    const normalized = normalizeUrl(link);
    if (!normalized) continue;

    const parsed = new URL(normalized);
    const platform = detectSocialPlatform(parsed.hostname);
    if (!platform) continue;
    if (!map.has(platform)) {
      map.set(platform, normalized);
    }
  }

  return ordered
    .filter((platform) => map.has(platform))
    .map((platform) => ({ platform, url: map.get(platform)! }));
}

function formatBirthday(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toEditableProfile(
  profile: {
    username?: string | null;
    display_name?: string | null;
    bio?: string | null;
    birthday?: string | null;
    location?: string | null;
    profile_picture_url?: string | null;
    personal_links?: unknown;
  } | null,
): EditableProfile {
  return {
    username: profile?.username || "",
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    birthday: profile?.birthday || "",
    location: profile?.location || "",
    profile_picture_url: profile?.profile_picture_url || "",
    personal_links: normalizeLinks(profile?.personal_links),
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { username } = useParams<{ username?: string }>();
  const { profileTabs, upsertProfileTab, removeProfileTab } =
    useSocialProfileTabs();

  const selfProfileQuery = useProfileQuery();

  const profileByUsernameQuery = useQuery({
    queryKey: queryKeys.profiles.byUsername(username || ""),
    enabled: !!username,
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await getUserProfileByUsername(username);
      if (error) throw error;
      return data;
    },
  });

  const profile = username
    ? profileByUsernameQuery.data
    : selfProfileQuery.data;

  const isLoading = username
    ? profileByUsernameQuery.isLoading
    : selfProfileQuery.isLoading;

  const isOwnProfile = !!profile && profile.user_id === user?.id;
  const [editableProfile, setEditableProfile] = useState<EditableProfile>(
    toEditableProfile(null),
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [showcaseMessage, setShowcaseMessage] = useState<Message | null>(null);
  const [showcaseQuery, setShowcaseQuery] = useState("");
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined,
  );
  const setProfileShowcaseOrder = useSetProfileShowcaseOrder();

  const { data: friendsDirectoryData } = useUserDirectory("", 1, 1, user?.id);
  const friendsCount = friendsDirectoryData?.totalCount ?? 0;

  const socialTabs = useMemo(
    () => [
      { id: "profile", label: "Profile" },
      { id: "friends", label: "Friends", badge: friendsCount },
      ...profileTabs.map((tab) => ({
        id: toProfileTabId(tab.username),
        label: tab.label,
        closeable: true,
      })),
    ],
    [friendsCount, profileTabs],
  );

  useEffect(() => {
    if (!profile || !isOwnProfile || hasProfileChanges) return;
    setEditableProfile(toEditableProfile(profile));
  }, [profile, isOwnProfile, hasProfileChanges]);

  useEffect(() => {
    if (!username || !profile || isOwnProfile) {
      return;
    }

    upsertProfileTab(
      username,
      profile.display_name || profile.username || username,
    );
  }, [
    isOwnProfile,
    profile,
    profile?.display_name,
    profile?.username,
    upsertProfileTab,
    username,
  ]);

  const links = useMemo(
    () => normalizeLinks(profile?.personal_links),
    [profile],
  );
  const socialLinks = useMemo(() => extractSocialLinks(links), [links]);
  const birthdayDisplay = useMemo(
    () => formatBirthday(profile?.birthday),
    [profile?.birthday],
  );

  const { data: playlists = [] } = usePlaylists();
  const profileOwnerPlaylists = useMemo(
    () =>
      playlists.filter((playlist) => playlist.owner_id === profile?.user_id),
    [playlists, profile?.user_id],
  );

  const topPlaylists = useMemo(
    () =>
      profileOwnerPlaylists
        .filter(
          (playlist) =>
            playlist.profile_showcase_rank !== null && !playlist.is_private,
        )
        .sort(
          (a, b) =>
            (a.profile_showcase_rank || 99) - (b.profile_showcase_rank || 99),
        )
        .slice(0, 8),
    [profileOwnerPlaylists],
  );

  const topPlaylistIds = useMemo(
    () => topPlaylists.map((playlist) => playlist.id),
    [topPlaylists],
  );

  const ownPlaylists = useMemo(
    () => playlists.filter((playlist) => playlist.owner_id === user?.id),
    [playlists, user?.id],
  );

  const ownPlaylistById = useMemo(
    () => new Map(ownPlaylists.map((playlist) => [playlist.id, playlist])),
    [ownPlaylists],
  );

  const showcaseCandidates = useMemo(() => {
    const selectedSet = new Set(topPlaylistIds);
    const query = showcaseQuery.trim().toLowerCase();

    return ownPlaylists
      .filter((playlist) => !selectedSet.has(playlist.id))
      .filter((playlist) => !playlist.is_private)
      .filter((playlist) => {
        if (!query) return true;

        const haystack = [playlist.name, playlist.description || ""]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  }, [ownPlaylists, showcaseQuery, topPlaylistIds]);

  const handleSaveShowcase = async (orderedPlaylistIds: string[]) => {
    if (!isOwnProfile) return;

    setShowcaseMessage(null);

    try {
      await setProfileShowcaseOrder.mutateAsync(orderedPlaylistIds.slice(0, 8));
    } catch (error) {
      logger.error("Failed to update Top 8 playlists", { error });
      setShowcaseMessage({
        type: "error",
        text: "Could not update Top 8. Please try again.",
      });
    }
  };

  const handleAddToShowcase = (playlistId: string) => {
    if (topPlaylistIds.length >= 8) {
      setShowcaseMessage({
        type: "error",
        text: "Top 8 is full. Remove one before adding another.",
      });
      return;
    }

    const playlist = ownPlaylistById.get(playlistId);
    if (!playlist || playlist.is_private) {
      setShowcaseMessage({
        type: "error",
        text: "Only public playlists can be added to Top 8.",
      });
      return;
    }

    const nextIds = [...topPlaylistIds, playlistId];
    void handleSaveShowcase(nextIds);
  };

  const handleRemoveFromShowcase = (playlistId: string) => {
    const nextIds = topPlaylistIds.filter((id) => id !== playlistId);
    void handleSaveShowcase(nextIds);
  };

  const {
    dragOverId: topShowcaseDragOverId,
    handleDragStart: handleTopShowcaseDragStart,
    handleDragEnd: handleTopShowcaseDragEnd,
    handleDragOver: handleTopShowcaseDragOver,
    handleDragLeave: handleTopShowcaseDragLeave,
    handleDrop: handleTopShowcaseDrop,
  } = useDraggableList(topPlaylists, (reordered) => {
    if (setProfileShowcaseOrder.isPending) {
      return;
    }

    void handleSaveShowcase(reordered.map((playlist) => playlist.id));
  });

  const handleProfileFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = event.target;
    let { value } = event.target;

    if (name === "username") {
      value = value.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 30);
      setUsernameError(undefined);
    }

    setEditableProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasProfileChanges(true);
    setProfileMessage(null);
  };

  const handlePersonalLinksChange = (value: string) => {
    const links = value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);

    setEditableProfile((prev) => ({
      ...prev,
      personal_links: links,
    }));
    setHasProfileChanges(true);
    setProfileMessage(null);
  };

  const handleUploadPhoto = async (file: File) => {
    if (!user) return;

    const validTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!validTypes.has(file.type)) {
      setProfileMessage({
        type: "error",
        text: "Use JPG, PNG, or WEBP for profile photos.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({
        type: "error",
        text: "Profile photos must be 5MB or smaller.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setProfileMessage(null);

    try {
      const photoUrl = await uploadProfilePhoto(user.id, file);
      setEditableProfile((prev) => ({
        ...prev,
        profile_picture_url: photoUrl,
      }));
      setHasProfileChanges(true);
      setProfileMessage({
        type: "success",
        text: "Photo uploaded. Save profile to publish it.",
      });
    } catch (error) {
      logger.error("Failed to upload profile photo", { error });
      setProfileMessage({
        type: "error",
        text: "Failed to upload photo. Please try again.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setEditableProfile((prev) => ({
      ...prev,
      profile_picture_url: "",
    }));
    setHasProfileChanges(true);
    setProfileMessage(null);
  };

  const handleOpenEditModal = () => {
    if (!profile) return;
    setEditableProfile(toEditableProfile(profile));
    setHasProfileChanges(false);
    setProfileMessage(null);
    setUsernameError(undefined);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditableProfile(toEditableProfile(profile ?? null));
    setIsEditModalOpen(false);
    setHasProfileChanges(false);
    setProfileMessage(null);
    setUsernameError(undefined);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setUsernameError(undefined);

    if (!editableProfile.username || editableProfile.username.length < 3) {
      setProfileMessage({
        type: "error",
        text: "Username must be at least 3 characters.",
      });
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const { data, error } = await updateUserProfile(user.id, editableProfile);

      if (error) {
        const duplicateUsername =
          error.code === "23505" &&
          (error.message.toLowerCase().includes("username") ||
            error.message
              .toLowerCase()
              .includes("idx_user_profiles_username_unique") ||
            (error.details || "").toLowerCase().includes("lower(username)"));

        if (duplicateUsername) {
          setUsernameError("This username is already in use.");
          setProfileMessage({
            type: "error",
            text: "Username already in use. Please choose another.",
          });
        } else {
          setProfileMessage({ type: "error", text: "Failed to save profile." });
        }
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["user-profile", user.id],
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.profiles.byUsername(profile.username),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.profiles.byUsername(editableProfile.username),
          }),
        ]);

        setHasProfileChanges(false);
        setProfileMessage(null);
        setIsEditModalOpen(false);

        if (username && data?.username && data.username !== username) {
          void navigate(`/app/profile/${data.username}`, { replace: true });
        }
      }
    } catch (error) {
      logger.error("Error saving profile", { error });
      setProfileMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  usePageMeta({
    title: profile?.display_name
      ? `${profile.display_name} • Profile`
      : "Profile",
    description: "A personal profile in your private invite-only circle.",
    noIndex: true,
  });

  if (isLoading) {
    return (
      <AppLayout title="Profile" description="Loading profile...">
        <div className="container mx-auto px-4 sm:px-6 pb-8 text-sm text-gray-500 dark:text-gray-400">
          Loading profile...
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Profile" description="This profile could not be found.">
        <div className="container mx-auto px-4 sm:px-6 pb-8">
          <EmptyState
            icon={UserCircle2}
            title="Profile not found"
            description="That username does not exist in this space."
          />
        </div>
      </AppLayout>
    );
  }

  const handleSocialTabChange = (tabId: string) => {
    if (isProfileTabId(tabId)) {
      const tabUsername = getUsernameFromProfileTabId(tabId);
      if (tabUsername) {
        void navigate(`/app/profile/${encodeURIComponent(tabUsername)}`);
      }
      return;
    }

    if (tabId === "friends") {
      void navigate("/app/friends");
      return;
    }

    if (selfProfileQuery.data?.username) {
      void navigate(`/app/profile/${selfProfileQuery.data.username}`);
      return;
    }

    void navigate("/app/profile");
  };

  const activeSocialTab =
    username && !isOwnProfile ? toProfileTabId(username) : "profile";

  const handleSocialTabClose = (tabId: string) => {
    const tabUsername = getUsernameFromProfileTabId(tabId);
    if (!tabUsername) {
      return;
    }

    removeProfileTab(tabUsername);

    if (activeSocialTab === tabId) {
      if (selfProfileQuery.data?.username) {
        void navigate(`/app/profile/${selfProfileQuery.data.username}`);
      } else {
        void navigate("/app/profile");
      }
    }
  };

  const socialIconConfig: Record<
    SocialPlatform,
    { label: string; Icon: typeof ExternalLink }
  > = {
    bluesky: { label: "Bluesky", Icon: Cloud },
    linkedin: { label: "LinkedIn", Icon: Linkedin },
    instagram: { label: "Instagram", Icon: Instagram },
    github: { label: "GitHub", Icon: Github },
  };

  return (
    <AppLayout
      title={profile.display_name || profile.username}
      description="A small window into this person and what they share."
      tabs={socialTabs}
      activeTab={activeSocialTab}
      onTabChange={handleSocialTabChange}
      onTabClose={handleSocialTabClose}
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-5 pb-8">
        <Card variant="glass" border spacing="md" className="space-y-2">
          <div className="flex items-stretch justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt=""
                  className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl bg-primary/15 text-primary dark:text-primary-light flex items-center justify-center text-5xl font-semibold">
                  {(profile.display_name || profile.username || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{profile.username}
                </p>
                {profile.bio ? (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No about blurb yet.
                  </p>
                )}

                {(profile.location || birthdayDisplay) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {[profile.location, birthdayDisplay]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

                {(socialLinks.length > 0 ||
                  links.length > socialLinks.length) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {socialLinks.map((link) => {
                      const iconMeta = socialIconConfig[link.platform];
                      const Icon = iconMeta.Icon;

                      return (
                        <a
                          key={`${link.platform}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:text-gray-200 dark:hover:text-primary-light"
                          aria-label={iconMeta.label}
                          title={iconMeta.label}
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      );
                    })}

                    {links
                      .filter((link) => {
                        const normalized = normalizeUrl(link);
                        if (!normalized) return false;
                        return !socialLinks.some(
                          (social) => social.url === normalized,
                        );
                      })
                      .map((link) => {
                        const normalized = normalizeUrl(link);
                        if (!normalized) return null;

                        return (
                          <a
                            key={normalized}
                            href={normalized}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(normalized).hostname.replace(/^www\./, "")}
                          </a>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <div className="flex min-h-[9rem] sm:min-h-[10rem] flex-col items-end justify-between">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  icon={<Settings className="w-4 h-4" />}
                  onClick={handleOpenEditModal}
                  className="shrink-0"
                >
                  Edit Profile
                </Button>

                <p className="text-xs italic text-right text-gray-500 dark:text-gray-400">
                  This is exactly how your profile appears to everyone else.
                </p>
              </div>
            )}
          </div>
        </Card>

        {isOwnProfile && user && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            title="Edit Profile"
            maxWidth="2xl"
          >
            <div className="p-6 space-y-4">
              {profileMessage && (
                <div
                  role="alert"
                  className={`p-3 rounded-lg text-sm ${
                    profileMessage.type === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSaveProfile();
                }}
                className="space-y-4"
              >
                <ProfileInformationSection
                  username={editableProfile.username}
                  usernameError={usernameError}
                  displayName={editableProfile.display_name}
                  bio={editableProfile.bio}
                  birthday={editableProfile.birthday}
                  location={editableProfile.location}
                  personalLinksText={editableProfile.personal_links.join("\n")}
                  profilePictureUrl={editableProfile.profile_picture_url}
                  isUploadingPhoto={isUploadingPhoto}
                  email={user.email || ""}
                  onChange={handleProfileFieldChange}
                  onPersonalLinksChange={handlePersonalLinksChange}
                  onUploadPhoto={(file) => {
                    void handleUploadPhoto(file);
                  }}
                  onRemovePhoto={handleRemovePhoto}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={handleCloseEditModal}
                    disabled={isSavingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isSavingProfile}
                    disabled={!hasProfileChanges || isSavingProfile}
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 8 Playlists
            </h2>
            {isOwnProfile && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {topPlaylists.length}/8 selected
              </span>
            )}
          </div>

          {isOwnProfile && (
            <Card variant="glass" border spacing="md" className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose up to 8 of your public playlists to feature on your
                profile.
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Private playlists cannot appear in Top 8.
              </p>

              {topPlaylists.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Drag to reorder
                  </p>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {topPlaylists.map((playlist, index) => {
                      const isDropTarget =
                        topShowcaseDragOverId === String(playlist.id);

                      return (
                        <div
                          key={`top-order-${playlist.id}`}
                          draggable={!setProfileShowcaseOrder.isPending}
                          onDragStart={(event) =>
                            handleTopShowcaseDragStart(event, playlist)
                          }
                          onDragEnd={handleTopShowcaseDragEnd}
                          onDragOver={(event) =>
                            handleTopShowcaseDragOver(event, playlist)
                          }
                          onDragLeave={handleTopShowcaseDragLeave}
                          onDrop={(event) =>
                            handleTopShowcaseDrop(event, playlist)
                          }
                          className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                            isDropTarget
                              ? "bg-primary/10 dark:bg-primary-light/10"
                              : "bg-transparent"
                          } ${
                            setProfileShowcaseOrder.isPending
                              ? "cursor-wait"
                              : "cursor-grab active:cursor-grabbing"
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {index + 1}. {playlist.name}
                            </p>
                          </div>

                          <Button
                            variant="subtle"
                            size="sm"
                            icon={<X className="w-4 h-4" />}
                            onClick={() =>
                              handleRemoveFromShowcase(playlist.id)
                            }
                            disabled={setProfileShowcaseOrder.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <LocalSearchInput
                value={showcaseQuery}
                onChange={setShowcaseQuery}
                placeholder="Search your playlists to add to Top 8..."
              />

              {showcaseMessage && (
                <div
                  role="alert"
                  className={`p-2.5 rounded-lg text-sm ${
                    showcaseMessage.type === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {showcaseMessage.text}
                </div>
              )}

              {showcaseCandidates.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No public playlists match your search.
                </p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[18rem] overflow-y-auto">
                  {showcaseCandidates.map((playlist) => (
                    <div
                      key={`showcase-candidate-${playlist.id}`}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {playlist.name}
                        </p>
                        {playlist.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {playlist.description}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => handleAddToShowcase(playlist.id)}
                        disabled={
                          setProfileShowcaseOrder.isPending ||
                          topPlaylists.length >= 8
                        }
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {topPlaylists.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title="No featured playlists yet"
              description={
                isOwnProfile
                  ? "Use the search above to choose up to eight playlists for your profile."
                  : "This person has not featured playlists yet."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topPlaylists.map((playlist) => (
                <div key={playlist.id}>
                  <PlaylistCard
                    playlist={playlist}
                    isOwner={playlist.owner_id === user?.id}
                    onClick={() => {
                      void navigate(`/app/playlists/${playlist.slug}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
