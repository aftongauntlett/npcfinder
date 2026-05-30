import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { updateUserProfile } from "../../lib/profiles";
import { logger } from "../../lib/logger";
import {
  Button,
  ConfirmDialog,
  Card,
  SkeletonCard,
  Select,
} from "@/components/shared";
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import CompactColorThemePicker from "../settings/CompactColorThemePicker";
import PasswordChangeSection from "../settings/PasswordChangeSection";
import { DEFAULT_THEME_COLOR } from "../../styles/colorThemes";
import { useTheme } from "../../hooks/useTheme";
import { useNavigationBlock } from "../../hooks/useNavigationBlock";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useProfileQuery } from "../../hooks/useProfileQuery";

interface UserSettingsProps {
  currentUser: User;
}

interface AppearanceData {
  theme_color: string; // Hex color
  secondary_theme_color: string | null; // Manual secondary color, null means use auto
  auto_secondary_color: boolean; // Whether to auto-generate secondary
}

interface Message {
  type: "success" | "error";
  text: string;
}

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Settings",
  description: "Manage app appearance and account security",
  noIndex: true,
};

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser }) => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    theme,
    changeTheme,
    changeThemeColor,
    changeSecondaryThemeColor,
    changeAutoSecondaryColor,
  } = useTheme();

  // Use cached profile query instead of direct API call
  const { data: cachedProfile, isLoading: profileLoading } = useProfileQuery();

  const [appearance, setAppearance] = useState<AppearanceData>({
    theme_color: DEFAULT_THEME_COLOR,
    secondary_theme_color: null,
    auto_secondary_color: true,
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

    const loadedAppearance = {
      theme_color: cachedProfile.theme_color || DEFAULT_THEME_COLOR,
      secondary_theme_color: cachedProfile.secondary_theme_color || null,
      auto_secondary_color: cachedProfile.auto_secondary_color ?? true,
    };

    setAppearance(loadedAppearance);

    // Apply theme color immediately
    if (cachedProfile.theme_color) {
      changeThemeColor(cachedProfile.theme_color);
    }
    if (cachedProfile.secondary_theme_color !== undefined) {
      changeSecondaryThemeColor(cachedProfile.secondary_theme_color || null);
    }
    if (cachedProfile.auto_secondary_color !== undefined) {
      changeAutoSecondaryColor(cachedProfile.auto_secondary_color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedProfile]);

  const handleThemeColorChange = (color: string) => {
    setAppearance((prev) => ({
      ...prev,
      theme_color: color,
    }));
    setHasUnsavedChanges(true);
    setMessage(null);
  };

  const handleSecondaryColorChange = (color: string | null) => {
    setAppearance((prev) => ({
      ...prev,
      secondary_theme_color: color,
    }));
    setHasUnsavedChanges(true);
    setMessage(null);
  };

  const handleAutoSecondaryToggle = (auto: boolean) => {
    setAppearance((prev) => ({
      ...prev,
      auto_secondary_color: auto,
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
    changeThemeColor(appearance.theme_color);
    changeSecondaryThemeColor(appearance.secondary_theme_color || null);
    changeAutoSecondaryColor(appearance.auto_secondary_color);

    try {
      const { error } = await updateUserProfile(currentUser.id, appearance);

      if (error) {
        setMessage({ type: "error", text: "Failed to save appearance" });
      } else {
        // Invalidate the profile cache so it refetches with new data
        await queryClient.invalidateQueries({
          queryKey: ["user-profile", currentUser.id],
        });

        setHasUnsavedChanges(false);
        setMessage({
          type: "success",
          text: "Appearance updated successfully!",
        });
      }
    } catch (error) {
      logger.error("Error saving appearance:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <MainLayout>
        <ContentLayout
          title="Settings"
          description="Manage app appearance and account security"
        >
          <SkeletonCard variant="settings" className="min-h-[420px]" />
        </ContentLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ContentLayout
        title="Settings"
        description="Manage app appearance and account security"
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
          className="space-y-6"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave(e);
            }}
            className="space-y-4"
          >
            <Card variant="glass" spacing="md" border>
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  Appearance
                </h3>
                <Select
                  id="theme"
                  label="Light or Dark Mode"
                  value={theme}
                  onChange={(e) => {
                    changeTheme(e.target.value as "light" | "dark" | "system");
                  }}
                  helperText="Choose Light or Dark mode, or follow your system setting"
                  options={[
                    { value: "system", label: "System" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                />

                <div className="pt-6 border-t border-gray-200/80 dark:border-gray-700/30">
                  <CompactColorThemePicker
                    title=""
                    selectedColor={appearance.theme_color}
                    onColorChange={handleThemeColorChange}
                    secondaryColor={appearance.secondary_theme_color}
                    onSecondaryColorChange={handleSecondaryColorChange}
                    autoSecondary={appearance.auto_secondary_color}
                    onAutoSecondaryToggle={handleAutoSecondaryToggle}
                    showPreview={false}
                    showGuidanceText={false}
                    pickerHeightPx={124}
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleNavigateAway("/app")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Appearance"}
              </Button>
            </div>
          </form>

          <Card variant="glass" spacing="md" border>
            <PasswordChangeSection />
          </Card>
        </motion.div>
      </ContentLayout>
    </MainLayout>
  );
};

export default UserSettings;
