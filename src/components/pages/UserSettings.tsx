import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User as UserIcon, Save, X } from "lucide-react";
import { getUserProfile, upsertUserProfile } from "../../lib/profiles";
import Button from "../shared/Button";
import PageContentContainer from "../layouts/PageContentContainer";
import ColorThemePicker from "../settings/ColorThemePicker";
import { cards } from "../../data/dashboardCards";
import { type ThemeColorName } from "../../styles/colorThemes";
import { useTheme } from "../../hooks/useTheme";
import DashboardCustomizer from "../settings/DashboardCustomizer";

interface UserSettingsProps {
  currentUser: User;
}

interface ProfileData {
  display_name: string;
  visible_cards: string[];
  theme_color: ThemeColorName;
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
    visible_cards: allCardIds,
    theme_color: "purple",
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<Message | null>(null);

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
        console.log("Using local profile (database table not set up yet)");
        // Use defaults from localStorage
        const savedColor =
          (localStorage.getItem("themeColor") as ThemeColorName) || "purple";
        setProfile({
          display_name: currentUser.email || "",
          visible_cards: allCardIds,
          theme_color: savedColor,
        });
        changeThemeColor(savedColor);
      } else if (error) {
        console.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load profile" });
      } else if (data) {
        setProfile({
          display_name: data.display_name || currentUser.email || "",
          visible_cards: data.visible_cards || allCardIds,
          theme_color: (data.theme_color as ThemeColorName) || "purple",
        });

        // Apply theme color immediately
        if (data.theme_color) {
          changeThemeColor(data.theme_color);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Fall back to local defaults
      const savedColor =
        (localStorage.getItem("themeColor") as ThemeColorName) || "purple";
      setProfile({
        display_name: currentUser.email || "",
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
    setMessage(null);
  };

  const handleToggleCard = (cardId: string) => {
    setProfile((prev) => {
      const isVisible = prev.visible_cards.includes(cardId);
      const newVisibleCards = isVisible
        ? prev.visible_cards.filter((id) => id !== cardId)
        : [...prev.visible_cards, cardId];

      // Ensure at least one card is visible
      if (newVisibleCards.length === 0) {
        return prev;
      }

      return {
        ...prev,
        visible_cards: newVisibleCards,
      };
    });
    setMessage(null);
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
        console.log("Saving to localStorage (database table not set up yet)");
        // Save theme color to localStorage
        localStorage.setItem("themeColor", profile.theme_color);
        changeThemeColor(profile.theme_color);
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
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Navigate back to dashboard after successful save
        setTimeout(() => {
          void navigate("/app");
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      // Fall back to localStorage
      localStorage.setItem("themeColor", profile.theme_color);
      changeThemeColor(profile.theme_color);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg sm:text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <PageContentContainer className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserIcon
                className="w-6 sm:w-8 h-6 sm:h-8 text-primary"
                aria-hidden="true"
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
            </div>
            <button
              onClick={() => void navigate("/app")}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6" aria-hidden="true" />
            </button>
          </div>

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

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave(e);
            }}
            className="space-y-6"
          >
            {/* Display Name */}
            <div>
              <label
                htmlFor="display_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={profile.display_name}
                onChange={handleChange}
                placeholder="Your display name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This is how your name appears in the greeting
              </p>
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={currentUser.email || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your email cannot be changed
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <ColorThemePicker
                selectedColor={profile.theme_color}
                onColorChange={(color) => {
                  setProfile((prev) => ({ ...prev, theme_color: color }));
                  setMessage(null);
                }}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <DashboardCustomizer
                visibleCards={profile.visible_cards}
                onToggleCard={handleToggleCard}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate("/app")}
                className="px-8 sm:flex-1"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 sm:flex-1 inline-flex items-center justify-center gap-2 font-medium rounded-md text-sm bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContentContainer>
  );
};

export default UserSettings;
