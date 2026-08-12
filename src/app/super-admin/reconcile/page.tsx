"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Project, ProjectStage } from "@/types";
import { PROJECT_STAGES_CONFIG } from "@/lib/constants";
import { ProjectStageBadge, HealthBadge } from "@/components/ui/badges";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

export default function StageReconciliationPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected project for reconciliation modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [confirmedStages, setConfirmedStages] = useState<ProjectStage[]>([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFlaggedProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/super-admin/reconcile");
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      } else {
        throw new Error(data.error || "Failed to load reconciliation queue");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load reconciliation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedProjects();
  }, []);

  const handleOpenReconcileModal = (project: Project) => {
    setSelectedProject(project);
    setConfirmedStages(project.completedStages || []);
    setReason("Verified against existing project records.");
  };

  const handleConfirmReconciliation = async () => {
    if (!selectedProject) return;
    if (!reason || reason.trim().length < 5) {
      alert("A mandatory reconciliation reason (minimum 5 characters) is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${selectedProject.id}/stage/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmedStages,
          reason,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProject(null);
        setReason("");
        fetchFlaggedProjects();
      } else {
        alert(data.error || "Failed to reconcile project stages");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reconcile project stages");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Link
            href="/super-admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Super Admin Command
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Data Integrity
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Stage Data Reconciliation Queue
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Review and resolve legacy project stage inconsistencies to guarantee strict sequential progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFlaggedProjects}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Projects Table / Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h2 className="font-extrabold text-sm text-slate-900">
              Flagged Projects Requiring Historical Confirmation ({projects.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Scanning project database for stage inconsistencies...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">All Project Stages Verified</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Every active project in the database currently has a verified, contiguous completed stage sequence.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Current Working Stage</th>
                  <th className="py-3 px-4">Verified History</th>
                  <th className="py-3 px-4">Reconciliation Problem</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {projects.map((p) => {
                  const verifiedCount = (p.completedStages || []).length;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-blue-700 hover:text-blue-900 font-mono"
                        >
                          {p.projectNumber}
                        </Link>
                        <div className="text-[11px] text-slate-500">
                          {p.systemSizeKw} kW {p.projectType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.customer?.name}</div>
                        <div className="text-[11px] text-slate-500">{p.customer?.district}, Kerala</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <ProjectStageBadge stage={p.currentStage} />
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 font-mono">
                          {verifiedCount} / 12 Stages
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {Math.round((verifiedCount / 12) * 100)}% progress
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 text-amber-800 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{p.stageMigrationNotes || "Historical stage sequence is incomplete."}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenReconcileModal(p)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Review & Reconcile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SUPER ADMIN STAGE HISTORY RECONCILIATION MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-base">
                <Sliders className="w-5 h-5 text-amber-600" />
                <span>Review & Reconcile Stage History</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Super Admin Only
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">
                Reconcile Project #{selectedProject.projectNumber} ({selectedProject.customer?.name})
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Check all stages that have been operationally completed. Completed stages must form a continuous sequence from Booking.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Canonical 12-Stage Sequence
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 scrollbar-thin">
                {PROJECT_STAGES_CONFIG.map((st, idx) => {
                  const isChecked = confirmedStages.includes(st.id);

                  const handleToggleStage = (checked: boolean) => {
                    if (checked) {
                      const updated = PROJECT_STAGES_CONFIG.slice(0, idx + 1).map((s) => s.id);
                      setConfirmedStages(updated);
                    } else {
                      const updated = PROJECT_STAGES_CONFIG.slice(0, idx).map((s) => s.id);
                      setConfirmedStages(updated);
                    }
                  };

                  return (
                    <label
                      key={st.id}
                      className={clsx(
                        "flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition",
                        isChecked
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleStage(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span>
                          {st.stepNumber}. {st.label}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono uppercase">
                        {isChecked ? "✓ COMPLETED" : "LOCKED"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reconciliation Reason * (Mandatory, minimum 5 characters)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Verified against physical customer file, KSEB Soura feasibility receipt, and installation sign-off."
                className="w-full text-xs p-2.5 border rounded-xl"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {reason.trim().length}/5 characters minimum
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReconciliation}
                disabled={reason.trim().length < 5 || submitting}
                className={clsx(
                  "px-5 py-2 rounded-xl text-white font-bold shadow-sm transition inline-flex items-center gap-1.5",
                  reason.trim().length >= 5 && !submitting
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                )}
              >
                <Check className="w-4 h-4" />
                <span>
                  {submitting ? "Reconciling..." : "Confirm Historical Progress"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
