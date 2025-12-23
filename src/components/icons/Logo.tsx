import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md", variant = "full" }) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Om Symbol / Temple Icon */}
      <div className={`${sizeClasses[size]} aspect-square relative`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer glow */}
          <circle
            cx="24"
            cy="24"
            r="22"
            className="fill-primary/10"
          />
          {/* Temple dome shape */}
          <path
            d="M24 6C24 6 12 14 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 14 24 6 24 6Z"
            className="fill-primary"
          />
          {/* Inner details */}
          <path
            d="M24 12C24 12 18 17 18 23C18 26.314 20.686 29 24 29C27.314 29 30 26.314 30 23C30 17 24 12 24 12Z"
            className="fill-primary-foreground/20"
          />
          {/* Temple spire */}
          <path
            d="M24 4L26 8H22L24 4Z"
            className="fill-secondary"
          />
          {/* Base */}
          <rect
            x="16"
            y="34"
            width="16"
            height="4"
            rx="2"
            className="fill-primary"
          />
          <rect
            x="14"
            y="38"
            width="20"
            height="4"
            rx="2"
            className="fill-primary/80"
          />
        </svg>
      </div>

      {variant === "full" && (
        <div className="flex flex-col">
          <span className={`font-serif font-bold ${textSizes[size]} text-foreground leading-none`}>
            Dev<span className="text-primary">Bhakti</span>
          </span>
          {size !== "sm" && (
            <span className="text-xs text-muted-foreground tracking-wider">
              Sacred Connections
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
