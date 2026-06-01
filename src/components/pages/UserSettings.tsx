import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { updateUserProfile } from "../../lib/profiles";
import { signOut, deleteAccount } from "../../lib/auth";
import { logger } from "../../lib/logger";
import {
  Button,
  ConfirmDialog,
  Card,
  Input,
  SkeletonCard,
  Select,
} from "@/components/shared";
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import CompactColorThemePicker from "../settings/CompactColorThemePicker";
import PasswordChangeSection from "../settings/PasswordChangeSection";
import FeedbackSection from "../settings/FeedbackSection";
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
  const { theme, changeTheme, changeThemeColor, changeSecondaryThemeColor } =
    useTheme();

  // Use cached profile query instead of direct API call
  const { data: cachedProfile, isLoading: profileLoading } = useProfileQuery();

  const [appearance, setAppearance] = useState<AppearanceData>({
    theme_color: DEFAULT_THEME_COLOR,
    secondary_theme_color: null,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const [accountFields, setAccountFields] = useState({
    username: "",
    display_name: "",
  });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<Message | null>(null);
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined,
  );

  // Warn before closing browser/tab with unsaved changes
  useNavigationBlock({ when: hasUnsavedChanges });

  // Load profile from cache when available
  useEffect(() => {
    if (!cachedProfile) return;

    const loadedAppearance = {
      theme_color: cachedProfile.theme_color || DEFAULT_THEME_COLOR,
      secondary_theme_color: cachedProfile.secondary_theme_color || null,
    };

    setAppearance(loadedAppearance);

    setAccountFields({
      username: cachedProfile.username || "",
      display_name: cachedProfile.display_name || "",
    });

    // Apply theme color immediately
    if (cachedProfile.theme_color) {
      changeThemeColor(cachedProfile.theme_color);
    }
    if (cachedProfile.secondary_theme_color !== undefined) {
      changeSecondaryThemeColor(cachedProfile.secondary_theme_color || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedProfile]);

  const handleAccountFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleaned =
      name === "username"
        ? value.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 30)
        : value;
    if (name === "username") setUsernameError(undefined);
    setAccountFields((prev) => ({ ...prev, [name]: cleaned }));
    setAccountMessage(null);
  };

  const handleSaveAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    setUsernameError(undefined);

    if (!accountFields.username || accountFields.username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingAccount(true);
    setAccountMessage(null);

    try {
      const { error } = await updateUserProfile(currentUser.id, {
        username: accountFields.username,
        display_name: accountFields.display_name,
      });

      if (error) {
        const isDuplicate =
          error.code === "23505" &&
          (error.message.toLowerCase().includes("username") ||
            error.message
              .toLowerCase()
              .includes("idx_user_profiles_username_unique") ||
            (error.details || "").toLowerCase().includes("lower(username)"));

        if (isDuplicate) {
          setUsernameError("This username is already in use.");
          setAccountMessage({
            type: "error",
            text: "Username already in use. Please choose another.",
          });
        } else {
          setAccountMessage({
            type: "error",
            text: "Failed to save account details.",
          });
        }
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["user-profile", currentUser.id],
        });
        setAccountMessage({
          type: "success",
          text: "Account details updated!",
        });
      }
    } catch (err) {
      logger.error("Error saving account details:", err);
      setAccountMessage({
        type: "error",
        text: "An unexpected error occurred.",
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      logger.error("Failed to sign out", { error });
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmName = cachedProfile?.username || currentUser.email || "";
    if (deleteConfirmText !== confirmName) return;
    setIsDeletingAccount(true);
    setDeleteError(null);
    const { error } = await deleteAccount();
    if (error) {
      logger.error("Account deletion failed", { error });
      setDeleteError("Something went wrong. Please try again.");
      setIsDeletingAccount(false);
      return;
    }
    // Auth state listener in AuthContext will handle redirect on session loss
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
          {/* Password */}
          <Card variant="glass" spacing="md" border>
            <PasswordChangeSection />
          </Card>

          {/* Account Details */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSaveAccount(e);
            }}
            className="space-y-4"
          >
            <Card variant="glass" spacing="md" border>
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  Account
                </h3>
                {accountMessage && (
                  <div
                    role="alert"
                    className={`p-3 rounded-lg text-sm ${
                      accountMessage.type === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {accountMessage.text}
                  </div>
                )}
                <Input
                  id="username"
                  name="username"
                  label="Username"
                  type="text"
                  value={accountFields.username}
                  onChange={handleAccountFieldChange}
                  placeholder="your-handle"
                  helperText="Used for your profile URL. Changing it will break previously shared profile links."
                  error={usernameError}
                />
                <Input
                  id="display_name"
                  name="display_name"
                  label="Display Name"
                  type="text"
                  value={accountFields.display_name}
                  onChange={handleAccountFieldChange}
                  placeholder="Your display name"
                  helperText="This is how your name appears in the greeting"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSavingAccount}
                  disabled={isSavingAccount}
                >
                  {isSavingAccount ? "Saving..." : "Save Account"}
                </Button>
              </div>
            </Card>
          </form>

          {/* Appearance */}
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
                    showPreview={false}
                    showGuidanceText={false}
                    pickerHeightPx={90}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
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
            </Card>
          </form>

          <FeedbackSection />

          {/* Sign Out */}
          <Card variant="glass" spacing="md" border>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Sign Out
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Sign out of your account on this device.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleSignOut()}
                loading={isSigningOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out…" : "Sign Out"}
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-300 dark:border-red-800 overflow-hidden">
            <div className="px-5 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-300 dark:border-red-800">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                Danger Zone
              </h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Delete this account
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Permanently removes your account and all data — tracker,
                    playlists, profile. This cannot be undone.
                  </p>
                </div>
                {!showDeleteConfirm && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setDeleteConfirmText("");
                      setDeleteError(null);
                    }}
                  >
                    Delete account
                  </Button>
                )}
              </div>

              {showDeleteConfirm && (
                <div className="space-y-3 pt-1 border-t border-red-200 dark:border-red-800/60">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    To confirm, type your account name{" "}
                    <span className="font-mono font-semibold">
                      {cachedProfile?.username || currentUser.email}
                    </span>{" "}
                    in the box below.
                  </p>
                  <Input
                    id="delete-confirm"
                    name="delete-confirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={
                      cachedProfile?.username || currentUser.email || ""
                    }
                    autoComplete="off"
                  />
                  {deleteError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                        setDeleteError(null);
                      }}
                      disabled={isDeletingAccount}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void handleDeleteAccount()}
                      loading={isDeletingAccount}
                      disabled={
                        isDeletingAccount ||
                        deleteConfirmText !==
                          (cachedProfile?.username || currentUser.email || "")
                      }
                    >
                      {isDeletingAccount
                        ? "Deleting…"
                        : "Permanently delete my account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </ContentLayout>
    </MainLayout>
  );
};

export default UserSettings;
