import React from "react";
import Image from "next/image";
import logoImg from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "image";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md", variant = "image" }) => {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-40 w-40",
  };

  const imgSrc = (logoImg as any).src || logoImg;
  const hasHeight = className.includes('h-');

  return (
    <div className={`relative ${!hasHeight ? sizeClasses[size] : ""} flex-shrink-0 flex items-center justify-center ${className}`}>
      <img
        src={imgSrc}
        alt="DevBhakti Logo"
        className="max-h-full w-auto object-contain"
      />
    </div>
  );
};

export default Logo;

