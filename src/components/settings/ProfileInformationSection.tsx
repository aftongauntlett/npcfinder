import React from "react";
import { useDropzone } from "react-dropzone";
import { Button, Input, Textarea } from "@/components/shared";
import { ImagePlus, Trash2 } from "lucide-react";

interface ProfileInformationSectionProps {
  bio: string;
  birthday: string;
  location: string;
  personalLinksText: string;
  profilePictureUrl: string;
  isUploadingPhoto: boolean;
  email: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onPersonalLinksChange: (value: string) => void;
  onUploadPhoto: (file: File) => void;
  onRemovePhoto: () => void;
}

const ProfileInformationSection: React.FC<ProfileInformationSectionProps> = ({
  bio,
  birthday,
  location,
  personalLinksText,
  profilePictureUrl,
  isUploadingPhoto,
  email,
  onChange,
  onPersonalLinksChange,
  onUploadPhoto,
  onRemovePhoto,
}) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        onUploadPhoto(file);
      }
    },
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: false,
    noClick: true,
    disabled: isUploadingPhoto,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
        Profile Information
      </h3>
      <div
        {...getRootProps()}
        className={`rounded-lg border border-dashed p-3 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-3">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt=""
              className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-primary/15 text-primary dark:text-primary-light flex items-center justify-center text-2xl font-semibold">
              {(displayName || username || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Drag and drop an image, or choose one manually.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ImagePlus className="w-4 h-4" />}
                loading={isUploadingPhoto}
                disabled={isUploadingPhoto}
                onClick={open}
              >
                {isUploadingPhoto ? "Uploading..." : "Choose Image"}
              </Button>
              {profilePictureUrl && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={onRemovePhoto}
                  disabled={isUploadingPhoto}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG, WEBP up to 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          id="bio"
          name="bio"
          label="About"
          value={bio}
          onChange={onChange}
          rows={4}
          maxLength={400}
          placeholder="A little about you"
        />

        <Input
          id="birthday"
          name="birthday"
          label="Birthday"
          type="date"
          value={birthday}
          onChange={onChange}
        />

        <Input
          id="location"
          name="location"
          label="Location"
          type="text"
          value={location}
          onChange={onChange}
          placeholder="City, Region"
        />

        <Textarea
          id="personal_links"
          name="personal_links"
          label="Personal Links"
          value={personalLinksText}
          onChange={(event) => onPersonalLinksChange(event.target.value)}
          rows={4}
          placeholder="One URL per line:\nhttps://bsky.app/profile/yourname\nhttps://linkedin.com/in/yourname\nhttps://instagram.com/yourname\nhttps://github.com/yourname"
          helperText="Enter one full URL per line. We auto-detect Bluesky, LinkedIn, Instagram, and GitHub for icon shortcuts."
        />

        <Input
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={email}
          disabled
          helperText="Your email cannot be changed"
        />
      </div>
    </div>
  );
};

export default ProfileInformationSection;
