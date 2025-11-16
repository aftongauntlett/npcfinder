import React from "react";
import { Lock, LockOpen } from "lucide-react";
import Button from "./Button";

interface PrivacyToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  variant?: "switch" | "button";
  size?: "sm" | "md";
  showDescription?: boolean;
  contextLabel?: string;
  className?: string;
}

export default function PrivacyToggle({
  isPublic,
  onChange,
  variant = "button",
  size = "md",
  showDescription = true,
  contextLabel,
  className = "",
}: PrivacyToggleProps) {
  const handleToggle = () => {
    onChange(!isPublic);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  if (variant === "switch") {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          {isPublic ? (
            <LockOpen
              className={`${
                size === "sm" ? "w-4 h-4" : "w-5 h-5"
              } text-green-600 dark:text-green-400`}
            />
          ) : (
            <Lock
              className={`${
                size === "sm" ? "w-4 h-4" : "w-5 h-5"
              } text-gray-600 dark:text-gray-400`}
            />
          )}
          <span
            className={`${
              size === "sm" ? "text-sm" : "text-base"
            } font-medium text-gray-700 dark:text-gray-300`}
          >
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`relative inline-flex ${
            size === "sm" ? "h-5 w-9" : "h-6 w-11"
          } items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isPublic
              ? "bg-green-600 dark:bg-green-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`${
              size === "sm" ? "h-4 w-4" : "h-5 w-5"
            } transform rounded-full bg-white shadow-lg transition-transform ${
              isPublic
                ? size === "sm"
                  ? "translate-x-5"
                  : "translate-x-6"
                : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    );
  }

  // Button variant
  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        type="button"
        variant="secondary"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full justify-start gap-3 ${
          isPublic
            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        } transition-all`}
        role="switch"
        aria-checked={isPublic}
        aria-label={`Review visibility: ${isPublic ? "Public" : "Private"}`}
      >
        {isPublic ? (
          <LockOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isPublic ? "Visible to friends" : "Only you can see this"}
          </span>
          {showDescription && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isPublic
                ? contextLabel
                  ? `Friends can see your ${contextLabel} review`
                  : "Friends can see your review"
                : "Your review is private"}
            </span>
          )}
        </div>
      </Button>

      {showDescription && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                {isPublic
                  ? "Your friends will see this review in their feed and on the media detail page."
                  : "Only you can see this review. It will not appear in feeds or recommendations."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
