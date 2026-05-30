import { useCallback, useState } from "react";

const SOCIAL_PROFILE_TABS_STORAGE_KEY = "socialProfileTabs";
const MAX_SOCIAL_PROFILE_TABS = 8;
const PROFILE_TAB_PREFIX = "user:";

export interface SocialProfileTab {
  username: string;
  label: string;
}

function normalizeUsername(username: string): string {
  return username.trim();
}

function normalizeLabel(label: string, fallbackUsername: string): string {
  const trimmed = label.trim();
  return trimmed || fallbackUsername;
}

function readStoredTabs(): SocialProfileTab[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.sessionStorage.getItem(SOCIAL_PROFILE_TABS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const username =
          typeof entry.username === "string"
            ? normalizeUsername(entry.username)
            : "";
        const label =
          typeof entry.label === "string"
            ? normalizeLabel(entry.label, username)
            : "";

        if (!username) {
          return null;
        }

        return { username, label: label || username };
      })
      .filter((entry): entry is SocialProfileTab => entry !== null)
      .slice(-MAX_SOCIAL_PROFILE_TABS);
  } catch {
    return [];
  }
}

function persistTabs(tabs: SocialProfileTab[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SOCIAL_PROFILE_TABS_STORAGE_KEY,
    JSON.stringify(tabs),
  );
}

export function toProfileTabId(username: string): string {
  return `${PROFILE_TAB_PREFIX}${normalizeUsername(username)}`;
}

export function isProfileTabId(tabId: string): boolean {
  return tabId.startsWith(PROFILE_TAB_PREFIX);
}

export function getUsernameFromProfileTabId(tabId: string): string | null {
  if (!isProfileTabId(tabId)) {
    return null;
  }

  const username = tabId.slice(PROFILE_TAB_PREFIX.length).trim();
  return username || null;
}

export function useSocialProfileTabs() {
  const [profileTabs, setProfileTabs] = useState<SocialProfileTab[]>(() =>
    readStoredTabs(),
  );

  const updateTabs = useCallback(
    (updater: (previous: SocialProfileTab[]) => SocialProfileTab[]) => {
      setProfileTabs((previous) => {
        const next = updater(previous).slice(-MAX_SOCIAL_PROFILE_TABS);
        persistTabs(next);
        return next;
      });
    },
    [],
  );

  const upsertProfileTab = useCallback(
    (username: string, label: string) => {
      const normalizedUsername = normalizeUsername(username);
      if (!normalizedUsername) {
        return;
      }

      const normalizedLabel = normalizeLabel(label, normalizedUsername);
      const normalizedKey = normalizedUsername.toLowerCase();

      updateTabs((previous) => {
        const withoutExisting = previous.filter(
          (tab) => tab.username.toLowerCase() !== normalizedKey,
        );

        return [
          ...withoutExisting,
          {
            username: normalizedUsername,
            label: normalizedLabel,
          },
        ];
      });
    },
    [updateTabs],
  );

  const removeProfileTab = useCallback(
    (username: string) => {
      const normalizedUsername = normalizeUsername(username).toLowerCase();
      if (!normalizedUsername) {
        return;
      }

      updateTabs((previous) =>
        previous.filter(
          (tab) => tab.username.toLowerCase() !== normalizedUsername,
        ),
      );
    },
    [updateTabs],
  );

  return {
    profileTabs,
    upsertProfileTab,
    removeProfileTab,
  };
}
