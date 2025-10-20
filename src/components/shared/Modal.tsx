import React, { useEffect } from "react";
import { X } from "lucide-react";
import FocusTrap from "focus-trap-react";
import { useSidebar } from "../../contexts/SidebarContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  showHeader?: boolean; // New prop to control header rendering
}

/**
 * Modal - Reusable modal component that properly handles sidebar layout
 *
 * This modal is aware of the sidebar and positions itself in the main content area,
 * not over the entire viewport. This ensures proper centering and avoids the
 * visual issue of modals appearing off-center when a sidebar is present.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback when modal should close
 * @param title - Optional title shown in header
 * @param children - Modal content
 * @param maxWidth - Maximum width of modal (default: "2xl")
 * @param showCloseButton - Show X button in header (default: true)
 * @param closeOnBackdropClick - Close when clicking backdrop (default: true)
 * @param showHeader - Show header with title/close button (default: true if title/showCloseButton)
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "2xl",
  showCloseButton = true,
  closeOnBackdropClick = true,
  showHeader = true,
}) => {
  const { isCollapsed } = useSidebar();

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? "pl-16" : "pl-16 md:pl-64"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container - Centered within main content area */}
      <div className="flex min-h-full items-center justify-center p-4">
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            escapeDeactivates: false,
            clickOutsideDeactivates: closeOnBackdropClick,
            returnFocusOnDeactivate: true,
          }}
        >
          <div
            className={`relative my-8 w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl focus:outline-none`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {/* Header - Only show if showHeader is true and (title or close button requested) */}
            {showHeader && (title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900 dark:text-white font-heading"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 p-1"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            {children}
          </div>
        </FocusTrap>
      </div>
    </div>
  );
};

export default Modal;
