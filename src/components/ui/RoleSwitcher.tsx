"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";
import { ChevronDown, LogOut, User as UserIcon, Briefcase, Building, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export function RoleSwitcher() {
  const { currentUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isOpen]);

  const roleColors: Record<Role, string> = {
    SUPER_ADMIN: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold",
    ADMIN: "bg-purple-100 text-purple-800 border-purple-300",
    MANAGEMENT: "bg-indigo-100 text-indigo-800 border-indigo-300",
    PROJECT_MANAGER: "bg-cyan-100 text-cyan-800 border-cyan-300",
    SALES_EXECUTIVE: "bg-blue-100 text-blue-800 border-blue-300",
    SURVEY_TEAM: "bg-emerald-100 text-emerald-800 border-emerald-300",
    DOCUMENTATION_TEAM: "bg-teal-100 text-teal-800 border-teal-300",
    KSEB_TEAM: "bg-amber-100 text-amber-800 border-amber-300",
    INSTALLATION_TEAM: "bg-orange-100 text-orange-800 border-orange-300",
  };

  const userRole = currentUser?.role || "SALES_EXECUTIVE";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
          {currentUser?.name?.slice(0, 2).toUpperCase() || "US"}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-slate-900 font-bold text-xs leading-none">{currentUser?.name || "Employee"}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{currentUser?.employeeCode || "EMP-000"}</div>
        </div>
        <span
          className={clsx(
            "px-2 py-0.5 rounded-md text-[10px] font-bold border hidden sm:inline",
            roleColors[userRole] || "bg-slate-100 text-slate-700"
          )}
        >
          {userRole.replace(/_/g, " ")}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-900">{currentUser?.name}</p>
                <span className="text-[10px] font-mono font-bold text-slate-400">{currentUser?.employeeCode}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">{currentUser?.email}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border", roleColors[userRole])}>
                  {userRole.replace(/_/g, " ")}
                </span>
                {currentUser?.department && (
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" /> {currentUser.department}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="py-1 border-b border-slate-100 text-xs font-medium">
              <Link
                href="/my-work"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"
              >
                <Briefcase className="w-4 h-4 text-blue-600" /> My Work Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"
              >
                <UserIcon className="w-4 h-4 text-slate-500" /> View Profile & Credentials
              </Link>
              {currentUser?.superAdmin && (
                <Link
                  href="/super-admin"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50/50 flex items-center gap-2 text-amber-900 font-bold transition"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" /> Super Admin Control
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-1 px-1">
              <button
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  await signOut();
                  window.location.href = "/login";
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
