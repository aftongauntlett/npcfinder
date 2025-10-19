import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import FocusTrap from "focus-trap-react";
import Button from "../shared/Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-600 dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      useTheme: false,
    },
    warning: {
      icon: "text-yellow-600 dark:text-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      useTheme: false,
    },
    info: {
      icon: "",
      button: "",
      bg: "",
      useTheme: true, // Use theme color for info variant
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          escapeDeactivates: false, // We handle ESC manually
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  styles.useTheme ? "" : styles.bg
                }`}
                style={
                  styles.useTheme
                    ? { backgroundColor: "var(--color-primary-pale)" }
                    : undefined
                }
              >
                <AlertTriangle
                  className={`w-6 h-6 ${styles.useTheme ? "" : styles.icon}`}
                  style={
                    styles.useTheme
                      ? { color: "var(--color-primary)" }
                      : undefined
                  }
                  aria-hidden="true"
                />
              </div>
              <h3
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                styles.useTheme ? "hover:opacity-90" : styles.button
              }`}
              style={
                styles.useTheme
                  ? {
                      backgroundColor: "var(--color-primary)",
                    }
                  : undefined
              }
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

export default ConfirmationModal;
