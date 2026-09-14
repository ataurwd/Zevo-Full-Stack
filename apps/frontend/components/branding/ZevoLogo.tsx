import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface ZevoLogoProps {
  variant?: "full" | "icon-only" | "wordmark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  useWhiteImage?: boolean;
  badge?: string;
  subtitle?: string;
  href?: string | false;
  className?: string;
  priority?: boolean;
}

const sizeConfig = {
  xs: {
    iconSize: 22,
    iconClass: "w-5 h-5",
    logoH: 22,
    logoW: 76,
    textClass: "text-base font-extrabold tracking-tight",
    badgeClass: "text-[9px] px-1.5 py-0.2",
    subtitleClass: "text-[8px]",
    gap: "gap-1.5",
  },
  sm: {
    iconSize: 28,
    iconClass: "w-7 h-7",
    logoH: 28,
    logoW: 96,
    textClass: "text-lg font-black tracking-tight",
    badgeClass: "text-[10px] px-1.5 py-0.5",
    subtitleClass: "text-[9px]",
    gap: "gap-2",
  },
  md: {
    iconSize: 36,
    iconClass: "w-9 h-9",
    logoH: 36,
    logoW: 124,
    textClass: "text-xl font-black tracking-tight",
    badgeClass: "text-xs px-2 py-0.5",
    subtitleClass: "text-[10px]",
    gap: "gap-2.5",
  },
  lg: {
    iconSize: 46,
    iconClass: "w-12 h-12",
    logoH: 46,
    logoW: 160,
    textClass: "text-2xl font-black tracking-tight",
    badgeClass: "text-xs px-2.5 py-0.5",
    subtitleClass: "text-xs",
    gap: "gap-3",
  },
  xl: {
    iconSize: 58,
    iconClass: "w-16 h-16",
    logoH: 58,
    logoW: 200,
    textClass: "text-3xl font-black tracking-tight",
    badgeClass: "text-sm px-3 py-1",
    subtitleClass: "text-sm",
    gap: "gap-3.5",
  },
};

export function ZevoIcon({
  size = "md",
  inverted = false,
  className = "",
  priority = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const cfg = sizeConfig[size] || sizeConfig.md;
  const iconSrc = inverted
    ? "/images/branding/zevo-icon-white.png"
    : "/images/branding/zevo-icon.png";

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${cfg.iconClass} ${className}`}>
      <Image
        src={iconSrc}
        alt="Zevo Icon"
        width={cfg.iconSize * 1.3}
        height={cfg.iconSize}
        className="object-contain w-full h-full drop-shadow-sm select-none"
        priority={priority}
      />
    </div>
  );
}

export function ZevoLogo({
  variant = "full",
  size = "md",
  inverted = false,
  useWhiteImage = false,
  badge,
  subtitle,
  href = false,
  className = "",
  priority = false,
}: ZevoLogoProps) {
  const cfg = sizeConfig[size] || sizeConfig.md;
  const isDarkBg = inverted;

  const iconSrc = isDarkBg
    ? "/images/branding/zevo-icon-white.png"
    : "/images/branding/zevo-icon.png";

  // If useWhiteImage is requested without custom subtitles or badges, render authentic white logo PNG directly
  if (isDarkBg && useWhiteImage && !subtitle && !badge) {
    const imgContent = (
      <div className={`relative inline-flex items-center select-none ${className}`}>
        <Image
          src="/images/branding/zevo-logo-white.png"
          alt="Zevo"
          width={cfg.logoW}
          height={cfg.logoH}
          className="object-contain drop-shadow-md hover:scale-[1.02] transition-transform duration-200"
          priority={priority}
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg">
          {imgContent}
        </Link>
      );
    }
    return imgContent;
  }

  const content = (
    <div className={`inline-flex items-center ${cfg.gap} group select-none ${className}`}>
      {/* Icon */}
      {variant !== "wordmark" && (
        <div className={`relative ${cfg.iconClass} shrink-0 transition-transform group-hover:scale-105 duration-200`}>
          <Image
            src={iconSrc}
            alt="Zevo"
            width={cfg.iconSize * 1.3}
            height={cfg.iconSize}
            className={`object-contain w-full h-full ${isDarkBg ? "drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : "drop-shadow-xs"}`}
            priority={priority}
          />
        </div>
      )}

      {/* Wordmark & Badges */}
      {variant !== "icon-only" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2 leading-none">
            <span
              className={`${cfg.textClass} ${
                isDarkBg ? "text-white drop-shadow-sm font-black" : "text-[#0F3B33] font-black"
              } transition-colors tracking-tight font-sans`}
              style={{ letterSpacing: "-0.03em" }}
            >
              Zevo
            </span>

            {badge && (
              <span
                className={`font-mono font-bold uppercase rounded-full ${cfg.badgeClass} ${
                  isDarkBg
                    ? "bg-white/20 text-white border border-white/30 shadow-xs"
                    : "bg-[#E8F8EE] text-[#0A504A] border border-[#A2E4B8]"
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <span
              className={`block font-mono uppercase font-bold tracking-widest mt-0.5 ${cfg.subtitleClass} ${
                isDarkBg ? "text-[#A2E4B8]" : "text-[#00A86B]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

export default ZevoLogo;
