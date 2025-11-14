import { FC, ReactNode, useState } from "react";
import { LANDING_TEAL, LANDING_PEACH } from "../../data/landingTheme";

interface LandingButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

const LandingButton: FC<LandingButtonProps> = ({
  children,
  variant = "primary",
  href,
  onClick,
  icon,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles =
    "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium relative overflow-hidden backdrop-blur-sm active:scale-95";

  const getStyles = () => {
    switch (variant) {
      case "primary":
        return {
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: isHovered ? LANDING_TEAL : `${LANDING_TEAL}80`,
          color: LANDING_TEAL,
          backgroundColor: isHovered ? `${LANDING_TEAL}0D` : "transparent",
          boxShadow: isHovered ? `0 0 20px -5px ${LANDING_TEAL}80` : "none",
          transition: "all 400ms ease-out",
        };
      case "secondary":
        return {
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: isHovered ? `${LANDING_PEACH}B3` : `${LANDING_PEACH}66`,
          color: LANDING_PEACH,
          backgroundColor: isHovered ? `${LANDING_PEACH}1A` : "transparent",
          transition: "all 300ms ease-out",
        };
      case "tertiary":
        return {
          borderWidth: "2px",
          borderStyle: "solid",
          backgroundColor: isHovered
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(30, 41, 59, 0.6)",
          borderColor: isHovered
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
          color: "#e5e7eb",
          transition: "all 300ms ease-out",
        };
      case "ghost":
        return {
          borderWidth: "1px",
          borderStyle: "solid",
          backgroundColor: isHovered
            ? "rgba(255, 255, 255, 0.05)"
            : "transparent",
          borderColor: isHovered
            ? `${LANDING_PEACH}4D`
            : "rgba(51, 65, 85, 0.4)",
          color: isHovered ? LANDING_PEACH : "#d1d5db",
          transition: "all 300ms ease-out",
        };
      default:
        return {};
    }
  };

  const Component = href ? "a" : "button";

  // Only open external links in new tab
  const isExternalLink =
    href?.startsWith("http://") || href?.startsWith("https://");

  return (
    <Component
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(isExternalLink && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${baseStyles} ${className} group`}
      style={getStyles()}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </span>
    </Component>
  );
};

export default LandingButton;
