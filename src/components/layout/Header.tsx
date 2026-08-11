"use client";

import React, { useState } from "react";
import { Menu, Search, PlusCircle, RotateCcw, Sparkles } from "lucide-react";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export function Header({ onToggleSidebar, isSidebarCollapsed, onToggleSidebarCollapse }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetDemo = async () => {
    if (confirm("Reset database with fresh 20 Kerala leads, 10 customers and 10 multi-stage solar projects?")) {
      setResetting(true);
      try {
        await fetch("/api/seed/reset", { method: "POST" });
        window.location.reload();
      } catch (err) {
        console.error(err);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Quick Search Bar Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 text-xs font-medium border border-slate-200/60 transition w-64 md:w-80 justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              <span>Search customer, project, KSEB #...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset to initial 20 Kerala leads & 10 projects demo data"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>Reset Demo</span>
          </button>

          {/* Quick Create Lead Button */}
          <button
            onClick={() => router.push("/leads?action=create")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>

          {/* Role Switcher Widget */}
          <RoleSwitcher />

          {/* Notification Center */}
          <NotificationDropdown />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
