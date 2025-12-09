import React from "react";
import { Textarea } from "@/components/shared";

interface BioSectionProps {
  bio: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const BioSection: React.FC<BioSectionProps> = ({ bio, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-300 dark:text-gray-300 mb-3">
        Bio
      </h3>
      <Textarea
        id="bio"
        name="bio"
        label="About You"
        value={bio}
        onChange={onChange}
        placeholder="Tell us about yourself..."
        maxLength={1000}
        rows={4}
        resize="none"
      />
    </div>
  );
};

export default BioSection;
