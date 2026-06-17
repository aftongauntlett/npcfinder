import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { updateUserProfile } from "../../lib/profiles";
import { deleteAccount } from "../../lib/auth";
import { logger } from "../../lib/logger";
import {
  Button,
  ConfirmDialog,
  Card,
  Input,
  Select,
  SkeletonCard,
} from "@/components/shared";
import MainLayout from "../layouts/MainLayout";
import ContentLayout from "../layouts/ContentLayout";
import PasswordChangeSection from "../settings/PasswordChangeSection";
import FeedbackSection from "../settings/FeedbackSection";
import { DEFAULT_THEME_COLOR } from "../../styles/colorThemes";
import {
  DEFAULT_FONT_FAMILY,
  FONT_OPTIONS,
  getFontStack,
} from "../../styles/fontThemes";
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
  font_family: string;
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

const isValidHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

const componentToHex = (component: number) =>
  Math.round(component).toString(16).padStart(2, "0");

const hexToRgbInput = (hexColor: string): string => {
  if (!isValidHexColor(hexColor)) return "";

  const hex = hexColor.slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
};

const hexToHslInput = (hexColor: string): string => {
  if (!isValidHexColor(hexColor)) return "";

  const hex = hexColor.slice(1);
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);
    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      case blue:
        hue = (red - green) / delta + 4;
        break;
    }
    hue *= 60;
  }

  return `${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(
    lightness * 100,
  )}%`;
};

const parseColorParts = (value: string): number[] =>
  value
    .replace(/rgba?\(|hsla?\(|\)/gi, "")
    .replace(/\//g, " ")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => Number(part.replace("%", "")));

const rgbInputToHex = (value: string): string | null => {
  const [red, green, blue] = parseColorParts(value);
  if (
    [red, green, blue].some(
      (component) =>
        component === undefined ||
        Number.isNaN(component) ||
        component < 0 ||
        component > 255,
    )
  ) {
    return null;
  }

  return `#${componentToHex(red)}${componentToHex(green)}${componentToHex(
    blue,
  )}`;
};

const hslInputToHex = (value: string): string | null => {
  const [rawHue, rawSaturation, rawLightness] = parseColorParts(value);
  if (
    [rawHue, rawSaturation, rawLightness].some(
      (component) => component === undefined || Number.isNaN(component),
    ) ||
    rawSaturation < 0 ||
    rawSaturation > 100 ||
    rawLightness < 0 ||
    rawLightness > 100
  ) {
    return null;
  }

  const hue = (((rawHue % 360) + 360) % 360) / 360;
  const saturation = rawSaturation / 100;
  const lightness = rawLightness / 100;

  if (saturation === 0) {
    const gray = lightness * 255;
    return `#${componentToHex(gray)}${componentToHex(gray)}${componentToHex(
      gray,
    )}`;
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToRgb = (t: number) => {
    let adjusted = t;
    if (adjusted < 0) adjusted += 1;
    if (adjusted > 1) adjusted -= 1;
    if (adjusted < 1 / 6) return p + (q - p) * 6 * adjusted;
    if (adjusted < 1 / 2) return q;
    if (adjusted < 2 / 3) return p + (q - p) * (2 / 3 - adjusted) * 6;
    return p;
  };

  return `#${componentToHex(hueToRgb(hue + 1 / 3) * 255)}${componentToHex(
    hueToRgb(hue) * 255,
  )}${componentToHex(hueToRgb(hue - 1 / 3) * 255)}`;
};

const UserSettings: React.FC<UserSettingsProps> = ({ currentUser }) => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { changeThemeColor, changeSecondaryThemeColor, changeFontFamily } =
    useTheme();

  // Use cached profile query instead of direct API call
  const { data: cachedProfile, isLoading: profileLoading } = useProfileQuery();

  const [appearance, setAppearance] = useState<AppearanceData>({
    theme_color: DEFAULT_THEME_COLOR,
    secondary_theme_color: null,
    font_family: DEFAULT_FONT_FAMILY,
  });
  const [rgbInput, setRgbInput] = useState(() =>
    hexToRgbInput(DEFAULT_THEME_COLOR),
  );
  const [hslInput, setHslInput] = useState(() =>
    hexToHslInput(DEFAULT_THEME_COLOR),
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const [accountFields, setAccountFields] = useState({
    username: "",
    display_name: "",
  });
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

  useEffect(() => {
    if (!isValidHexColor(appearance.theme_color)) return;

    setRgbInput(hexToRgbInput(appearance.theme_color));
    setHslInput(hexToHslInput(appearance.theme_color));
  }, [appearance.theme_color]);

  // Load profile from cache when available
  useEffect(() => {
    if (!cachedProfile) return;

    const loadedAppearance = {
      theme_color: cachedProfile.theme_color || DEFAULT_THEME_COLOR,
      secondary_theme_color: cachedProfile.secondary_theme_color || null,
      font_family: cachedProfile.font_family || DEFAULT_FONT_FAMILY,
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
    changeFontFamily(cachedProfile.font_family || DEFAULT_FONT_FAMILY);
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
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      changeThemeColor(color);
    }
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    setAppearance((prev) => ({
      ...prev,
      font_family: fontFamily,
    }));
    setHasUnsavedChanges(true);
    setMessage(null);
    changeFontFamily(fontFamily);
  };

  const handleRgbInputChange = (value: string) => {
    setRgbInput(value);
    const hexColor = rgbInputToHex(value);
    if (hexColor) {
      handleThemeColorChange(hexColor);
    }
  };

  const handleHslInputChange = (value: string) => {
    setHslInput(value);
    const hexColor = hslInputToHex(value);
    if (hexColor) {
      handleThemeColorChange(hexColor);
    }
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
    changeFontFamily(appearance.font_family);

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

  const selectedFontStack = getFontStack(appearance.font_family);

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
          {/* Account + Password — 2 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Account Details */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveAccount(e);
              }}
              className="h-full"
            >
              <Card
                variant="glass"
                spacing="md"
                border
                className="h-full flex flex-col justify-between"
              >
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

            {/* Change Password */}
            <Card variant="glass" spacing="md" border className="h-full">
              <PasswordChangeSection />
            </Card>
          </div>

          {/* Appearance + Feedback - 2 column layout */}
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Appearance */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave(e);
              }}
              className="h-full"
            >
              <Card
                variant="glass"
                spacing="md"
                border
                className="h-full min-h-[520px] flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    Appearance
                  </h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.65fr)] gap-4 items-start">
                        <h4 className="text-sm font-bold text-primary">
                          Example Color
                        </h4>
                        <h4 className="hidden text-sm font-bold text-primary sm:block">
                          Hex Code
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.65fr)] gap-4 items-start">
                        <HexColorPicker
                          color={appearance.theme_color}
                          onChange={handleThemeColorChange}
                          style={{ width: "100%", height: "220px" }}
                        />
                        <div className="space-y-3">
                          <Input
                            label="Hex Code"
                            type="text"
                            value={appearance.theme_color}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                handleThemeColorChange(value);
                              }
                            }}
                            placeholder="#9333ea"
                            maxLength={7}
                            aria-label="Hex Code"
                            containerClassName="sm:[&>label]:sr-only"
                            inputClassName="py-2 text-sm"
                          />
                          <Input
                            label="RGB"
                            type="text"
                            value={rgbInput}
                            onChange={(e) =>
                              handleRgbInputChange(e.target.value)
                            }
                            placeholder="14, 255, 216"
                            inputClassName="py-2 text-sm"
                          />
                          <Input
                            label="HSL"
                            type="text"
                            value={hslInput}
                            onChange={(e) =>
                              handleHslInputChange(e.target.value)
                            }
                            placeholder="174, 100%, 53%"
                            inputClassName="py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.65fr)] gap-4 items-start">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-primary">
                          Example Text
                        </h4>
                        <div
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 p-4 space-y-3"
                          style={{ fontFamily: selectedFontStack }}
                        >
                          <div
                            className="text-lg font-bold leading-tight"
                            style={{
                              color: appearance.theme_color,
                            }}
                          >
                            Title text
                          </div>
                          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            Example body text shows how your selected font will
                            feel across the app.
                          </p>
                        </div>
                      </div>

                      <Select
                        id="font-family"
                        label="Font"
                        value={appearance.font_family}
                        onChange={(e) => handleFontFamilyChange(e.target.value)}
                        helperText="Applies to your app text after saving."
                        options={FONT_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                          style: { fontFamily: option.stack },
                        }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-5">
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
          </div>

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
