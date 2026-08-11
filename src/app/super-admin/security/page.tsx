"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Server,
  UserX,
} from "lucide-react";
import { AuditLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";

export default function SecurityEventsPage() {
  const { getIdToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadSecurityLogs = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };
      const params = new URLSearchParams();
      params.append("page", String(pageNum));
      params.append("limit", "25");
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/super-admin/security?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => (append ? [...prev, ...data.data] : data.data));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to load security logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityLogs(1, false);
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" /> Security & Access Governance
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Security Events & Sessions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of authentication activities, credential verification, session revocations, role transitions and access anomalies.
          </p>
        </div>

        <button
          onClick={() => loadSecurityLogs(1, false)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Server className="w-4 h-4" /> Firebase Custom Claims Authority Active
          </div>
          <p className="text-xs text-slate-300">
            Super Administrator tokens are signed and verified server-side with custom claim <code className="text-amber-300 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">superAdmin: true</code>.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Session Revocation: Enabled
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Security Date Range:</span>
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

      {/* Security Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Security Action</th>
                <th className="py-3 px-4">Initiator / Actor</th>
                <th className="py-3 px-4">Target Employee</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No security events recorded for this period.
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
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                          log.action === "FORCE_LOGOUT"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : log.action === "USER_SUSPENDED"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>{log.action}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.targetUserName || "—"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.targetUserId || "—"}</div>
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
          <span>Showing {logs.length} of {total} total security events</span>
          {hasMore && (
            <button
              onClick={() => loadSecurityLogs(page + 1, true)}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-bold transition"
            >
              {loading ? "Loading..." : "Load More Security Events"}
            </button>
          )}
        </div>
      </div>

      {/* Security Event Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Security Audit Inspection"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Initiating Actor</span>
                <span className="font-bold text-slate-900">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Employee</span>
                <span className="font-bold text-slate-900">{selectedLog.targetUserName || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Action</span>
                <span className="font-bold text-rose-700 font-mono">{selectedLog.action}</span>
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

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-500 font-mono">
              <div>Event ID: {selectedLog.id}</div>
              {selectedLog.ipAddress && <div>IP Address: {selectedLog.ipAddress}</div>}
              {selectedLog.userAgent && <div>User Agent: {selectedLog.userAgent}</div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
