import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Input, Button, Card } from "@/components/shared";
import { sendPasswordResetEmail } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { usePageMeta } from "@/hooks/usePageMeta";

const pageMetaOptions = {
  title: "Forgot Password",
  description: "Reset your password",
  noIndex: true,
};

const ForgotPassword: React.FC = () => {
  usePageMeta(pageMetaOptions);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSending(true);

    try {
      const { error: resetError } = await sendPasswordResetEmail(email);

      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      logger.error("Password reset error", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" spacing="lg" border>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white font-heading">
                Check Your Email
              </h1>
              <p className="text-gray-400">
                We've sent password reset instructions to{" "}
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                If you don't see the email, check your spam folder.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/signin")}
                className="w-full mt-6"
              >
                Back to Sign In
              </Button>
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
                Forgot Password?
              </h1>
              <p className="text-gray-400">
                Enter your email and we'll send you instructions to reset your
                password
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                loading={isSending}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="subtle"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate("/signin")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
