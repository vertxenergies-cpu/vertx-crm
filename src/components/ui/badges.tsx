import React from "react";
import {
  ProjectHealth,
  ProjectStage,
  LeadStage,
  Priority,
  LeadPriority,
  DocumentStatus,
  LoanStatus,
  KsebStatus,
  InstallationStatus,
  SubsidyStatus,
} from "@/types";
import { PROJECT_HEALTH_CONFIG, LEAD_STAGES_CONFIG, PROJECT_STAGES_CONFIG } from "@/lib/constants";
import { clsx } from "clsx";

export function HealthBadge({ health }: { health: ProjectHealth }) {
  const cfg = PROJECT_HEALTH_CONFIG[health] || PROJECT_HEALTH_CONFIG.ON_TRACK;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        cfg.bgColor,
        cfg.color,
        cfg.borderColor
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", cfg.dotColor)} />
      {cfg.label}
    </span>
  );
}

export function ProjectStageBadge({ stage }: { stage: ProjectStage }) {
  const cfg = PROJECT_STAGES_CONFIG.find((s) => s.id === stage);
  const label = cfg?.shortLabel || stage;

  let colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
  if (stage === "COMPLETED") colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (stage === "ON_HOLD") colorClasses = "bg-slate-100 text-slate-700 border-slate-300";
  if (stage === "CANCELLED") colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  if (stage === "INSTALLATION") colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
  if (stage === "KSEB_INSPECTION" || stage === "NET_METER") colorClasses = "bg-purple-50 text-purple-700 border-purple-200";

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border", colorClasses)}>
      {label}
    </span>
  );
}

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  const cfg = LEAD_STAGES_CONFIG.find((s) => s.id === stage);
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border",
        cfg?.bgColor || "bg-slate-50 border-slate-200",
        cfg?.color || "text-slate-700"
      )}
    >
      {cfg?.label || stage}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority | LeadPriority }) {
  let badge = "bg-slate-100 text-slate-700 border-slate-200";
  let label: React.ReactNode = priority;

  if (priority === "HOT") {
    badge = "bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse";
    label = "🔥 HOT";
  } else if (priority === "HIGH") {
    badge = "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
  } else if (priority === "MEDIUM") {
    badge = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (priority === "LOW") {
    badge = "bg-slate-100 text-slate-600 border-slate-200";
  }

  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs border", badge)}>
      {label}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "COLLECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ✓ Collected
        </span>
      );
    case "NOT_REQUIRED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          — Not Required
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ⚠ Pending
        </span>
      );
  }
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  switch (status) {
    case "APPROVED":
    case "DISBURSED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{status}</span>;
    case "UNDER_PROCESS":
    case "DOCUMENT_VERIFICATION":
    case "APPLICATION_SUBMITTED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">{status.replace(/_/g, " ")}</span>;
    case "REJECTED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">REJECTED</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{status.replace(/_/g, " ")}</span>;
  }
}

export function KsebStatusBadge({ status }: { status: KsebStatus }) {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
    case "NET_METER_INSTALLED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{status.replace(/_/g, " ")}</span>;
    case "INSPECTION":
    case "NET_METER_PENDING":
    case "APPLICATION_SUBMITTED":
    case "FEASIBILITY":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">{status.replace(/_/g, " ")}</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{status.replace(/_/g, " ")}</span>;
  }
}
