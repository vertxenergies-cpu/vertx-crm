"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users2,
  FolderKanban,
  AlertTriangle,
  Clock,
  CalendarClock,
  ShieldCheck,
  Activity,
  Lock,
  ArrowRight,
  UserCheck,
  UserX,
  UserMinus,
  RefreshCw,
  Zap,
} from "lucide-react";
import { SuperAdminStats, AuditLog } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminDashboardPage() {
  const { getIdToken } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [recentAdminLogs, setRecentAdminLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };

      const [statsRes, activityRes, adminRes] = await Promise.all([
        fetch("/api/super-admin/stats", { headers }),
        fetch("/api/super-admin/activity?limit=6", { headers }),
        fetch("/api/super-admin/admin-activity?limit=6", { headers }),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();
      const adminData = await adminRes.json();

      if (statsData.success) setStats(statsData.data);
      else throw new Error(statsData.error || "Failed to load stats.");

      if (activityData.success) setRecentLogs(activityData.data);
      if (adminData.success) setRecentAdminLogs(adminData.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load Super Admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Global Control
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Vertx Energies Operations Command
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Global monitoring, administrative oversight, employee accountability & security event tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/super-admin/approvals"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/30 flex items-center gap-2 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Approvals Queue ({stats?.pendingApprovalsCount ?? 0})</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Pending Approvals */}
        <Link
          href="/super-admin/approvals"
          className="bg-amber-500/10 hover:bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats?.pendingApprovalsCount ?? 0}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>Review & Approve</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Total Employees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Staff</span>
            <Users2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalEmployees ?? "—"}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{stats?.activeEmployees ?? 0} Active</span>
          </div>
        </div>

        {/* Active Admins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Admins</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{stats?.activeAdmins ?? "—"}</div>
          <div className="text-[11px] text-slate-500 mt-1">Full CRM Admins</div>
        </div>

        {/* Inactive / Suspended */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Suspended</span>
            <UserMinus className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.suspendedEmployees ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats?.inactiveEmployees ?? 0} Inactive</div>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active EPC</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{stats?.activeProjects ?? "—"}</div>
          <div className="text-[11px] text-slate-500 mt-1">In Installation Pipeline</div>
        </div>

        {/* Delayed Projects */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Delayed EPC</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.delayedProjects ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Bottleneck Flagged</div>
        </div>

        {/* Overdue Duties */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Overdue Work</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.overdueDuties ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats?.todayFollowUps ?? 0} Follow-ups today</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/super-admin/employees"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-3">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition">
              Employee Control Center
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Manage accounts, assign roles, inspect workloads & execute force logout.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Manage Staff</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/super-admin/admin-activity"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition">
              Admin Activity Stream
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dedicated monitoring of actions executed exclusively by ADMIN accounts.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Monitor Admins</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/super-admin/activity"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
              Global Audit Log
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Append-only immutable record of all business, operational & override changes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
            <span>View Full Log</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/super-admin/security"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
              Security & Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Authentication history, failed logins, custom claims & session token revocations.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Security Center</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Two-Column Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Actions Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Admin Operations</h3>
            </div>
            <Link
              href="/super-admin/admin-activity"
              className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAdminLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent admin activity recorded.</p>
            ) : (
              recentAdminLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Live Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Global Operations Stream</h3>
            </div>
            <Link
              href="/super-admin/activity"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full Audit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit logs recorded.</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                        {log.action}
                      </span>
                      {log.isOverride && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          OVERRIDE
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
