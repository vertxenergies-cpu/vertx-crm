"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AuditLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";

export default function GlobalActivityPage() {
  const { getIdToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionCategory, setActionCategory] = useState("ALL");
  const [entityType, setEntityType] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };
      const params = new URLSearchParams();
      params.append("page", String(pageNum));
      params.append("limit", "25");
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (actionCategory !== "ALL") params.append("actionCategory", actionCategory);
      if (entityType !== "ALL") params.append("entityType", entityType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/super-admin/activity?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => (append ? [...prev, ...data.data] : data.data));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1, false);
  }, [roleFilter, actionCategory, entityType, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" /> Immutable Audit Trail
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Global Activity Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only record of all operational stage transitions, employee changes, role modifications and super admin overrides.
          </p>
        </div>

        <button
          onClick={() => loadLogs(1, false)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGEMENT">Management</option>
            <option value="SALES_EXECUTIVE">Sales Executive</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
          <select
            value={actionCategory}
            onChange={(e) => setActionCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="BUSINESS">Business & Projects</option>
            <option value="SECURITY">Security & Auth</option>
            <option value="ADMIN_MANAGEMENT">Admin Management</option>
            <option value="OVERRIDE">Super Admin Override</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Entities</option>
            <option value="USER">User / Employee</option>
            <option value="PROJECT">Solar Project</option>
            <option value="LEAD">Solar Lead</option>
            <option value="DUTY">Duty / Task</option>
            <option value="SETTINGS">Settings</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No activity records found matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.entityType}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{log.entityId}</div>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed">{log.description}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          log.isOverride || log.actionCategory === "OVERRIDE"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : log.actionCategory === "SECURITY"
                            ? "bg-rose-100 text-rose-900 border-rose-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {log.isOverride ? "OVERRIDE" : log.actionCategory || "BUSINESS"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Load More */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Showing {logs.length} of {total} total records</span>
          {hasMore && (
            <button
              onClick={() => loadLogs(page + 1, true)}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-bold transition"
            >
              {loading ? "Loading..." : "Load More Activity"}
            </button>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Actor</span>
                <span className="font-bold text-slate-900">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Action</span>
                <span className="font-bold text-blue-600">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-bold text-slate-800">{selectedLog.actionCategory || "BUSINESS"}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Description</span>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed font-medium">
                {selectedLog.description}
              </p>
            </div>

            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-rose-500 font-bold block mb-0.5">Previous Value</span>
                  <span className="font-mono text-rose-900">{selectedLog.oldValue || "None"}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-500 font-bold block mb-0.5">New Value</span>
                  <span className="font-mono text-emerald-900">{selectedLog.newValue || "None"}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-500 font-mono">
              <div>Log ID: {selectedLog.id}</div>
              <div>Entity: {selectedLog.entityType} ({selectedLog.entityId})</div>
              {selectedLog.ipAddress && <div>IP Address: {selectedLog.ipAddress}</div>}
              {selectedLog.userAgent && <div>User Agent: {selectedLog.userAgent}</div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
