"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react";
import { AuditLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";

export default function AdminActivityPage() {
  const { getIdToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadAdminLogs = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };
      const params = new URLSearchParams();
      params.append("page", String(pageNum));
      params.append("limit", "25");
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/super-admin/admin-activity?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => (append ? [...prev, ...data.data] : data.data));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to load admin logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminLogs(1, false);
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrative Oversight
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Admin Activity Stream
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated monitoring feed of all actions executed by ADMIN users (staff deactivations, role edits, project overrides, settings changes).
          </p>
        </div>

        <button
          onClick={() => loadAdminLogs(1, false)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Activity Date Range:</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Affected Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No admin actions recorded for this date period.
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
                      <div className="font-bold text-purple-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">System Admin</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono font-bold text-[10px]">
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

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
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

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Showing {logs.length} of {total} total records</span>
          {hasMore && (
            <button
              onClick={() => loadAdminLogs(page + 1, true)}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-bold transition"
            >
              {loading ? "Loading..." : "Load More Admin Activity"}
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Admin Activity Inspection"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">Admin</span>
                <span className="font-bold text-slate-900">{selectedLog.userName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
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
          </div>
        )}
      </Modal>
    </div>
  );
}
