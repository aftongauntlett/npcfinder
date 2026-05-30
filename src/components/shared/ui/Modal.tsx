import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button";

// Module-level counter to track the number of open modals
let modalOpenCount = 0;
// Store the original overflow style to restore it when all modals are closed
let originalOverflowStyle = "";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl";
  showCloseButton?: boolean;
  disableClose?: boolean;
  closeOnBackdropClick?: boolean;
  showHeader?: boolean;
  ariaLabelledby?: string;
}

/**
 * Modal - Reusable modal component that properly handles sidebar layout
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  maxWidth = "2xl",
  showCloseButton = true,
  disableClose = false,
  closeOnBackdropClick = true,
  showHeader = true,
  ariaLabelledby,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isAuthenticatedShell =
    typeof document !== "undefined" &&
    document.body.classList.contains("app-authenticated-shell");

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      if (modalOpenCount === 0) {
        originalOverflowStyle = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }
      modalOpenCount++;

      return () => {
        modalOpenCount--;
        if (modalOpenCount === 0) {
          document.body.style.overflow = originalOverflowStyle;
        }
      };
    }
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that was focused before modal opened
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal container
    modalRef.current?.focus();

    return () => {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [disableClose, isOpen, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab: if focused on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focused on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && !disableClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto pointer-events-none ${
          isAuthenticatedShell ? "md:pl-60" : ""
        }`}
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-full items-start justify-center p-4 pt-10 sm:pt-12">
          <div
            ref={modalRef}
            tabIndex={-1}
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl focus:outline-none pointer-events-auto`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              ariaLabelledby || (title ? "modal-title" : undefined)
            }
          >
            {/* Header */}
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
                {(headerActions || showCloseButton) && (
                  <div className="flex items-center gap-1.5">
                    {headerActions}
                    {showCloseButton && (
                      <Button
                        onClick={onClose}
                        variant="subtle"
                        size="icon"
                        icon={<X className="w-5 h-5" />}
                        aria-label="Close modal"
                        disabled={disableClose}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
