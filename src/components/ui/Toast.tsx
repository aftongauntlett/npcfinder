import React, { useEffect } from "react";
import { X, Undo } from "lucide-react";
import Button from "../shared/Button";

interface ToastProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  action,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 dark:border-gray-600 px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-md">
        <span className="flex-1 text-sm font-medium">{message}</span>
        {action && (
          <Button
            onClick={action.onClick}
            variant="primary"
            size="sm"
            icon={<Undo className="w-3.5 h-3.5" />}
            className="focus-visible:ring-offset-gray-900"
          >
            {action.label}
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="subtle"
          size="icon"
          icon={<X className="w-4 h-4" />}
          className="hover:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Close"
        />
      </div>
    </div>
  );
};

export default Toast;
