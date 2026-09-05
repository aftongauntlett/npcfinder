import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon as X } from "@phosphor-icons/react";

interface ScreenshotLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
}

export const ScreenshotLightbox: React.FC<ScreenshotLightboxProps> = ({
  isOpen,
  onClose,
  image,
  imageWidth,
  imageHeight,
  alt,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Body scroll lock, escape-to-close, and focus management
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    previousActiveElement.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // The close button is the only focusable element in the dialog, so
    // trap focus by re-focusing it on every Tab press.
    const handleTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <motion.img
            src={image}
            alt={alt}
            width={imageWidth}
            height={imageHeight}
            className="max-w-full max-h-full rounded-xl border border-white/15 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center justify-center w-11 h-11 rounded-full bg-slate-800/80 border border-white/15 text-white hover:bg-slate-700/80 hover:border-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close screenshot preview"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
