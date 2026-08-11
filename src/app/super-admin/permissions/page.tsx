"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Users2,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { EmployeeWorkloadSummary, Role, Permission } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ROLES_CONFIG, STANDARD_EMPLOYEE_ROLES } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";

export default function PermissionsMatrixPage() {
  const { getIdToken } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWorkloadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWorkloadSummary | null>(null);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [customGrants, setCustomGrants] = useState<Permission[]>([]);
  const [customDenials, setCustomDenials] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers = { Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "" };
      const res = await fetch("/api/super-admin/permissions", { headers });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data.employees);
        if (data.data.employees.length > 0 && !selectedEmployee) {
          setSelectedEmployee(data.data.employees[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (emp: EmployeeWorkloadSummary) => {
    setSelectedEmployee(emp);
    setCustomGrants(emp.user.customPermissions?.grants || []);
    setCustomDenials(emp.user.customPermissions?.denials || []);
    setEditModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/super-admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token.replace("Bearer ", "")}` : "",
        },
        body: JSON.stringify({
          uid: selectedEmployee.user.uid,
          customPermissions: {
            grants: customGrants,
            denials: customDenials,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Permissions updated for ${selectedEmployee.user.name}.` });
        setEditModalOpen(false);
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update permissions." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error saving permissions." });
    } finally {
      setSaving(false);
    }
  };

  const allAvailablePermissions = ROLES_CONFIG.SUPER_ADMIN.permissions;

  const filteredEmployees = employees.filter(
    (e) =>
      e.user.name.toLowerCase().includes(search.toLowerCase()) ||
      e.user.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      (e.user.role?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <KeyRound className="w-3.5 h-3.5" /> Access Control Governance
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Role Permissions & Effective Access
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic permission evaluation: <code className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded">EFFECTIVE = BASE_ROLE + CUSTOM_GRANTS - CUSTOM_DENIALS</code>.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Staff Selector */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Select Staff Member ({filteredEmployees.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, role..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="max-h-[480px] overflow-y-auto space-y-1 pr-1">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmployee?.user.uid === emp.user.uid;
              return (
                <button
                  key={emp.user.uid}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-purple-50/80 border-purple-300 shadow-xs"
                      : "bg-white border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{emp.user.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {emp.user.role?.replace(/_/g, " ") || "Pending Role"} • {emp.user.employeeCode}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                    {emp.effectivePermissions.length} perms
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Effective Permissions Inspector & Override Trigger */}
        <div className="lg:col-span-8 space-y-6">
          {selectedEmployee && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Effective Permissions Breakdown
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{selectedEmployee.user.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedEmployee.user.role?.replace(/_/g, " ") || "Pending Role"}
                    </span>
                  </h2>
                </div>

                <button
                  onClick={() => openEditModal(selectedEmployee)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Configure Custom Overrides</span>
                </button>
              </div>

              {/* Permission Computation Formula */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700 mb-1">1. Base Role Permissions</div>
                  <div className="text-xl font-black text-slate-900">
                    {selectedEmployee.user.role && ROLES_CONFIG[selectedEmployee.user.role]
                      ? ROLES_CONFIG[selectedEmployee.user.role].permissions.length
                      : 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Defined in standard role matrix</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-800 mb-1">2. Custom Grants (+)</div>
                  <div className="text-xl font-black text-emerald-700">
                    {selectedEmployee.user.customPermissions?.grants?.length || 0}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">Elevated individual privileges</div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="font-bold text-rose-800 mb-1">3. Custom Denials (-)</div>
                  <div className="text-xl font-black text-rose-700">
                    {selectedEmployee.user.customPermissions?.denials?.length || 0}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">Explicitly revoked permissions</div>
                </div>
              </div>

              {/* All System Permissions Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>Module Permissions ({selectedEmployee.effectivePermissions.length} Active)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {allAvailablePermissions.map((perm) => {
                    const isGranted = selectedEmployee.effectivePermissions.includes(perm);
                    const isCustomGrant = selectedEmployee.user.customPermissions?.grants?.includes(perm);
                    const isCustomDenial = selectedEmployee.user.customPermissions?.denials?.includes(perm);

                    return (
                      <div
                        key={perm}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          isGranted
                            ? "bg-slate-50/80 border-slate-200 text-slate-800"
                            : "bg-slate-100/50 border-slate-200 text-slate-400 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isGranted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className="font-mono text-[11px] truncate font-medium">{perm}</span>
                        </div>

                        {isCustomGrant && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            +GRANT
                          </span>
                        )}

                        {isCustomDenial && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            -DENY
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Custom Overrides Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Custom Overrides for ${selectedEmployee?.user.name}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Assign custom permission grants or denials to this specific employee. Custom grants add access; custom denials revoke access.
          </p>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {allAvailablePermissions.map((perm) => {
              const baseRoleHas = selectedEmployee?.user.role && ROLES_CONFIG[selectedEmployee.user.role]
                ? ROLES_CONFIG[selectedEmployee.user.role].permissions.includes(perm)
                : false;
              const isGranted = customGrants.includes(perm);
              const isDenied = customDenials.includes(perm);

              return (
                <div
                  key={perm}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900">{perm}</span>
                    <span className="text-[10px] text-slate-400 block">
                      Base role default: {baseRoleHas ? "Granted" : "Denied"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDenials((prev) => prev.filter((p) => p !== perm));
                        if (isGranted) {
                          setCustomGrants((prev) => prev.filter((p) => p !== perm));
                        } else {
                          setCustomGrants((prev) => [...prev, perm]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                        isGranted
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      + Grant
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomGrants((prev) => prev.filter((p) => p !== perm));
                        if (isDenied) {
                          setCustomDenials((prev) => prev.filter((p) => p !== perm));
                        } else {
                          setCustomDenials((prev) => [...prev, perm]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                        isDenied
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                      }`}
                    >
                      - Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
            >
              {saving ? "Saving..." : "Save Custom Overrides"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
