import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import AppLayout from "@/components/layouts/AppLayout";
import {
  Button,
  Card,
  EmptyState,
  MediaPageToolbar,
  Modal,
  Pagination,
  Input,
  type FilterSortSection,
} from "@/components/shared";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import {
  getUsernameFromProfileTabId,
  isProfileTabId,
  toProfileTabId,
  useSocialProfileTabs,
} from "@/hooks/useSocialProfileTabs";
import {
  useAssignUserToTag,
  useCreateFriendTag,
  useDeleteFriendTag,
  useFriendTagMembers,
  useFriendTags,
  useRemoveUserFromTag,
} from "@/hooks/useFriendTags";
import { Heart, Tag, Users } from "lucide-react";
import { logger } from "@/lib/logger";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useProfileQuery } from "@/hooks/useProfileQuery";

const pageMetaOptions = {
  title: "Friends",
  description:
    "Browse everyone in your invite-only circle and organize people with private tags.",
  noIndex: true,
};

function formatBirthday(dateValue: string | null): string | null {
  if (!dateValue) return null;

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FriendsPage() {
  usePageMeta(pageMetaOptions);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useAdmin();
  const { data: currentProfile } = useProfileQuery();
  const { profileTabs, upsertProfileTab, removeProfileTab } =
    useSocialProfileTabs();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagError, setNewTagError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({
    tags: ["all"],
  });

  const { data: directoryData, isLoading: usersLoading } = useUserDirectory(
    query,
    page,
    pageSize,
    user?.id,
  );
  const { data: tags = [] } = useFriendTags();
  const { data: tagMembers = [] } = useFriendTagMembers();

  const createTagMutation = useCreateFriendTag();
  const deleteTagMutation = useDeleteFriendTag();
  const assignMutation = useAssignUserToTag();
  const removeMutation = useRemoveUserFromTag();

  const users = directoryData?.users || [];
  const totalCount = directoryData?.totalCount || 0;

  const selectedTagIds = useMemo(() => {
    const value = activeFilters.tags;
    return Array.isArray(value) ? value : ["all"];
  }, [activeFilters.tags]);

  const hasTagFilter =
    selectedTagIds.length > 0 && !selectedTagIds.includes("all");

  const tagsByUserId = useMemo(() => {
    const memberSetByUser = new Map<string, Set<string>>();

    for (const member of tagMembers) {
      if (!memberSetByUser.has(member.target_user_id)) {
        memberSetByUser.set(member.target_user_id, new Set());
      }
      memberSetByUser.get(member.target_user_id)?.add(member.tag_id);
    }

    const tagMap = new Map<string, typeof tags>();
    for (const [targetUserId, tagIdSet] of memberSetByUser.entries()) {
      tagMap.set(
        targetUserId,
        tags.filter((tag) => tagIdSet.has(tag.id)),
      );
    }

    return tagMap;
  }, [tagMembers, tags]);

  const handleCreateTag = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    try {
      await createTagMutation.mutateAsync({ name: normalized });
      return true;
    } catch (error) {
      logger.error("Failed to create friend tag", { error, normalized });
      return false;
    }
  };

  const handleOpenCreateTagModal = () => {
    setNewTagName("");
    setNewTagError(null);
    setIsCreateTagModalOpen(true);
  };

  const handleCloseCreateTagModal = () => {
    setIsCreateTagModalOpen(false);
    setNewTagName("");
    setNewTagError(null);
  };

  const handleCreateTagFromModal = async () => {
    const normalized = newTagName.trim();

    if (!normalized) {
      setNewTagError("Tag name is required.");
      return;
    }

    const created = await handleCreateTag(normalized);
    if (!created) {
      setNewTagError("Could not create tag. It may already exist.");
      return;
    }

    handleCloseCreateTagModal();
  };

  const filterSections = useMemo<FilterSortSection[]>(
    () => [
      {
        id: "tags",
        title: "Private Tags",
        multiSelect: true,
        options: [
          { id: "all", label: "All tags" },
          ...tags.map((tag) => ({ id: tag.id, label: tag.name })),
          { id: "__add_tag__", label: "+ Add private tag" },
        ],
      },
    ],
    [tags],
  );

  const visibleUsers = useMemo(() => {
    if (!hasTagFilter) return users;

    return users.filter((person) => {
      const assignedTags = tagsByUserId.get(person.user_id) || [];
      return assignedTags.some((tag) => selectedTagIds.includes(tag.id));
    });
  }, [hasTagFilter, selectedTagIds, tagsByUserId, users]);

  const totalPages = hasTagFilter
    ? 1
    : Math.max(1, Math.ceil(totalCount / pageSize));

  const paginationTotalItems = hasTagFilter ? visibleUsers.length : totalCount;

  const socialTabs = useMemo(
    () => [
      { id: "profile", label: "Profile" },
      { id: "friends", label: "Friends", badge: totalCount },
      ...profileTabs.map((tab) => ({
        id: toProfileTabId(tab.username),
        label: tab.label,
        closeable: true,
      })),
    ],
    [profileTabs, totalCount],
  );

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTagMutation.mutateAsync(tagId);
    } catch (error) {
      logger.error("Failed to delete friend tag", { error, tagId });
    }
  };

  const handleToggleMembership = async (
    tagId: string,
    targetUserId: string,
  ) => {
    const isAssigned = tagMembers.some(
      (member) =>
        member.tag_id === tagId && member.target_user_id === targetUserId,
    );

    try {
      if (isAssigned) {
        await removeMutation.mutateAsync({ tagId, targetUserId });
      } else {
        await assignMutation.mutateAsync({ tagId, targetUserId });
      }
    } catch (error) {
      logger.error("Failed to toggle friend tag membership", {
        error,
        tagId,
        targetUserId,
      });
    }
  };

  const handleSocialTabChange = (tabId: string) => {
    if (isProfileTabId(tabId)) {
      const tabUsername = getUsernameFromProfileTabId(tabId);
      if (tabUsername) {
        void navigate(`/app/profile/${encodeURIComponent(tabUsername)}`);
      }
      return;
    }

    if (tabId === "profile") {
      if (currentProfile?.username) {
        void navigate(`/app/profile/${currentProfile.username}`);
      } else {
        void navigate("/app/profile");
      }
      return;
    }

    void navigate("/app/friends");
  };

  const handleSocialTabClose = (tabId: string) => {
    const tabUsername = getUsernameFromProfileTabId(tabId);
    if (!tabUsername) {
      return;
    }

    removeProfileTab(tabUsername);
  };

  const openProfile = (username: string, label: string) => {
    upsertProfileTab(username, label);
    void navigate(`/app/profile/${encodeURIComponent(username)}`);
  };

  const handleFilterChange = (
    sectionId: string,
    filterId: string | string[],
  ) => {
    if (sectionId !== "tags") return;

    const values = Array.isArray(filterId) ? filterId : [filterId];

    if (values.includes("__add_tag__")) {
      handleOpenCreateTagModal();

      const cleaned = values.filter((value) => value !== "__add_tag__");
      setActiveFilters((prev) => ({
        ...prev,
        tags: cleaned.length > 0 ? cleaned : ["all"],
      }));
      setPage(1);
      return;
    }

    setActiveFilters((prev) => ({
      ...prev,
      tags: values,
    }));
    setPage(1);
  };

  return (
    <AppLayout
      title="Friends"
      description="A private, trusted circle. Everyone here is part of the same invite-only community."
      tabs={socialTabs}
      activeTab="friends"
      onTabChange={handleSocialTabChange}
      onTabClose={handleSocialTabClose}
    >
      <div className="container mx-auto px-4 sm:px-6 space-y-5 pb-8">
        <div className="space-y-1">
          <MediaPageToolbar
            compactSpacing
            searchConfig={{
              value: query,
              onChange: (value) => {
                setQuery(value);
                setPage(1);
              },
              placeholder: "Search by name, username, bio, or location",
            }}
            filterConfig={{
              type: "menu",
              sections: filterSections,
              activeFilters,
              onFilterChange: handleFilterChange,
            }}
            onAddClick={() => {}}
            hideAddButton
          />

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  <Tag className="w-3 h-3" />
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => void handleDeleteTag(tag.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Modal
          isOpen={isCreateTagModalOpen}
          onClose={handleCloseCreateTagModal}
          title="Create Private Tag"
          maxWidth="md"
        >
          <div className="p-6 space-y-4">
            <Input
              id="new-private-tag-name"
              label="Tag Name"
              value={newTagName}
              onChange={(event) => {
                setNewTagName(event.target.value);
                setNewTagError(null);
              }}
              placeholder="close-friends"
              error={newTagError || undefined}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateTagFromModal();
                }
              }}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="subtle"
                onClick={handleCloseCreateTagModal}
                disabled={createTagMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleCreateTagFromModal()}
                loading={createTagMutation.isPending}
                disabled={createTagMutation.isPending || !newTagName.trim()}
              >
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </div>
          </div>
        </Modal>

        {usersLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading people...
          </div>
        ) : visibleUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query.trim() ? "No matches" : "No people found"}
            description={
              query.trim()
                ? "Try a different search phrase."
                : "People will show up here once they join the app."
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleUsers.map((person) => {
              const initials = (person.display_name || person.username || "U")
                .slice(0, 2)
                .toUpperCase();
              const assignedTags = tagsByUserId.get(person.user_id) || [];
              const birthday = formatBirthday(person.birthday);

              return (
                <Card
                  key={person.user_id}
                  variant="glass"
                  border
                  spacing="md"
                  className="space-y-3 hover:border-primary/50 dark:hover:border-primary-light/50"
                  clickable
                  onClick={() =>
                    openProfile(
                      person.username,
                      person.display_name || person.username,
                    )
                  }
                  aria-label={`Open profile for ${person.display_name || person.username}`}
                >
                  <div className="flex items-start gap-3">
                    {person.profile_picture_url ? (
                      <img
                        src={person.profile_picture_url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/15 text-primary dark:text-primary-light flex items-center justify-center font-semibold">
                        {initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {person.display_name || person.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{person.username}
                      </p>
                      {person.bio && (
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {person.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {(person.location || birthday) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {[
                        person.location,
                        birthday ? `Birthday: ${birthday}` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}

                  {(role === "admin" || role === "super_admin") &&
                    person.invited_by_display_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invited by {person.invited_by_display_name}
                      </p>
                    )}

                  <div className="flex flex-wrap gap-2">
                    {assignedTags.length > 0 ? (
                      assignedTags.map((tag) => (
                        <span
                          key={`${person.user_id}-${tag.id}`}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-primary/10 text-primary dark:text-primary-light"
                        >
                          <Heart className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        No private tags yet
                      </span>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedUserId((current) =>
                            current === person.user_id ? null : person.user_id,
                          );
                        }}
                      >
                        {expandedUserId === person.user_id
                          ? "Hide tag controls"
                          : "Manage tags"}
                      </Button>

                      {expandedUserId === person.user_id && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => {
                            const isAssigned = assignedTags.some(
                              (assigned) => assigned.id === tag.id,
                            );
                            return (
                              <Button
                                key={`${person.user_id}-${tag.id}-toggle`}
                                variant={isAssigned ? "primary" : "secondary"}
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleToggleMembership(
                                    tag.id,
                                    person.user_id,
                                  );
                                }}
                                disabled={
                                  assignMutation.isPending ||
                                  removeMutation.isPending
                                }
                              >
                                {tag.name}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={paginationTotalItems}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </div>
    </AppLayout>
  );
}
