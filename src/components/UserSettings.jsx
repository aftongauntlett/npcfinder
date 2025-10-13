import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { User, Save, X } from "lucide-react";
import { getUserProfile, upsertUserProfile } from "../lib/profiles";
import Button from "./shared/Button";

const UserSettings = ({ currentUser, onClose }) => {
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    profile_picture_url: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await getUserProfile(currentUser.id);
      if (error) {
        console.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load profile" });
      } else if (data) {
        setProfile({
          display_name: data.display_name || currentUser.email || "",
          bio: data.bio || "",
          profile_picture_url: data.profile_picture_url || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await upsertUserProfile(currentUser.id, profile);

      if (error) {
        setMessage({ type: "error", text: "Failed to save profile" });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
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
          <form onSubmit={handleSave} className="space-y-6">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This is how others will see your name
              </p>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Brief description for your profile
              </p>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label
                htmlFor="profile_picture_url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Profile Picture URL
              </label>
              <input
                type="url"
                id="profile_picture_url"
                name="profile_picture_url"
                value={profile.profile_picture_url}
                onChange={handleChange}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Link to your profile picture
              </p>
            </div>

            {/* Preview */}
            {profile.profile_picture_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture Preview
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-600"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This is how your profile picture will appear
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              {onClose && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="px-8"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

UserSettings.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

export default UserSettings;
