"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Shield,
  Briefcase,
  Mail,
  Phone,
  Hash,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { ROLES_CONFIG } from "@/lib/constants";

export default function ProfilePage() {
  const { currentUser, role, permissions, changePassword } = useAuth();
  const roleConfig = role ? ROLES_CONFIG[role] : null;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-type carefully.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
      setSuccessMsg("Password updated successfully! Your new password is now active in Firebase Authentication.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Profile & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Firebase Authentication identity, credentials, and role-based access matrix.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            {currentUser?.name?.slice(0, 2).toUpperCase() || "EP"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{currentUser?.name}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser?.designation} • {currentUser?.department}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.employeeCode || "EMP-001"}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> {roleConfig?.name || role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & System Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Contact Details</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.phone || "+91 98470 00000"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>Department: {currentUser?.department}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Firebase Identity</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Auth UID:</span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {currentUser?.uid || currentUser?.id}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Role ID:</span>
              <span className="font-bold text-blue-700">{role}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Assigned Capabilities:</span>
              <span className="font-bold text-slate-900">{permissions.length} capabilities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Management Card (Firebase Auth Root Sync) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" /> Change Firebase Authentication Password
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Updating your password here will immediately synchronize and update your Firebase Authentication root password.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full text-xs pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating Firebase Root Password...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Update Password in Firebase
              </>
            )}
          </button>
        </form>
      </div>

      {/* Permissions Matrix for this Role */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" /> Active Role Capabilities & Permissions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {roleConfig?.description || "Role permissions enforced via Firestore Security Rules."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {permissions.map((perm) => (
            <div
              key={perm}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-[11px] text-slate-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
