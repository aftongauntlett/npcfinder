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
      bg-transparent
      border-2 border-[#5DCCCC]/50
      text-[#5DCCCC]
      backdrop-blur-sm
      hover:border-[#5DCCCC]
      hover:bg-[#5DCCCC]/5
      hover:shadow-[0_0_20px_-5px_rgba(93,204,204,0.5)]
      active:scale-95
      transition-all duration-400 ease-out
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
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </span>
    </Component>
  );
};

export default LandingButton;
