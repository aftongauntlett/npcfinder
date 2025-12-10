import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { signIn, signUp } from "../../lib/auth";
import { Button, Input } from "@/components/shared";
import { logger } from "@/lib/logger";

/**
 * Authentication page with login and signup forms
 * SECURITY: Requires invite code for signup (invite-only system)
 * Supports URL parameters: ?invite=CODE&email=user@example.com
 */
const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Pre-fill form from URL parameters
  useEffect(() => {
    const inviteParam = searchParams.get("invite");
    const emailParam = searchParams.get("email");

    if (inviteParam) {
      setInviteCode(inviteParam.toUpperCase());
      setIsLogin(false); // Switch to signup mode if invite code is present
    }

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    // Validate invite code for signup
    if (!isLogin && !inviteCode.trim()) {
      setError("Invite code is required to create an account");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          setMessage("Successfully signed in!");
        }
      } else {
        // Sign up with invite code
        const { error: signUpError } = await signUp(
          email,
          password,
          inviteCode
        );
        if (signUpError) {
          // Provide user-friendly error messages
          if (signUpError.name === "InviteCodeError") {
            setError("Email does not match invite code");
          } else if (
            signUpError.message.includes("already") ||
            signUpError.message.includes("invalid")
          ) {
            setError(
              "This email is already registered. Please sign in instead."
            );
          } else {
            setError(signUpError.message);
          }
        } else {
          setMessage(
            "Account created! Please check your email to verify your account, then sign in."
          );
          setIsLogin(true);
          setPassword("");
          setInviteCode("");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      logger.error("Authentication error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">NPC Finder</h1>
          <p className="text-gray-300">
            {isLogin ? "Welcome back" : "Join by invitation only"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(e);
            }}
            className="space-y-6"
          >
            {/* Email Input */}
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
              error={error && error.includes("email") ? error : undefined}
            />

            {/* Password Input */}
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={8}
              helperText="At least 8 characters"
              error={error && error.includes("Password") ? error : undefined}
            />

            {/* Invite Code Input (only for signup) */}
            {!isLogin && (
              <Input
                id="inviteCode"
                label="Invite Code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={loading}
                required
                maxLength={19}
                helperText="🔒 This app is invite-only. Enter the code you received."
                error={error && error.includes("invite") ? error : undefined}
              />
            )}

            {/* Error Message */}
            {error && (
              <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            {/* Forgot Password Link (only show on login) */}
            {isLogin && (
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => {
                    void navigate("/forgot-password");
                  }}
                  variant="subtle"
                  size="sm"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
                setInviteCode("");
              }}
              variant="subtle"
              size="sm"
              disabled={loading}
            >
              {isLogin
                ? "Have an invite code? Create account"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Button
            onClick={() => {
              void navigate("/");
            }}
            variant="subtle"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
