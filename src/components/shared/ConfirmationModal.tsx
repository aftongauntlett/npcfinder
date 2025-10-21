import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../shared/Button";
import Modal from "./Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      showHeader={false}
      closeOnBackdropClick={!isLoading}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${styles.useTheme ? "" : styles.bg}`}
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
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="subtle" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
