import { motion } from "framer-motion";
import { FC, ReactNode } from "react";

interface LandingButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
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
  const baseStyles =
    "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium relative overflow-hidden group transition-all duration-500 ease-out";

  const variants = {
    primary: `
      bg-gradient-to-r from-[#FF6B6B] to-[#FFB088] 
      text-slate-900
      shadow-lg shadow-[#FFB088]/20
      hover:shadow-2xl hover:shadow-[#FFB088]/30
      hover:scale-[1.02]
      active:scale-95
      border-2 border-[#FFB088]/30
      hover:border-[#FFB088]/50
    `,
    secondary: `
      bg-transparent 
      border-2 border-[#FFB088]/40 
      text-[#FFB088]
      backdrop-blur-sm
      hover:border-[#FFB088]/70
      hover:bg-[#FFB088]/10
      hover:scale-[1.02]
      active:scale-95
    `,
    ghost: `
      bg-transparent
      text-gray-300
      hover:text-[#FFB088]
      hover:bg-white/5
    `,
  };

  const Component = motion[href ? "a" : "button"];

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {/* Gradient shimmer effect on hover */}
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </span>
    </Component>
  );
};

export default LandingButton;
