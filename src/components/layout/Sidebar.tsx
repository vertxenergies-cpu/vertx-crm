"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FolderKanban,
  CalendarClock,
  CheckSquare,
  BarChart3,
  Users2,
  Bell,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Lock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  UserCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { CompanyLogoMark } from "@/components/ui/CompanyLogo";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Work", href: "/my-work", icon: CheckSquare, highlight: true },
  { label: "Leads", href: "/leads", icon: UserPlus },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban, highlight: true },
  { label: "Follow-ups", href: "/followups", icon: CalendarClock },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Team", href: "/team", icon: Users2 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

const SUPER_ADMIN_ITEMS = [
  { label: "Command Center", href: "/super-admin", icon: ShieldAlert },
  { label: "Approvals Queue", href: "/super-admin/approvals", icon: UserCheck, hasBadge: true },
  { label: "Employees", href: "/super-admin/employees", icon: Users2 },
  { label: "Global Activity", href: "/super-admin/activity", icon: Activity },
  { label: "Admin Activity", href: "/super-admin/admin-activity", icon: ShieldCheck },
  { label: "Security Events", href: "/super-admin/security", icon: Lock },
  { label: "Permissions", href: "/super-admin/permissions", icon: KeyRound },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, getIdToken } = useAuth();
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!isSuperAdmin) return;
    let isMounted = true;

    const fetchPendingCount = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/super-admin/approvals", {
          headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setPendingApprovalsCount(json.data?.counts?.pending || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load approvals count in sidebar:", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSuperAdmin, getIdToken, pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-40 bg-solar-navy text-slate-200 border-r border-slate-800/80 flex flex-col transition-all duration-200 ease-in-out select-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20 w-64" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            "h-16 border-b border-slate-800/80 bg-solar-navy shrink-0 flex items-center justify-between px-3.5 transition-all",
            isCollapsed && "lg:px-2.5 lg:justify-center"
          )}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className={clsx(
              "flex items-center gap-2.5 transition-all overflow-hidden",
              isCollapsed && "lg:gap-0"
            )}
            title="Vertx Energies CRM"
          >
            <CompanyLogoMark size={36} className="bg-white/95" />

            <div className={clsx("transition-all duration-200 ml-2.5", isCollapsed ? "lg:hidden" : "block")}>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                VERTX<span className="text-blue-400">ENERGIES</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Solar EPC Ops
              </div>
            </div>
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={clsx(
              "hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer",
              isCollapsed && "lg:hidden"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Expand Quick Action (Desktop) */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-800/80 shrink-0">
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Smooth Scrollable Navigation Links */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto overscroll-contain py-3 space-y-1 min-h-0",
            isCollapsed ? "lg:px-2 px-3" : "px-3"
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* SUPER ADMIN GROUP (Visible only to authorized Super Admins) */}
          {isSuperAdmin && (
            <div className="mb-4 pb-3 border-b border-slate-800/80 space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Super Admin
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold border border-amber-500/30">
                    CONTROL
                  </span>
                </div>
              )}

              {SUPER_ADMIN_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/super-admin"
                  ? pathname === "/super-admin"
                  : pathname.startsWith(item.href);

                const isApprovals = item.href === "/super-admin/approvals";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={`Super Admin: ${item.label}`}
                    className={clsx(
                      "flex items-center rounded-xl text-xs font-semibold transition-all group relative",
                      isCollapsed
                        ? "lg:justify-center lg:px-0 lg:py-2.5 px-3.5 py-2.5 justify-between"
                        : "justify-between px-3.5 py-2.5",
                      isActive
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                        : "text-amber-200/90 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <div className={clsx("flex items-center gap-3", isCollapsed && "lg:gap-0")}>
                      <Icon
                        className={clsx(
                          "w-4 h-4 transition shrink-0",
                          isActive ? "text-white" : "text-amber-400 group-hover:text-amber-300"
                        )}
                      />
                      <span className={clsx("truncate", isCollapsed ? "lg:hidden" : "block")}>
                        {item.label}
                      </span>
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {isApprovals && pendingApprovalsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] animate-pulse shadow-xs">
                            {pendingApprovalsCount}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        )}
                      </div>
                    )}

                    {/* Collapsed Badge Pill */}
                    {isCollapsed && isApprovals && pendingApprovalsCount > 0 && (
                      <span className="hidden lg:block absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* CRM OPERATIONAL NAVIGATION */}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.label}
                className={clsx(
                  "flex items-center rounded-xl text-xs font-semibold transition-all group relative",
                  isCollapsed
                    ? "lg:justify-center lg:px-0 lg:py-2.5 px-3.5 py-2.5 justify-between"
                    : "justify-between px-3.5 py-2.5",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div
                  className={clsx(
                    "flex items-center gap-3",
                    isCollapsed && "lg:gap-0"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4 transition shrink-0",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
                    )}
                  />
                  <span className={clsx("truncate", isCollapsed ? "lg:hidden" : "block")}>
                    {item.label}
                  </span>
                </div>

                {/* Badges for expanded mode */}
                {!isCollapsed && (
                  <>
                    {item.highlight && !isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 shrink-0">
                        Core
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* External Accounts Boundary Banner (Pinned Footer) */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shrink-0">
            <a
              href="https://www.vertxenergies.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-blue-400 hover:text-blue-300 font-semibold text-[11px] mb-1 group"
            >
              <span>www.vertxenergies.com</span>
              <ExternalLink className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition" />
            </a>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              Solar EPC Operations Command System
            </p>
          </div>
        )}

        {/* Footer info (Pinned) */}
        <div
          className={clsx(
            "p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center shrink-0",
            isCollapsed ? "lg:justify-center justify-between" : "justify-between"
          )}
        >
          <span className={clsx(isCollapsed ? "lg:hidden" : "block")}>Vertx v1.0</span>
          <span
            className="text-emerald-400 font-semibold flex items-center gap-1"
            title="Live Cloud Sync Active"
          >
            ● <span className={clsx(isCollapsed ? "lg:hidden" : "inline")}>Live Sync</span>
          </span>
        </div>
      </aside>
    </>
  );
}
