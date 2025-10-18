import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = "error" | "success" | "warning" | "info";

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ALERT_STYLES = {
  error: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-800 dark:text-red-300",
    text: "text-red-700 dark:text-red-400",
    Icon: AlertCircle,
  },
  success: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-800 dark:text-green-300",
    text: "text-green-700 dark:text-green-400",
    Icon: CheckCircle,
  },
  warning: {
    container:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    title: "text-yellow-800 dark:text-yellow-300",
    text: "text-yellow-700 dark:text-yellow-400",
    Icon: AlertTriangle,
  },
  info: {
    container:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-400",
    Icon: Info,
  },
} as const;

const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  className = "",
}) => {
  const styles = ALERT_STYLES[type];
  const Icon = styles.Icon;

  return (
    <div
      className={`p-4 border rounded-lg ${styles.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`}
          aria-hidden="true"
        />
        <div className="flex-1">
          {title && (
            <h3 className={`font-medium ${styles.title} mb-1`}>{title}</h3>
          )}
          <div className={`text-sm ${styles.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Alert);
