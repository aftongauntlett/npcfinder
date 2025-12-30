import React from "react";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/shared";

interface ProfileInformationSectionProps {
  displayName: string;
  currentUser: User;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const ProfileInformationSection: React.FC<ProfileInformationSectionProps> = ({
  displayName,
  currentUser,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
        Profile Information
      </h3>
      <div className="space-y-4">
        <Input
          id="display_name"
          name="display_name"
          label="Display Name"
          type="text"
          value={displayName}
          onChange={onChange}
          placeholder="Your display name"
          helperText="This is how your name appears in the greeting"
        />

        <Input
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={currentUser.email || ""}
          disabled
          helperText="Your email cannot be changed"
        />
      </div>
    </div>
  );
};

export default ProfileInformationSection;
