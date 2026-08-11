import React from "react";
import Image from "next/image";
import { clsx } from "clsx";

interface CompanyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "white" | "dark";
  subText?: string;
}

export function CompanyLogo({
  className,
  size = "md",
  showText = false,
  textColor = "white",
  subText = "www.vertxenergies.com",
}: CompanyLogoProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const pixelMap = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  return (
    <div className={clsx("flex items-center gap-2.5 select-none", className)}>
      <div
        className={clsx(
          sizeMap[size],
          "relative rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white/95 p-1 shadow-sm border border-white/20"
        )}
      >
        <Image
          src="/logo.png"
          alt="Vertx Energies Logo"
          width={pixelMap[size]}
          height={pixelMap[size]}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div
            className={clsx(
              "font-extrabold tracking-tight leading-tight flex items-center gap-1",
              size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : size === "xl" ? "text-2xl" : "text-base",
              textColor === "white" ? "text-white" : "text-slate-900"
            )}
          >
            VERTX<span className="text-blue-500">ENERGIES</span>
          </div>
          {subText && (
            <div
              className={clsx(
                "text-[10px] uppercase font-bold tracking-widest leading-none mt-0.5",
                textColor === "white" ? "text-slate-400" : "text-slate-500"
              )}
            >
              {subText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CompanyLogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={clsx(
        "relative rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white/95 p-1 shadow-sm border border-white/20",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="Kerala Solar Logo"
        width={size}
        height={size}
        className="object-contain w-full h-full"
        priority
      />
    </div>
  );
}
