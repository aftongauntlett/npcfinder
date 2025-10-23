import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User as UserIcon, Save } from "lucide-react";
import { getUserProfile, upsertUserProfile } from "../../lib/profiles";
import { logger } from "../../lib/logger";
import Button from "../shared/Button";
import Input from "../shared/Input";
import Textarea from "../shared/Textarea";
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import ColorThemePicker from "../settings/ColorThemePicker";
import { cards } from "../../data/dashboardCards";
import { DEFAULT_THEME_COLOR } from "../../styles/colorThemes";
import { useTheme } from "../../hooks/useTheme";
import { useNavigationBlock } from "../../hooks/useNavigationBlock";

interface UserSettingsProps {
  currentUser: User;
}

interface ProfileData {
  display_name: string;
  bio: string;
  visible_cards: string[];
  theme_color: string; // Hex color
}

interface Message {
  type: "success" | "error";
  text: string;
}

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { changeThemeColor } = useTheme();

  // Default to all cards visible
  const allCardIds = cards.map((c) => c.cardId);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    bio: "",
    visible_cards: allCardIds,
    theme_color: DEFAULT_THEME_COLOR,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const initialProfileRef = useRef<ProfileData | null>(null);

  // Warn before closing browser/tab with unsaved changes
  // Note: This doesn't block sidebar/back button navigation automatically.
  // For that, we'd need to migrate App.tsx to use createBrowserRouter.
  // Current approach: warn on close, require manual confirmation for nav buttons.
  useNavigationBlock({ when: hasUnsavedChanges });

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await getUserProfile(currentUser.id);

      // Handle case where table doesn't exist (using mock data)
      if (error && error.code === "PGRST205") {
        logger.debug("Using local profile (database table not set up yet)");
        // Use defaults from localStorage
        const savedColor =
          localStorage.getItem("themeColor") || DEFAULT_THEME_COLOR;
        setProfile({
          display_name: currentUser.email || "",
          bio: "",
          visible_cards: allCardIds,
          theme_color: savedColor,
        });
        changeThemeColor(savedColor);
      } else if (error) {
        logger.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load profile" });
      } else if (data) {
        const loadedProfile = {
          display_name: data.display_name || currentUser.email || "",
          bio: data.bio || "",
          visible_cards: data.visible_cards || allCardIds,
          theme_color: data.theme_color || DEFAULT_THEME_COLOR,
        };
        setProfile(loadedProfile);
        initialProfileRef.current = loadedProfile;

        // Apply theme color immediately
        if (data.theme_color) {
          changeThemeColor(data.theme_color);
        }
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      // Fall back to local defaults
      const savedColor =
        localStorage.getItem("themeColor") || DEFAULT_THEME_COLOR;
      setProfile({
        display_name: currentUser.email || "",
        bio: "",
        visible_cards: allCardIds,
        theme_color: savedColor,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
    setMessage(null);
  };

  const handleThemeColorChange = (color: string) => {
    setProfile((prev) => ({
      ...prev,
      theme_color: color,
    }));
    setHasUnsavedChanges(true);
    setMessage(null);
  };

  const handleNavigateAway = (path: string) => {
    if (hasUnsavedChanges) {
      pendingNavigationRef.current = path;
      setShowConfirmDialog(true);
    } else {
      void navigate(path);
    }
  };

  const confirmNavigation = () => {
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
    if (pendingNavigationRef.current) {
      void navigate(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  };

  const cancelNavigation = () => {
    setShowConfirmDialog(false);
    pendingNavigationRef.current = null;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await upsertUserProfile(currentUser.id, profile);

      // Handle case where table doesn't exist (using mock data)
      if (error && error.code === "PGRST205") {
        logger.debug("Saving to localStorage (database table not set up yet)");
        // Save theme color to localStorage
        localStorage.setItem("themeColor", profile.theme_color);
        changeThemeColor(profile.theme_color);
        setHasUnsavedChanges(false);
        setMessage({ type: "success", text: "Settings saved locally!" });
        // Navigate back to dashboard after successful save
        setTimeout(() => {
          void navigate("/app");
        }, 1000);
      } else if (error) {
        setMessage({ type: "error", text: "Failed to save profile" });
      } else {
        // Invalidate the profile cache so Navigation updates immediately
        await queryClient.invalidateQueries({
          queryKey: ["user-profile", currentUser.id],
        });

        // Apply theme color immediately after save
        changeThemeColor(profile.theme_color);
        setHasUnsavedChanges(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Navigate back to dashboard after successful save
        setTimeout(() => {
          void navigate("/app");
        }, 1000);
      }
    } catch (error) {
      logger.error("Error saving profile:", error);
      // Fall back to localStorage
      localStorage.setItem("themeColor", profile.theme_color);
      changeThemeColor(profile.theme_color);
      setHasUnsavedChanges(false);
      setMessage({ type: "success", text: "Settings saved locally!" });
      setTimeout(() => {
        void navigate("/app");
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <ContentLayout
          title="Profile Settings"
          description="Customize your profile and dashboard preferences"
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-900 dark:text-white text-lg sm:text-xl">
              Loading profile...
            </div>
          </div>
        </ContentLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ContentLayout
        title="Profile Settings"
        description="Customize your profile and dashboard preferences"
      >
        {/* Unsaved Changes Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Unsaved Changes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have unsaved changes. Are you sure you want to leave? Your
                changes will be lost.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={cancelNavigation}>
                  Stay on Page
                </Button>
                <Button variant="danger" onClick={confirmNavigation}>
                  Leave Without Saving
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave(e);
          }}
          className="space-y-6"
        >
          {/* Profile Information Card */}
          <div className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-white dark:text-white mb-4 font-heading flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Profile Information
            </h2>
            <div className="space-y-4">
              {/* Display Name */}
              <Input
                id="display_name"
                name="display_name"
                label="Display Name"
                type="text"
                value={profile.display_name}
                onChange={handleChange}
                placeholder="Your display name"
                helperText="This is how your name appears in the greeting"
              />

              {/* Email Address (Read-only) */}
              <Input
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={currentUser.email || ""}
                disabled
                helperText="Your email cannot be changed"
              />

              {/* Bio */}
              <Textarea
                id="bio"
                name="bio"
                label="Bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                maxLength={1000}
                rows={4}
                resize="none"
              />
            </div>
          </div>

          {/* Theme Color Card */}
          <div className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 dark:border-gray-700/50">
            <ColorThemePicker
              selectedColor={profile.theme_color}
              onColorChange={handleThemeColorChange}
            />
          </div>

          {/* Action Buttons Card */}
          <div className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 dark:border-gray-700/50">
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleNavigateAway("/app")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </ContentLayout>
    </MainLayout>
  );
};

export default UserSettings;
