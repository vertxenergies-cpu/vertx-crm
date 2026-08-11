"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ForcePasswordChangeModal } from "@/components/ui/ForcePasswordChangeModal";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status, firebaseUser, currentUser, profileError, loading, signOut } = useAuth();

  // Load collapse preference from localStorage (UI preference only, not auth identity)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kerala_solar_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kerala_solar_sidebar_collapsed", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/pending-approval" ||
    pathname === "/forgot-password";

  // Route protection effect (Runs strictly when loading === false)
  useEffect(() => {
    if (loading || status === "INITIALIZING" || status === "AUTHENTICATED_LOADING_PROFILE") {
      return;
    }

    // 1. Unauthenticated user accessing protected route -> redirect to /login
    if (!firebaseUser && !isPublicPage) {
      router.push("/login");
      return;
    }

    // 2. Authenticated user route authorization checks
    if (currentUser) {
      const isSuperAdmin = currentUser.superAdmin === true || currentUser.role === "SUPER_ADMIN";
      const isApproved =
        currentUser.approvalStatus === "APPROVED" &&
        (currentUser.status === "ACTIVE" || currentUser.active === true);
      const isUnapproved = !isApproved;

      if (!isSuperAdmin) {
        if (isUnapproved) {
          if (pathname !== "/pending-approval" && !isPublicPage) {
            router.push("/pending-approval");
            return;
          }
        } else {
          // Approved employee on /pending-approval -> redirect to /dashboard
          if (pathname === "/pending-approval") {
            router.push("/dashboard");
            return;
          }
        }
      }

      // Authenticated user on auth/landing pages -> redirect to appropriate CRM starting route
      if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
        if (isUnapproved && !isSuperAdmin) {
          router.push("/pending-approval");
        } else if (isSuperAdmin) {
          router.push("/super-admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      // Non-Super Admin attempting to access /super-admin -> redirect to /dashboard
      if (pathname.startsWith("/super-admin") && !isSuperAdmin) {
        router.push("/dashboard");
        return;
      }
    }
  }, [loading, status, firebaseUser, currentUser, isPublicPage, pathname, router]);

  // 1. While auth state is initializing or loading profile
  if (loading || status === "INITIALIZING" || status === "AUTHENTICATED_LOADING_PROFILE") {
    if (isPublicPage) {
      return <main className="min-h-screen">{children}</main>;
    }
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold tracking-wide animate-pulse">
            Verifying VERTX ENERGIES Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  // 2. Profile configuration error (Authenticated in Firebase, but profile missing in database)
  if (status === "PROFILE_ERROR" && profileError && !isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Employee Profile Configuration Error</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{profileError}</p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render clean public view for landing/auth pages
  if (isPublicPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  // 4. Render full CRM application layout for authenticated users
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={handleToggleCollapse}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mandatory Password Change Modal */}
      <ForcePasswordChangeModal />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </AuthProvider>
  );
}
