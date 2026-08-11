"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  UserMinus,
  LogOut,
  ChevronRight,
  RefreshCw,
  Clock,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  KeyRound,
  MoreVertical,
} from "lucide-react";
import { EmployeeWorkloadSummary, Role, EmployeeStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { STANDARD_EMPLOYEE_ROLES, ROLES_CONFIG } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";

export default function EmployeeControlCenterPage() {
  const { getIdToken, currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWorkloadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Selection for bulk operations
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "CHANGE_ROLE">("ACTIVATE");
  const [bulkTargetRole, setBulkTargetRole] = useState<Role>("SALES_EXECUTIVE");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Quick Action Modal
  const [activeEmployee, setActiveEmployee] = useState<EmployeeWorkloadSummary | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<Role>("SALES_EXECUTIVE");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<EmployeeStatus>("ACTIVE");
  const [actionProcessing, setActionProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };
      const params = new URLSearchParams();
      if (selectedRole !== "ALL") params.append("role", selectedRole);
      if (selectedDepartment !== "ALL") params.append("department", selectedDepartment);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (search) params.append("search", search);

      const res = await fetch(`/api/super-admin/employees?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to load employees." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Error fetching employees." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [selectedRole, selectedDepartment, selectedStatus]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Status Change Handler
  const handleStatusChange = async () => {
    if (!activeEmployee) return;
    setActionProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${activeEmployee.user.uid}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: "success", text: `Status updated to ${targetStatus} for ${activeEmployee.user.name}.` });
        setStatusModalOpen(false);
        loadEmployees();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to update status." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Error updating status." });
    } finally {
      setActionProcessing(false);
    }
  };

  // Role Change Handler
  const handleRoleChange = async () => {
    if (!activeEmployee) return;
    setActionProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${activeEmployee.user.uid}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: "success", text: `Role changed to ${targetRole} for ${activeEmployee.user.name}.` });
        setRoleModalOpen(false);
        loadEmployees();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to update role." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Error updating role." });
    } finally {
      setActionProcessing(false);
    }
  };

  // Force Logout Handler
  const handleForceLogout = async (employee: EmployeeWorkloadSummary) => {
    if (!confirm(`Force logout ${employee.user.name}? This will invalidate all active Firebase authentication sessions.`)) {
      return;
    }

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/employees/${employee.user.uid}/force-logout`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: "success", text: `Forced logout and revoked sessions for ${employee.user.name}.` });
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to force logout." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Error executing force logout." });
    }
  };

  // Bulk Operation Handler
  const handleBulkExecute = async () => {
    if (selectedUids.length === 0) return;
    setBulkProcessing(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({
          operation: bulkAction,
          userIds: selectedUids,
          newRole: bulkAction === "CHANGE_ROLE" ? bulkTargetRole : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: "success",
          text: `Bulk operation applied to ${data.data.modifiedCount} employees.`,
        });
        setBulkModalOpen(false);
        setSelectedUids([]);
        loadEmployees();
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Bulk operation failed." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Error executing bulk operation." });
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUids.length === employees.length) {
      setSelectedUids([]);
    } else {
      setSelectedUids(employees.map((e) => e.user.uid));
    }
  };

  const toggleSelectUid = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Users2 className="w-3.5 h-3.5" /> Staff Directory & Governance
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Employee Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Administrator oversight across all Vertx Energies employees, roles, operational workloads and security sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/super-admin/approvals"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Review Registrations</span>
          </Link>
          <button
            onClick={loadEmployees}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, employee code (EMP-...), email, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">System Admin</option>
              <option value="MANAGEMENT">Management</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="SALES_EXECUTIVE">Sales Executive</option>
              <option value="SURVEY_TEAM">Survey Team</option>
              <option value="DOCUMENTATION_TEAM">Documentation</option>
              <option value="KSEB_TEAM">KSEB Liaison</option>
              <option value="INSTALLATION_TEAM">Installation Team</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedUids.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-amber-50/50 p-2 rounded-xl text-xs font-bold text-slate-800">
            <span>{selectedUids.length} employees selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkAction("ACTIVATE");
                  setBulkModalOpen(true);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px]"
              >
                Activate Selected
              </button>
              <button
                onClick={() => {
                  setBulkAction("SUSPEND");
                  setBulkModalOpen(true);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px]"
              >
                Suspend Selected
              </button>
              <button
                onClick={() => {
                  setBulkAction("CHANGE_ROLE");
                  setBulkModalOpen(true);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px]"
              >
                Change Role...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUids.length === employees.length && employees.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Open Duties</th>
                <th className="py-3 px-4 text-center">Overdue</th>
                <th className="py-3 px-4 text-center">Assigned EPC</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No employees matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSuperAdminRole = emp.user.superAdmin || emp.user.role === "SUPER_ADMIN";
                  const isCurrentSuperAdmin = currentUser?.uid === emp.user.uid;

                  return (
                    <tr key={emp.user.uid} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUids.includes(emp.user.uid)}
                          onChange={() => toggleSelectUid(emp.user.uid)}
                          disabled={isSuperAdminRole}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/super-admin/employees/${emp.user.uid}`}
                          className="flex items-center gap-3 group-hover:text-blue-600"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                              <span>{emp.user.name}</span>
                              {isSuperAdminRole && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold border border-amber-300">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {emp.user.employeeCode} • {emp.user.email}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp.user.role?.replace(/_/g, " ") || "Pending Role"}
                        </div>
                        <div className="text-[11px] text-slate-400">{emp.user.department}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            emp.user.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : emp.user.status === "SUSPENDED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.user.status === "ACTIVE"
                                ? "bg-emerald-500"
                                : emp.user.status === "SUSPENDED"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {emp.user.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Workload Counts */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {emp.openDutiesCount}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {emp.overdueDutiesCount > 0 ? (
                          <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {emp.overdueDutiesCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-blue-600">
                        {emp.activeProjectsCount}
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {emp.user.lastLoginAt
                          ? new Date(emp.user.lastLoginAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/super-admin/employees/${emp.user.uid}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                            title="Inspect 360 profile, workload & audit timeline"
                          >
                            360 Detail
                          </Link>

                          {/* Role Change Modal Trigger */}
                          <button
                            onClick={() => {
                              setActiveEmployee(emp);
                              setTargetRole((emp.user.role || "SALES_EXECUTIVE") as Role);
                              setRoleModalOpen(true);
                            }}
                            disabled={isCurrentSuperAdmin}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 transition cursor-pointer disabled:opacity-40"
                            title="Change Role"
                          >
                            Role
                          </button>

                          {/* Status Change Modal Trigger */}
                          <button
                            onClick={() => {
                              setActiveEmployee(emp);
                              setTargetStatus(emp.user.status || "ACTIVE");
                              setStatusModalOpen(true);
                            }}
                            disabled={isCurrentSuperAdmin}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-40"
                            title="Update Status"
                          >
                            Status
                          </button>

                          {/* Force Logout */}
                          <button
                            onClick={() => handleForceLogout(emp)}
                            disabled={isCurrentSuperAdmin}
                            className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition cursor-pointer disabled:opacity-40"
                            title="Force Logout Session"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role for ${activeEmployee?.user.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Changing the employee&apos;s role will update their module permissions and Firebase authentication claims.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select New Role</label>
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

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">Role Note:</span> {ROLES_CONFIG[targetRole]?.description}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRoleChange}
              disabled={actionProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
            >
              {actionProcessing ? "Updating..." : "Confirm Role Change"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Status for ${activeEmployee?.user.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Suspended or inactive accounts are immediately blocked from logging in or performing operations.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Account Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as EmployeeStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ACTIVE">ACTIVE (Authorized to access CRM)</option>
              <option value="INACTIVE">INACTIVE (Deactivated staff account)</option>
              <option value="SUSPENDED">SUSPENDED (Security hold & session lock)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={actionProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30"
            >
              {actionProcessing ? "Updating..." : "Apply Status"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Operation Confirmation Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Confirm Bulk Operation on ${selectedUids.length} Employees`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-700 font-medium">
            You are about to execute <strong>{bulkAction}</strong> on <strong>{selectedUids.length}</strong> selected employee records.
          </p>

          {bulkAction === "CHANGE_ROLE" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
              <select
                value={bulkTargetRole}
                onChange={(e) => setBulkTargetRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                {STANDARD_EMPLOYEE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
            ⚠️ An immutable audit log will be generated for every modified employee record.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkExecute}
              disabled={bulkProcessing}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
            >
              {bulkProcessing ? "Executing..." : "Execute Bulk Change"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
