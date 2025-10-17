import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  icon,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "text-white hover:opacity-90 focus:ring-offset-2 border border-transparent shadow-sm",
    secondary:
      "text-text-secondary bg-surface hover:bg-surface-elevated focus:ring-primary border border-border",
    danger:
      "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm",
    outline:
      "bg-transparent border-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-offset-2",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const getStyle = () => {
    if (variant === "primary") {
      return { backgroundColor: "var(--color-primary)" };
    }
    if (variant === "outline") {
      return {
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
      };
    }
    return undefined;
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      style={getStyle()}
      {...props}
    >
      {icon && <span className="w-4 h-4 mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
