import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { updateUserProfile } from "../../lib/profiles";
import { logger } from "../../lib/logger";
import { Button, ConfirmDialog, Card, SkeletonCard } from "@/components/shared";
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import ProfileInformationSection from "../settings/ProfileInformationSection";
import CompactColorThemePicker from "../settings/CompactColorThemePicker";
import PasswordChangeSection from "../settings/PasswordChangeSection";
import { cards } from "../../data/dashboardCards";
import { DEFAULT_THEME_COLOR } from "../../styles/colorThemes";
import { useTheme } from "../../hooks/useTheme";
import { useNavigationBlock } from "../../hooks/useNavigationBlock";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useProfileQuery } from "../../hooks/useProfileQuery";

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

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Settings",
  description: "Manage your profile, preferences, and account settings",
  noIndex: true,
};

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser }) => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { changeThemeColor } = useTheme();

  // Use cached profile query instead of direct API call
  const { data: cachedProfile, isLoading: profileLoading } = useProfileQuery();

  // Default to all cards visible
  const allCardIds = cards.map((c) => c.cardId);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    bio: "",
    visible_cards: allCardIds,
    theme_color: DEFAULT_THEME_COLOR,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const pendingNavigationRef = useRef<string | null>(null);

  // Warn before closing browser/tab with unsaved changes
  useNavigationBlock({ when: hasUnsavedChanges });

  // Load profile from cache when available
  useEffect(() => {
    if (!cachedProfile) return;

    const loadedProfile = {
      display_name: cachedProfile.display_name || currentUser.email || "",
      bio: cachedProfile.bio || "",
      visible_cards: cachedProfile.visible_cards || allCardIds,
      theme_color: cachedProfile.theme_color || DEFAULT_THEME_COLOR,
    };

    setProfile(loadedProfile);

    // Apply theme color immediately
    if (cachedProfile.theme_color) {
      changeThemeColor(cachedProfile.theme_color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedProfile, currentUser]);

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

    // Apply theme color IMMEDIATELY before saving to ensure UI updates
    changeThemeColor(profile.theme_color);

    try {
      const { error } = await updateUserProfile(currentUser.id, profile);

      if (error) {
        setMessage({ type: "error", text: "Failed to save profile" });
      } else {
        // Invalidate the profile cache so it refetches with new data
        await queryClient.invalidateQueries({
          queryKey: ["user-profile", currentUser.id],
        });

        setHasUnsavedChanges(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (error) {
      logger.error("Error saving profile:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <MainLayout>
        <ContentLayout
          title="Profile Settings"
          description="Customize your profile and dashboard preferences"
        >
          <SkeletonCard variant="settings" className="min-h-[600px]" />
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
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={cancelNavigation}
          onConfirm={confirmNavigation}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
          confirmText="Leave Without Saving"
          cancelText="Stay on Page"
          variant="danger"
        />

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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card variant="glass" spacing="lg" border>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave(e);
              }}
              className="space-y-6"
            >
              {/* Top Row: Profile Information (with Bio) + Change Password */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProfileInformationSection
                  displayName={profile.display_name}
                  bio={profile.bio}
                  currentUser={currentUser}
                  onChange={handleChange}
                />

                <PasswordChangeSection />
              </div>

              {/* Theme Color - Full Width */}
              <div className="pt-6 border-t border-gray-700/30">
                <CompactColorThemePicker
                  selectedColor={profile.theme_color}
                  onColorChange={handleThemeColorChange}
                />
              </div>

              {/* Action Buttons - Bottom Right */}
              <div className="pt-6 border-t border-gray-700/30">
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
          </Card>
        </motion.div>
      </ContentLayout>
    </MainLayout>
  );
};

export default UserSettings;
