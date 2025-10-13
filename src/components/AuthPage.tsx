import React, { useState } from "react";
import { signIn, signUp } from "../lib/auth";
import Button from "./shared/Button";

/**
 * Authentication page with login and signup forms
 */
const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

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
        // Sign up
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Account created! You can now sign in.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">NPC Finder</h1>
          <p className="text-gray-300">Your personal dashboard</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                disabled={loading}
                required
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                At least 8 characters
              </p>
            </div>

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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
              }}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="text-center text-sm text-gray-300">
          <p>🔒 Your data is secure and private</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
