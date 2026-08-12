"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  maxWidth = "2xl",
  closeOnBackdropClick = false,
  closeOnEsc = true,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const isBackdropMouseDownRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Body Scroll Locking
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Safe Close Handler
  const handleSafeClose = useCallback(
    (reason: "X_BUTTON" | "ESCAPE" | "BACKDROP_CLICK") => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[Drawer Close] Reason: ${reason} | Title:`, title, `| Timestamp:`, new Date().toISOString());
      }
      onClose();
    },
    [onClose, title]
  );

  // ESC Key Listener
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSafeClose("ESCAPE");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, handleSafeClose]);

  if (!mounted || !isOpen) return null;

  // Handle Backdrop Mouse Events with strict target validation
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    } else {
      isBackdropMouseDownRef.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target === e.currentTarget &&
      isBackdropMouseDownRef.current === true &&
      closeOnBackdropClick === true
    ) {
      handleSafeClose("BACKDROP_CLICK");
    }
    isBackdropMouseDownRef.current = false;
  };

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Details Drawer"}
        className={clsx(
          "bg-white h-full w-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slideLeft z-[110]",
          maxWidthMap[maxWidth] || "max-w-2xl"
        )}
        onMouseDown={(e) => {
          isBackdropMouseDownRef.current = false;
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          isBackdropMouseDownRef.current = false;
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Drawer Header - Pinned */}
        <div className="p-4 sm:px-6 sm:py-4 border-b bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="font-extrabold text-base text-slate-900">{title}</div>
            {subtitle && <div className="text-xs text-slate-500 font-mono mt-0.5">{subtitle}</div>}
          </div>

          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              aria-label="Close"
              onClick={() => handleSafeClose("X_BUTTON")}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
