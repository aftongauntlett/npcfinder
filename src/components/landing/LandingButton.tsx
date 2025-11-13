import { FC, ReactNode } from "react";

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
  const baseStyles =
    "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium relative overflow-hidden transition-all duration-300 ease-out";

  const variants = {
    primary: `
      bg-[#FFB088]/90
      text-slate-900
      shadow-md shadow-[#FFB088]/15
      hover:shadow-lg hover:shadow-[#FFB088]/20
      hover:bg-[#FFB088]
      active:scale-95
      font-semibold
      border border-white/20
      backdrop-blur-md
      before:absolute before:inset-0 before:rounded-lg
      before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent
      before:opacity-60
    `,
    secondary: `
      bg-transparent 
      border-2 border-[#FFB088]/40 
      text-[#FFB088]
      backdrop-blur-sm
      hover:border-[#FFB088]/70
      hover:bg-[#FFB088]/10
      active:scale-95
    `,
    tertiary: `
      bg-slate-800/60
      border-2 border-white/10
      text-gray-200
      backdrop-blur-sm
      hover:border-white/20
      hover:bg-slate-800/80
      active:scale-95
    `,
    ghost: `
      bg-transparent
      text-gray-300
      border border-slate-700/40
      hover:text-[#FFB088]
      hover:bg-white/5
      hover:border-[#FFB088]/30
    `,
  };

  const Component = href ? "a" : "button";

  // Only open external links in new tab
  const isExternalLink =
    href?.startsWith("http://") || href?.startsWith("https://");

  return (
    <Component
      href={href}
      onClick={onClick}
      {...(isExternalLink && { target: "_blank", rel: "noopener noreferrer" })}
      className={`${baseStyles} ${variants[variant]} ${className} group`}
    >
      {/* Shimmer effect for primary button */}
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out rounded-lg" />
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
