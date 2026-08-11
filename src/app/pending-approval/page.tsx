"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  AlertOctagon,
  CheckCircle2,
  RotateCw,
  LogOut,
  Mail,
  Shield,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { currentUser, firebaseUser, signOut } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any | null>(currentUser);
  const [message, setMessage] = useState<string | null>(null);

  // Check and refresh status from backend
  const checkStatus = async () => {
    setRefreshing(true);
    setMessage(null);

    try {
      if (!firebaseUser) {
        setRefreshing(false);
        return;
      }

      const idToken = await firebaseUser.getIdToken(true);
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const found = data.data;
        setUserData(found);

        if (found.approvalStatus === "APPROVED" && (found.status === "ACTIVE" || found.active === true)) {
          setMessage("Your account has been approved! Redirecting to CRM...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
          return;
        }
      }

      setMessage("Status refreshed: Waiting for Super Administrator approval.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Failed to refresh status:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser);
      if (currentUser.approvalStatus === "APPROVED" && (currentUser.status === "ACTIVE" || currentUser.active === true)) {
        router.push("/dashboard");
      }
    }
  }, [currentUser, router]);

  const isRejected = userData?.approvalStatus === "REJECTED";
  const isApproved = userData?.approvalStatus === "APPROVED" && userData?.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl mb-4">
          <Image src="/logo.png" alt="Vertx Energies" width={56} height={56} className="h-12 w-auto" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">VERTX ENERGIES</h2>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mt-1">
          Solar Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800/80 text-center space-y-6">
          {/* Top Status Icon */}
          {isRejected ? (
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/10">
              <AlertOctagon className="w-8 h-8" />
            </div>
          ) : isApproved ? (
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
          )}

          {/* Heading and Description */}
          <div>
            <h3 className="text-xl font-extrabold text-white">
              {isRejected
                ? "Registration Not Approved"
                : isApproved
                ? "Account Approved!"
                : "Account Pending Approval"}
            </h3>
            <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
              {isRejected
                ? "Your VERTX ENERGIES employee registration has not been approved at this time."
                : isApproved
                ? "Your account has been approved by the Super Administrator with full CRM access."
                : "Your employee account is awaiting authorization from the VERTX ENERGIES Super Administrator."}
            </p>
          </div>

          {/* User & Status Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">Employee Name</span>
              <span className="text-white font-bold">{userData?.name || "Registered Employee"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">Email Address</span>
              <span className="text-white font-medium">{userData?.email || firebaseUser?.email || "—"}</span>
            </div>

            {userData?.department && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Department</span>
                <span className="text-white font-medium">{userData.department}</span>
              </div>
            )}

            {userData?.designation && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Designation</span>
                <span className="text-white font-medium">{userData.designation}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-400 font-medium">Access Status</span>
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px]",
                  isRejected
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                    : isApproved
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {isRejected ? "Not Approved" : isApproved ? "Active & Approved" : "Pending Super Admin Review"}
              </span>
            </div>

            {/* If there is an explicit rejection reason */}
            {isRejected && userData?.rejectionReason && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs">
                <strong className="block font-bold text-rose-300 mb-1">Administrative Note:</strong>
                <p>{userData.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Status Message toast if any */}
          {message && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold animate-fadeIn">
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isRejected ? (
              <button
                onClick={checkStatus}
                disabled={refreshing}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                {refreshing ? "Checking Status..." : "Refresh Approval Status"}
              </button>
            ) : (
              <a
                href="mailto:vertxenergies@gmail.com"
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Contact Super Administrator
              </a>
            )}

            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 bg-slate-950/60 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-400" /> Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
