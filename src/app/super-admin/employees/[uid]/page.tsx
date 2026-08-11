"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users2,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FolderKanban,
  CheckSquare,
  UserPlus,
  Activity,
  LogOut,
  UserCheck,
  UserMinus,
  RefreshCw,
  Edit,
  GitBranch,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { EmployeeWorkloadSummary, Project, Lead, Duty, Task, AuditLog, Role, EmployeeStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { STANDARD_EMPLOYEE_ROLES, ROLES_CONFIG } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;
  const { getIdToken, currentUser } = useAuth();

  const [summary, setSummary] = useState<EmployeeWorkloadSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeWorkloadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<Role>("SALES_EXECUTIVE");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<EmployeeStatus>("ACTIVE");

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignType, setReassignType] = useState<"PROJECT" | "LEAD" | "DUTY">("PROJECT");
  const [reassignEntityId, setReassignEntityId] = useState("");
  const [reassignTargetUid, setReassignTargetUid] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const [actionProcessing, setActionProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };

      const [detailRes, listRes] = await Promise.all([
        fetch(`/api/super-admin/employees/${uid}`, { headers }),
        fetch(`/api/super-admin/employees`, { headers }),
      ]);

      const detailData = await detailRes.json();
      const listData = await listRes.json();

      if (detailData.success) {
        setSummary(detailData.data.summary);
        setProjects(detailData.data.projects);
        setLeads(detailData.data.leads);
        setDuties(detailData.data.duties);
        setTasks(detailData.data.tasks);
        setActivity(detailData.data.recentActivity);
        setTargetRole(detailData.data.summary.user.role);
        setTargetStatus(detailData.data.summary.user.status || "ACTIVE");
      } else {
        throw new Error(detailData.error || "Employee not found.");
      }

      if (listData.success) {
        setAllEmployees(listData.data.filter((e: any) => e.user.uid !== uid));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uid) loadData();
  }, [uid]);

  const handleStatusUpdate = async () => {
    setActionProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${uid}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Status updated to ${targetStatus}.` });
        setStatusModalOpen(false);
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update status." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error updating status." });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleRoleUpdate = async () => {
    setActionProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${uid}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Role updated to ${targetRole}.` });
        setRoleModalOpen(false);
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update role." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error updating role." });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleForceLogout = async () => {
    if (!confirm(`Force logout ${summary?.user.name}? All active sessions will be revoked.`)) return;
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${uid}/force-logout`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Active sessions revoked for ${summary?.user.name}.` });
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to force logout." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error during force logout." });
    }
  };

  const handleReassignWork = async () => {
    if (!reassignEntityId || !reassignTargetUid) {
      alert("Please select a target work item and target employee.");
      return;
    }
    setActionProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/reassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({
          type: reassignType,
          entityId: reassignEntityId,
          newOwnerId: reassignTargetUid,
          reason: reassignReason || "Super Admin workload rebalancing",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Work successfully reassigned.` });
        setReassignModalOpen(false);
        setReassignEntityId("");
        setReassignTargetUid("");
        setReassignReason("");
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Reassignment failed." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error reassigning work." });
    } finally {
      setActionProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading Employee 360 profile & operational history...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        <Link
          href="/super-admin/employees"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employee List
        </Link>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
          {error || "Employee not found."}
        </div>
      </div>
    );
  }

  const isSuperAdminRole = summary.user.superAdmin || summary.user.role === "SUPER_ADMIN";
  const isCurrentSuperAdmin = currentUser?.uid === summary.user.uid;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/employees"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Back to Employees"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Employee 360</span> • <span>{summary.user.employeeCode}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>{summary.user.name}</span>
              {isSuperAdminRole && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-300">
                  SUPER ADMIN
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Super Admin Control Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleModalOpen(true)}
            disabled={isCurrentSuperAdmin}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition disabled:opacity-40"
          >
            Change Role
          </button>
          <button
            onClick={() => setStatusModalOpen(true)}
            disabled={isCurrentSuperAdmin}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition disabled:opacity-40"
          >
            Update Status
          </button>
          <button
            onClick={() => {
              setReassignType("PROJECT");
              setReassignModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 shadow-2xs transition"
          >
            Reassign Work
          </button>
          <button
            onClick={handleForceLogout}
            disabled={isCurrentSuperAdmin}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Force Logout</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Profile & Workload Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center">
              {summary.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">{summary.user.name}</h2>
              <p className="text-xs text-slate-500">{summary.user.designation}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Employee Code</span>
              <span className="font-mono font-bold text-slate-800">{summary.user.employeeCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email</span>
              <span className="font-medium text-slate-800">{summary.user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Phone</span>
              <span className="font-medium text-slate-800">{summary.user.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-slate-800">{summary.user.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Role</span>
              <span className="font-bold text-blue-600">{summary.user.role?.replace(/_/g, " ") || "Pending Role"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  summary.user.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : summary.user.status === "SUSPENDED"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {summary.user.status || "ACTIVE"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Login</span>
              <span className="font-mono text-slate-600">
                {summary.user.lastLoginAt ? new Date(summary.user.lastLoginAt).toLocaleString() : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Workload KPI Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Active Leads</div>
            <div className="text-3xl font-black text-blue-600 my-2">{summary.activeLeadsCount}</div>
            <div className="text-[11px] text-slate-400">In Sales Pipeline</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Assigned EPC</div>
            <div className="text-3xl font-black text-indigo-600 my-2">{summary.activeProjectsCount}</div>
            <div className="text-[11px] text-slate-400">Solar Projects</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Open Duties</div>
            <div className="text-3xl font-black text-slate-900 my-2">{summary.openDutiesCount}</div>
            <div className="text-[11px] text-slate-400">Pending Actions</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Overdue Duties</div>
            <div className="text-3xl font-black text-rose-600 my-2">{summary.overdueDutiesCount}</div>
            <div className="text-[11px] text-slate-400">Needs Follow-up</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Today&apos;s Tasks</div>
            <div className="text-2xl font-bold text-amber-600 my-1">{summary.todayTasksCount}</div>
            <div className="text-[11px] text-slate-400">Due Today</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Upcoming Tasks</div>
            <div className="text-2xl font-bold text-slate-800 my-1">{summary.upcomingTasksCount}</div>
            <div className="text-[11px] text-slate-400">Scheduled</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Completed Tasks</div>
            <div className="text-2xl font-bold text-emerald-600 my-1">{summary.completedTasksCount}</div>
            <div className="text-[11px] text-slate-400">Finished</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">Permissions</div>
            <div className="text-2xl font-bold text-purple-600 my-1">{summary.effectivePermissions.length}</div>
            <div className="text-[11px] text-slate-400">Active Grants</div>
          </div>
        </div>
      </div>

      {/* Activity Timeline & Assigned Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Immutable Audit Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Activity Timeline</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Real-time Events</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity for this employee.</p>
            ) : (
              activity.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Projects & Duties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Assigned Solar Work ({projects.length} Projects, {duties.length} Duties)</h3>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {projects.length === 0 && duties.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active projects or duties assigned.</p>
            ) : (
              <>
                {projects.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.projectNumber} ({p.customer?.name || "Customer"})</div>
                      <div className="text-[11px] text-slate-400 font-mono">Stage: {p.currentStage} • {p.systemSizeKw} kW</div>
                    </div>
                    <Link
                      href={`/projects/${p.id}`}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold text-blue-600"
                    >
                      View
                    </Link>
                  </div>
                ))}

                {duties.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Due: {new Date(d.dueDate).toLocaleDateString()} • Status: {d.status}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {d.dutyType}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role for ${summary.user.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a new role. Custom claims and effective permissions will be updated immediately.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              {STANDARD_EMPLOYEE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLES_CONFIG[r]?.name} ({r})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setRoleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleRoleUpdate}
              disabled={actionProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
            >
              {actionProcessing ? "Updating..." : "Save Role"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Status for ${summary.user.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as EmployeeStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={actionProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
            >
              {actionProcessing ? "Applying..." : "Save Status"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reassign Work Modal (Super Admin Override) */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Super Admin Work Reassignment (Override)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Transfer ownership of projects, leads, or duties from this employee to another staff member.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Type</label>
            <select
              value={reassignType}
              onChange={(e) => {
                setReassignType(e.target.value as any);
                setReassignEntityId("");
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="PROJECT">Solar Project</option>
              <option value="LEAD">Solar Lead</option>
              <option value="DUTY">Operational Duty</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Item to Reassign</label>
            <select
              value={reassignEntityId}
              onChange={(e) => setReassignEntityId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="">-- Choose Item --</option>
              {reassignType === "PROJECT" &&
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} ({p.customer?.name}) - {p.systemSizeKw} kW
                  </option>
                ))}
              {reassignType === "LEAD" &&
                leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadNumber} ({l.customerName}) - {l.estimatedSystemSizeKw} kW
                  </option>
                ))}
              {reassignType === "DUTY" &&
                duties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.dutyType})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assign To Employee</label>
            <select
              value={reassignTargetUid}
              onChange={(e) => setReassignTargetUid(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="">-- Choose Target Employee --</option>
              {allEmployees.map((e) => (
                <option key={e.user.uid} value={e.user.uid}>
                  {e.user.name} ({e.user.role?.replace(/_/g, " ") || "Staff"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Operational Override Notes</label>
            <input
              type="text"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Workload rebalancing, leave coverage, emergency reassignment"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            ⚡ This action will be logged in the immutable audit trail as <strong>SUPER_ADMIN_OVERRIDE</strong>.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleReassignWork}
              disabled={actionProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
            >
              {actionProcessing ? "Reassigning..." : "Execute Reassignment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
