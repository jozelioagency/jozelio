import React from "react";

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical" | "square";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  iconOnly = false,
  size = "md",
  layout,
}) => {
  // Responsive icon size mappings matching the original vector representation
  const iconSizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-20 h-20",
  };

  if (iconOnly) {
    return (
      <div className={`flex-shrink-0 ${iconSizes[size]} ${className}`}>
        <svg
          viewBox="2 8 74 69"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 7 Vertical Bars (Orange) */}
          <rect x="4" y="57" width="7" height="18" fill="#f58a2d" />
          <rect x="14" y="47" width="7" height="28" fill="#f58a2d" />
          <rect x="24" y="54" width="7" height="21" fill="#f58a2d" />
          <rect x="34" y="62" width="7" height="13" fill="#f58a2d" />
          <rect x="44" y="49" width="7" height="26" fill="#f58a2d" />
          <rect x="54" y="37" width="7" height="38" fill="#f58a2d" />
          <rect x="64" y="27" width="7" height="48" fill="#f58a2d" />

          {/* Blue Trend Line */}
          <path
            d="M 3 53 L 26 29 L 45 42 L 75 10"
            stroke="#113669"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Symmetrical Arrow Head */}
          <path
            d="M 61 12 L 75 10 L 73 24"
            stroke="#113669"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // Determine active layout format based on prop or size defaults
  const activeLayout = layout || (size === "lg" ? "vertical" : "horizontal");

  // Precise sizing classes for official branding assets
  const logoDimensions = {
    horizontal: {
      xs: "w-28 h-auto max-h-[26px]",
      sm: "w-36 h-auto max-h-[34px]",
      md: "w-48 h-auto max-h-[46px]",
      lg: "w-72 h-auto max-h-[70px]",
    },
    vertical: {
      xs: "w-16 h-auto max-h-[60px]",
      sm: "w-24 h-auto max-h-[90px]",
      md: "w-32 h-auto max-h-[120px]",
      lg: "w-48 h-auto max-h-[180px]",
    },
    square: {
      xs: "w-16 h-auto max-h-[60px]",
      sm: "w-24 h-auto max-h-[90px]",
      md: "w-32 h-auto max-h-[120px]",
      lg: "w-48 h-auto max-h-[180px]",
    },
  };

  const logoSrcs = {
    horizontal: "/branding/logo2.svg",
    vertical: "/branding/logo1.svg",
    square: "/branding/logo3.svg",
  };

  const src = logoSrcs[activeLayout];
  const sizeClass = logoDimensions[activeLayout][size];

  return (
    <div className={`flex items-center justify-start ${className}`}>
      <img
        src={src}
        alt="Jozelio Logo"
        className={`${sizeClass} object-contain block`}
      />
    </div>
  );
};
