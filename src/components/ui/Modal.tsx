"use client";
 
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";
 
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  headerBg?: string;
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
  "4xl": "max-w-4xl",
};
 
export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = "2xl",
  headerBg = "bg-slate-50",
  closeOnBackdropClick = false,
  closeOnEsc = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
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
 
  // Safe Close Handler with reason tracking
  const handleSafeClose = useCallback(
    (reason: "X_BUTTON" | "ESCAPE" | "BACKDROP_CLICK" | "CANCEL" | "SUBMIT") => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[Modal Close] Reason: ${reason} | Title:`, title, `| Timestamp:`, new Date().toISOString());
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
 
  // Auto-focus first input on open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button:not([aria-label="Close"])'
      );
      if (focusable) {
        setTimeout(() => focusable.focus(), 50);
      }
    }
  }, [isOpen]);
 
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
      className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overscroll-none h-[100dvh]"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Modal Dialog"}
        className={clsx(
          "w-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto",
          "max-h-[calc(100dvh-24px)] sm:max-h-[min(88vh,720px)]",
          maxWidthMap[maxWidth] || "max-w-2xl",
          "animate-fadeIn z-[110]"
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
        {/* Header - Fixed / Pinned */}
        <div
          className={clsx(
            "p-3.5 sm:px-6 sm:py-4 border-b flex items-center justify-between shrink-0 sticky top-0 z-10",
            headerBg
          )}
        >
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900">
            {icon}
            <h3 className="truncate">{title}</h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => handleSafeClose("X_BUTTON")}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 overscroll-contain">
          {children}
        </div>

        {/* Footer - Fixed / Pinned if provided */}
        {footer && (
          <div className="p-3.5 sm:px-6 sm:py-3.5 border-t bg-slate-50 shrink-0 flex items-center justify-end gap-2 sticky bottom-0 z-10 pb-[calc(14px+env(safe-area-inset-bottom))] sm:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
