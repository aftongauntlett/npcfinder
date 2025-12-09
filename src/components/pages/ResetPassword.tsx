import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Input, Button, Card } from "@/components/shared";
import { updatePassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/lib/supabase";

const pageMetaOptions = {
  title: "Reset Password",
  description: "Create a new password",
  noIndex: true,
};

const ResetPassword: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };

    void checkSession();
  }, []);

  const validateForm = (): boolean => {
    if (!newPassword) {
      setError("Password is required");
      return false;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsResetting(true);

    try {
      const { error: resetError } = await updatePassword(newPassword);

      if (resetError) {
        setError(resetError.message || "Failed to reset password");
      } else {
        setPasswordReset(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      }
    } catch (err) {
      logger.error("Password reset error", err);
      setError("An unexpected error occurred");
    } finally {
      setIsResetting(false);
    }
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" spacing="lg" border>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white font-heading">
                Password Reset Successfully!
              </h1>
              <p className="text-gray-400">
                Your password has been updated. Redirecting to sign in...
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card variant="glass" spacing="lg" border>
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white font-heading mb-2">
                Reset Your Password
              </h1>
              <p className="text-gray-400">Enter your new password below</p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              >
                {error}
              </div>
            )}

            {!isValidSession ? (
              <div className="text-center space-y-4">
                <p className="text-gray-400">
                  This reset link is invalid or has expired.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="new-password"
                  name="newPassword"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter new password"
                  helperText="Must be at least 8 characters"
                  required
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
                    setError(null);
                  }}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={isResetting}
                  disabled={isResetting}
                  className="w-full"
                >
                  {isResetting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
