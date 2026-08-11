"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Role, ApprovalStatus } from "@/types";
import {
  UserCheck,
  UserX,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Search,
  Filter,
  Shield,
  Briefcase,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
} from "lucide-react";
import { ROLES_CONFIG } from "@/lib/constants";
import { clsx } from "clsx";

export default function SuperAdminApprovalsPage() {
  const { getIdToken } = useAuth();

  const [activeTab, setActiveTab] = useState<ApprovalStatus>("PENDING");
  const [queue, setQueue] = useState<User[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Review & Approval Modal State
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("SALES_EXECUTIVE");
  const [assignedEmployeeCode, setAssignedEmployeeCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "SUCCESS" | "ERROR"; message: string } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/super-admin/approvals", {
        headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.data.queue || []);
        setCounts(data.data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 });
      }
    } catch (err) {
      console.error("Failed to load approval queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [getIdToken]);

  // Filter queue by active tab and search
  const filteredUsers = queue.filter((u) => {
    const matchesTab = u.approvalStatus === activeTab;
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openReviewModal = (user: User) => {
    setReviewUser(user);
    setSelectedRole((user.role as Role) || "SALES_EXECUTIVE");
    setAssignedEmployeeCode(
      user.employeeCode && user.employeeCode !== "PENDING"
        ? user.employeeCode
        : `EMP-${Math.floor(100 + Math.random() * 900)}`
    );
    setConfirmApproveOpen(false);
  };

  const handleApprove = async () => {
    if (!reviewUser) return;
    setActionLoading(true);

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/approvals/${reviewUser.uid}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: selectedRole,
          employeeCode: assignedEmployeeCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "SUCCESS",
          message: `Employee ${reviewUser.name} approved successfully with role ${selectedRole}.`,
        });
        setReviewUser(null);
        setConfirmApproveOpen(false);
        fetchQueue();
      } else {
        setFeedback({ type: "ERROR", message: data.error || "Failed to approve employee." });
      }
    } catch (err: any) {
      console.error("Approval error:", err);
      setFeedback({ type: "ERROR", message: "Network error approving employee." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewUser) return;
    setActionLoading(true);

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/approvals/${reviewUser.uid}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rejectionReason: rejectReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "SUCCESS",
          message: `Registration for ${reviewUser.name} rejected.`,
        });
        setRejectModalOpen(false);
        setReviewUser(null);
        setRejectReason("");
        fetchQueue();
      } else {
        setFeedback({ type: "ERROR", message: data.error || "Failed to reject registration." });
      }
    } catch (err: any) {
      console.error("Rejection error:", err);
      setFeedback({ type: "ERROR", message: "Network error rejecting registration." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (user: User) => {
    setActionLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/super-admin/approvals/${user.uid}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "SUCCESS",
          message: `Registration for ${user.name} reopened and moved to PENDING queue.`,
        });
        fetchQueue();
      } else {
        setFeedback({ type: "ERROR", message: data.error || "Failed to reopen registration." });
      }
    } catch (err: any) {
      console.error("Reopen error:", err);
      setFeedback({ type: "ERROR", message: "Network error reopening registration." });
    } finally {
      setActionLoading(false);
    }
  };

  // Eligible roles (excluding SUPER_ADMIN)
  const assignableRoles: Role[] = [
    "ADMIN",
    "MANAGEMENT",
    "SALES_EXECUTIVE",
    "SURVEY_TEAM",
    "DOCUMENTATION_TEAM",
    "KSEB_TEAM",
    "INSTALLATION_TEAM",
    "PROJECT_MANAGER",
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" /> Super Admin Access Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Employee Approvals Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Review incoming staff registrations, verify employee codes, assign operational roles, and grant authorized CRM access.
            </p>
          </div>

          <button
            onClick={fetchQueue}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md transition flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <RotateCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh Queue
          </button>
        </div>

        {/* Counter Summary Pills */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div
            onClick={() => setActiveTab("PENDING")}
            className={clsx(
              "p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between",
              activeTab === "PENDING"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
            )}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block">Pending Review</span>
              <span className="text-xl font-extrabold text-white">{counts.pending}</span>
            </div>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>

          <div
            onClick={() => setActiveTab("APPROVED")}
            className={clsx(
              "p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between",
              activeTab === "APPROVED"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
            )}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block">Active Staff</span>
              <span className="text-xl font-extrabold text-white">{counts.approved}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div
            onClick={() => setActiveTab("REJECTED")}
            className={clsx(
              "p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between",
              activeTab === "REJECTED"
                ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
            )}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block">Not Approved</span>
              <span className="text-xl font-extrabold text-white">{counts.rejected}</span>
            </div>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={clsx(
            "p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn",
            feedback.type === "SUCCESS"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "SUCCESS" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department, designation..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer",
              activeTab === "PENDING"
                ? "bg-white text-amber-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending ({counts.pending})
          </button>

          <button
            onClick={() => setActiveTab("APPROVED")}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer",
              activeTab === "APPROVED"
                ? "bg-white text-emerald-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approved ({counts.approved})
          </button>

          <button
            onClick={() => setActiveTab("REJECTED")}
            className={clsx(
              "px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer",
              activeTab === "REJECTED"
                ? "bg-white text-rose-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Rejected ({counts.rejected})
          </button>
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading registrations queue...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {activeTab === "PENDING"
                ? "No Pending Registrations"
                : activeTab === "APPROVED"
                ? "No Approved Employees Yet"
                : "No Rejected Registrations"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === "PENDING"
                ? "When employees register via the portal, their submissions will appear here for review."
                : "Employees approved by the Super Admin will be listed here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Department & Designation</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4">Status & Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const regDate = user.registeredAt || user.createdAt;
                  const formattedDate = regDate
                    ? new Date(regDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={user.uid || user.id} className="hover:bg-slate-50/60 transition group">
                      {/* Name & Code */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block group-hover:text-blue-600 transition">
                              {user.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {user.employeeCode && user.employeeCode !== "PENDING"
                                ? user.employeeCode
                                : "Code Unassigned"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Designation */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">{user.department}</span>
                          <span className="text-slate-500 text-[11px] block">{user.designation}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {user.approvalStatus === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        ) : user.approvalStatus === "APPROVED" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Staff
                            </span>
                            <span className="block text-[10px] font-bold text-slate-600">
                              Role: {user.role?.replace(/_/g, " ")}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[11px]">
                            <AlertOctagon className="w-3 h-3 text-rose-600" /> Not Approved
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {user.approvalStatus === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openReviewModal(user)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Review & Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewUser(user);
                                setRejectModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : user.approvalStatus === "REJECTED" ? (
                          <button
                            onClick={() => handleReopen(user)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Reopen for Review
                          </button>
                        ) : (
                          <button
                            onClick={() => openReviewModal(user)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Role Assignment Modal */}
      {reviewUser && !rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Review Employee Registration</h3>
                  <p className="text-xs text-slate-500">Verify details and assign operational role.</p>
                </div>
              </div>
              <button
                onClick={() => setReviewUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Employee Profile Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Full Name</span>
                  <span className="text-slate-900 font-bold text-sm">{reviewUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Email</span>
                  <span className="text-slate-900 font-medium">{reviewUser.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Department</span>
                  <span className="text-slate-800 font-medium">{reviewUser.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Designation</span>
                  <span className="text-slate-800 font-medium">{reviewUser.designation}</span>
                </div>
              </div>
            </div>

            {/* Role & Employee Code Assignment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Official Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignedEmployeeCode}
                  onChange={(e) => setAssignedEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Assign Operational Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLES_CONFIG[role]?.name || role} ({ROLES_CONFIG[role]?.department || role})
                    </option>
                  ))}
                </select>

                {/* Role Description Card */}
                {ROLES_CONFIG[selectedRole] && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                    <p className="font-medium">{ROLES_CONFIG[selectedRole].description}</p>
                    <p className="text-[11px] text-blue-700">
                      <strong>Department:</strong> {ROLES_CONFIG[selectedRole].department} •{" "}
                      <strong>Permissions:</strong> {ROLES_CONFIG[selectedRole].permissions.length} actions granted
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Dialog Step */}
            {confirmApproveOpen ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3 animate-fadeIn">
                <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> Confirm Employee Approval
                </div>
                <p className="leading-relaxed">
                  Are you sure you want to approve <strong className="text-slate-900">{reviewUser.name}</strong>?
                  They will immediately receive full CRM access under the role{" "}
                  <strong className="text-slate-900">{selectedRole}</strong> with Employee Code{" "}
                  <strong className="font-mono text-slate-900">{assignedEmployeeCode}</strong>.
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setConfirmApproveOpen(false)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {actionLoading ? "Approving..." : "Yes, Approve & Activate"}
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Actions */
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reject Registration
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewUser(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setConfirmApproveOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" /> Approve Employee
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Registration Modal */}
      {rejectModalOpen && reviewUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Registration</h3>
                <p className="text-xs text-slate-500">Employee: {reviewUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Please provide a reason for rejecting this registration. This will be stored for audit purposes and visible to the employee on their status page.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Employee details could not be verified by HR department."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
