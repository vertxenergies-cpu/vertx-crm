"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Phone,
  Mail,
  ShieldCheck,
  UserPlus,
  CheckCircle,
  Hash,
  Briefcase,
  X,
  Lock,
  UserX,
  UserCheck,
} from "lucide-react";
import { User, Role } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ROLES_CONFIG } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { clsx } from "clsx";

export default function TeamPage() {
  const { allUsers, currentUser, hasPermission } = useAuth();
  const [team, setTeam] = useState<User[]>(allUsers);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for new employee
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [roleId, setRoleId] = useState<Role>("SALES_EXECUTIVE");
  const [department, setDepartment] = useState("Sales & Marketing");
  const [designation, setDesignation] = useState("Solar Consultant");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTeam(d.data);
      })
      .catch(console.error);

    Promise.all([fetch("/api/leads").then((r) => r.json()), fetch("/api/projects").then((r) => r.json())])
      .then(([lData, pData]) => {
        if (lData.success) setLeads(lData.data);
        if (pData.success) setProjects(pData.data);
      })
      .catch((err) => console.error(err));
  }, [allUsers]);

  const roleBadgeColors: Record<Role, string> = {
    SUPER_ADMIN: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold",
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    MANAGEMENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
    PROJECT_MANAGER: "bg-cyan-100 text-cyan-800 border-cyan-200",
    SALES_EXECUTIVE: "bg-blue-100 text-blue-800 border-blue-200",
    SURVEY_TEAM: "bg-emerald-100 text-emerald-800 border-emerald-200",
    DOCUMENTATION_TEAM: "bg-teal-100 text-teal-800 border-teal-200",
    KSEB_TEAM: "bg-amber-100 text-amber-800 border-amber-200",
    INSTALLATION_TEAM: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newEmp: User = {
        id: `usr-${Date.now()}`,
        uid: `usr-${Date.now()}`,
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name,
        email,
        phone,
        role: roleId,
        roleId,
        superAdmin: false,
        department,
        designation: designation || ROLES_CONFIG[roleId]?.name,
        active: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTeam([...team, newEmp]);
      setCreateModalOpen(false);
      setName("");
      setEmail("");
      setPhone("+91 ");
    } catch (err) {
      console.error("Failed to create employee:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setTeam(
      team.map((u) => (u.id === userId ? { ...u, active: !u.active, updatedAt: new Date().toISOString() } : u))
    );
  };

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN" || currentUser?.superAdmin === true;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team & Role-Based Workload</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational assignments across sales, surveying, documentation, KSEB liaison, and site engineering.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Add Employee Account
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((user) => {
          const userLeads = leads.filter((l) => l.assignedSalespersonId === user.id);
          const userProjects = projects.filter(
            (p) =>
              p.salespersonId === user.id ||
              p.projectManagerId === user.id ||
              p.nextActionOwnerId === user.id ||
              p.siteSupervisorId === user.id
          );
          const isCurrentUser = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={clsx(
                "bg-white rounded-2xl border p-5 shadow-card transition-all flex flex-col justify-between",
                !user.active ? "opacity-60 bg-slate-50 border-slate-200" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{user.name}</h3>
                      {user.active ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <span
                      className={clsx(
                        "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border",
                        user.role && roleBadgeColors[user.role] ? roleBadgeColors[user.role] : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {user.role ? user.role.replace(/_/g, " ") : "Unassigned"}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {user.employeeCode || "EMP-000"}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.designation || "Specialist"} • {user.department || "Operations"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                {/* Workload Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Leads</span>
                    <span className="text-base font-extrabold text-slate-900">{userLeads.length}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Projects</span>
                    <span className="text-base font-extrabold text-blue-700">{userProjects.length}</span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && !isCurrentUser && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={clsx(
                      "w-full py-1.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5",
                      user.active
                        ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                        : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    )}
                  >
                    {user.active ? (
                      <>
                        <UserX className="w-3.5 h-3.5" /> Deactivate Account
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Re-activate Account
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Employee Account"
        icon={<UserPlus className="w-5 h-5 text-blue-600" />}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-200/60 text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-employee-form"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {saving ? "Creating..." : "Create Account & Profile"}
            </button>
          </>
        }
      >
        <form id="create-employee-form" onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@keralasolar.local"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Role Assignment</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value as Role)}
              className="w-full p-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              {Object.values(ROLES_CONFIG)
                .filter((r) => r.id !== "SUPER_ADMIN")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.department})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
