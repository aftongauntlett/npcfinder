import React, { useState } from "react";
import { Input, Button } from "@/components/shared";
import { updatePassword } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface PasswordChangeSectionProps {
  onPasswordChanged?: () => void;
}

const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsChanging(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        setMessage({
          type: "error",
          text: error.message || "Failed to update password",
        });
      } else {
        setMessage({
          type: "success",
          text: "Password updated successfully!",
        });
        setNewPassword("");
        setConfirmPassword("");
        onPasswordChanged?.();
      }
    } catch (error) {
      logger.error("Password change error", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
        Change Password
      </h3>

      {message && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <Input
          id="new-password"
          name="newPassword"
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors((prev) => ({ ...prev, newPassword: undefined }));
            setMessage(null);
          }}
          error={errors.newPassword}
          placeholder="Enter new password"
          helperText="Must be at least 8 characters"
          autoComplete="new-password"
        />

        <Input
          id="confirm-password"
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            setMessage(null);
          }}
          error={errors.confirmPassword}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />

        <div className="flex justify-end mt-6">
          <Button
            type="button"
            variant="primary"
            loading={isChanging}
            disabled={isChanging || !newPassword || !confirmPassword}
            size="sm"
            onClick={handleSubmit}
          >
            {isChanging ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeSection;
