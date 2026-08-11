"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  Building2,
  FileCheck2,
  Landmark,
  Zap,
  Wrench,
  Gift,
  CheckSquare,
  History,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Send,
  Camera,
  Check,
} from "lucide-react";
import {
  Project,
  ProjectStage,
  ProjectHealth,
  DocumentStatus,
  LoanStatus,
  KsebStatus,
  InstallationStatus,
  SubsidyStatus,
  ChecklistItem,
} from "@/types";
import {
  HealthBadge,
  ProjectStageBadge,
  DocumentStatusBadge,
  LoanStatusBadge,
  KsebStatusBadge,
  PriorityBadge,
} from "@/components/ui/badges";
import { NextActionCard } from "@/components/ui/NextActionCard";
import { ProjectProgress } from "@/components/ui/ProjectProgress";
import { PROJECT_STAGES_CONFIG } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500 animate-pulse">Loading project details...</div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}

function ProjectDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, allUsers } = useAuth();

  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "overview");

  // Stage change modal state
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<ProjectStage>("INSTALLATION");
  const [stageComment, setStageComment] = useState("");

  // Health update state
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [targetHealth, setTargetHealth] = useState<ProjectHealth>("ON_TRACK");
  const [healthReason, setHealthReason] = useState("");

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Task creation state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("usr-super-admin");
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?entityType=PROJECT&entityId=${projectId}`);
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/audit?entityId=${projectId}`);
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchNotes();
    fetchAuditLogs();
  }, [projectId]);

  if (loading || !project) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-32 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  // Stage change handler
  const handleConfirmStageChange = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: targetStage,
          comment: stageComment,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStageModalOpen(false);
        setStageComment("");
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Health change handler
  const handleConfirmHealthChange = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          health: targetHealth,
          reason: healthReason,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHealthModalOpen(false);
        setHealthReason("");
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simplified Document Status Update Handler
  const handleUpdateDocStatus = async (docId: string, newStatus: DocumentStatus) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stage Trackers updates
  const handleUpdateLoan = async (updates: any) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/loan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, _userId: currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateKseb = async (updates: any) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/kseb`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, _userId: currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleInstallationItem = async (itemId: string) => {
    if (!project.installationDetail) return;
    const currentChecklist = project.installationDetail.checklist || [];
    const updated = currentChecklist.map((item: ChecklistItem) => {
      if (item.id === itemId) {
        const nextStatus = item.status === "COMPLETED" ? "PENDING" : "COMPLETED";
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null,
          completedBy: nextStatus === "COMPLETED" ? (currentUser?.name || "Installation Lead") : null,
        };
      }
      return item;
    });

    try {
      const res = await fetch(`/api/projects/${projectId}/installation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updated, _userId: currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubsidy = async (updates: any) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/subsidy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, _userId: currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          projectId: project.id,
          customerId: project.customerId,
          assignedUserId: newTaskAssignee,
          dueDate: new Date(newTaskDueDate).toISOString(),
          priority: "HIGH",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle("");
        fetchProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "PROJECT",
          entityId: project.id,
          authorId: currentUser?.id || "usr-super-admin",
          authorName: currentUser?.name || "Staff",
          content: newNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mathematically Accurate Document Metrics (COLLECTED terminology)
  const docs = project.documents || [];
  const totalDocsCount = docs.length;
  const collectedDocsCount = docs.filter((d) => d.status === "COLLECTED").length;
  const pendingDocsCount = docs.filter((d) => d.status === "PENDING").length;
  const notRequiredDocsCount = docs.filter((d) => d.status === "NOT_REQUIRED").length;

  const requiredDocs = docs.filter((d) => d.isRequired && d.status !== "NOT_REQUIRED");
  const collectedRequiredCount = docs.filter((d) => d.isRequired && d.status === "COLLECTED").length;
  const pendingRequiredCount = docs.filter((d) => d.isRequired && d.status === "PENDING").length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back Button & Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Solar Projects
        </Link>

        <div className="flex items-center gap-2">
          {/* Change Stage Button */}
          <button
            onClick={() => {
              setTargetStage(project.currentStage);
              setStageModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            Change Stage
          </button>

          {/* Change Health Button */}
          <button
            onClick={() => {
              setTargetHealth(project.overallStatus);
              setHealthModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition"
          >
            Update Health
          </button>
        </div>
      </div>

      {/* HERO HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {project.customer?.name}
              </h1>
              <HealthBadge health={project.overallStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-slate-600">
              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {project.projectNumber}
              </span>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> {project.systemSizeKw} kW {project.projectType} Solar
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {project.customer?.district}, Kerala
              </span>
              <span>•</span>
              <span>
                KSEB Section: <strong>{project.ksebDetail?.sectionOffice || project.customer?.ksebSection || "Pending"}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Stage</span>
              <span className="font-bold text-blue-700 text-sm">
                {PROJECT_STAGES_CONFIG.find((s) => s.id === project.currentStage)?.label || project.currentStage}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Manager</span>
              <span className="font-semibold text-slate-900">{project.projectManager?.name || "Admin"}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sales Lead</span>
              <span className="font-semibold text-slate-900">{project.salesperson?.name || "Sales"}</span>
            </div>
          </div>
        </div>

        {/* PROMINENT NEXT ACTION CARD */}
        <NextActionCard
          projectId={project.id}
          actionTitle={project.nextActionTitle}
          owner={project.nextActionOwner}
          dueDate={project.nextActionDueDate}
          status={project.nextActionStatus}
          onActionUpdated={fetchProjectDetails}
        />

        {/* VISUAL INTERACTIVE PROGRESS PIPELINE */}
        <ProjectProgress
          currentStage={project.currentStage}
          onStageSelect={(stage) => {
            setTargetStage(stage);
            setStageModalOpen(true);
          }}
        />
      </div>

      {/* MODULAR PROJECT TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-4 scrollbar-thin">
          {[
            { id: "overview", label: "Overview & Specs", icon: FolderKanban },
            { id: "documents", label: `Documents (${collectedDocsCount}/${totalDocsCount})`, icon: FileCheck2 },
            { id: "loan", label: `Loan (${project.loanDetail?.status.replace(/_/g, " ") || "N/A"})`, icon: Landmark },
            { id: "kseb", label: `KSEB Soura (${project.ksebDetail?.status.replace(/_/g, " ") || "N/A"})`, icon: Building2 },
            { id: "installation", label: "Installation & Crew", icon: Wrench },
            { id: "subsidy", label: "PM Surya Ghar", icon: Gift },
            { id: "tasks", label: `Tasks (${project.tasks?.length || 0})`, icon: CheckSquare },
            { id: "timeline", label: "Audit Timeline", icon: History },
            { id: "notes", label: `Team Notes (${notes.length})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* COMPACT PROJECT STATUS OVERVIEW (AT-A-GLANCE SUMMARY) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" /> Operational Status Overview
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">At-a-Glance Lifecycle State</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  {/* Documents Compact Box */}
                  <div
                    onClick={() => setActiveTab("documents")}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition shadow-2xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Documents</span>
                    <div className="font-bold text-slate-900 text-xs mt-1">
                      {collectedDocsCount} / {totalDocsCount} Collected
                    </div>
                    <span
                      className={clsx(
                        "text-[11px] font-semibold block mt-0.5",
                        pendingRequiredCount > 0 ? "text-amber-700 font-bold" : "text-emerald-700"
                      )}
                    >
                      {pendingRequiredCount > 0 ? `⚠ ${pendingRequiredCount} Pending` : "✓ All Collected"}
                    </span>
                  </div>

                  {/* Loan Compact Box */}
                  <div
                    onClick={() => setActiveTab("loan")}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition shadow-2xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loan</span>
                    <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                      {project.loanDetail?.loanRequired ? project.loanDetail.financeProvider || "Bank Loan" : "Self-Funded"}
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium capitalize">
                      {project.loanDetail?.status ? project.loanDetail.status.toLowerCase().replace(/_/g, " ") : "Not required"}
                    </span>
                  </div>

                  {/* KSEB Compact Box */}
                  <div
                    onClick={() => setActiveTab("kseb")}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition shadow-2xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KSEB Soura</span>
                    <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                      {project.ksebDetail?.sectionOffice || project.customer?.ksebSection || "Section Office"}
                    </div>
                    <span className="text-[11px] text-blue-700 block mt-0.5 font-semibold capitalize truncate">
                      {project.ksebDetail?.status ? project.ksebDetail.status.toLowerCase().replace(/_/g, " ") : "Not started"}
                    </span>
                  </div>

                  {/* Installation Compact Box */}
                  <div
                    onClick={() => setActiveTab("installation")}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition shadow-2xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Installation</span>
                    <div className="font-bold text-slate-900 text-xs mt-1">
                      {project.installationDetail?.checklist
                        ? `${project.installationDetail.checklist.filter((i: any) => i.status === "COMPLETED").length}/14 Checked`
                        : "0/14 Checked"}
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium capitalize">
                      {project.installationDetail?.status ? project.installationDetail.status.toLowerCase().replace(/_/g, " ") : "Pending"}
                    </span>
                  </div>

                  {/* Subsidy Compact Box */}
                  <div
                    onClick={() => setActiveTab("subsidy")}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition shadow-2xs group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PM Surya Ghar</span>
                    <div className="font-bold text-slate-900 text-xs mt-1">
                      ₹{(project.subsidyDetail?.estimatedSubsidyAmount || 78000).toLocaleString("en-IN")}
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium capitalize">
                      {project.subsidyDetail?.status ? project.subsidyDetail.status.toLowerCase().replace(/_/g, " ") : "Not started"}
                    </span>
                  </div>
                </div>

                {/* Pending Document Alert Banner */}
                {pendingRequiredCount > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>{pendingRequiredCount} Required Customer Document(s) Pending</strong> — Complete collection before KSEB application submission.
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs transition shrink-0"
                    >
                      Update Documents →
                    </button>
                  </div>
                )}
              </div>

              {/* Specs & Team Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* System Specifications */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Technical System Specs
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block mb-0.5">System Capacity</span>
                      <span className="font-bold text-slate-800 text-sm">{project.systemSizeKw} kW Rooftop Solar</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Solar PV Modules</span>
                      <span className="font-semibold text-slate-800">{project.panelMake}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">On-Grid Solar Inverter</span>
                      <span className="font-semibold text-slate-800">{project.inverterMake}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Project Type</span>
                      <span className="font-semibold text-slate-800">{project.projectType} On-Grid Net Metered</span>
                    </div>
                  </div>
                </div>

                {/* Customer & Location */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" /> Customer & Site Profile
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Full Name</span>
                      <span className="font-bold text-slate-800">{project.customer?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Phone & WhatsApp</span>
                      <span className="font-semibold text-slate-800">{project.customer?.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Site Address & District</span>
                      <span className="font-medium text-slate-700">{project.customer?.address}, {project.customer?.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Roof & Property Type</span>
                      <span className="font-medium text-slate-700">{project.customer?.propertyType}</span>
                    </div>
                  </div>
                </div>

                {/* External Accounts Boundary Box */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-blue-600" /> External Accounts System
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200/70 text-blue-900">
                        Reference Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Detailed invoices, ledger, supplier procurement and payments reside in the separate Accounts software.
                    </p>

                    <div className="mt-3 pt-3 border-t border-blue-200/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Project Value:</span>
                        <span className="text-base font-extrabold text-blue-950">
                          ₹{project.estimatedProjectValue?.toLocaleString("en-IN") || "2,85,000"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Accounts Ref ID:</span>
                        <span className="font-mono font-bold text-slate-700">{project.accountsReferenceId || "ACC-INV-2026-0982"}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={project.accountsUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    Open in Accounts System <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Assigned Project Operations Team */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 mb-3">Assigned Operations Team</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Project Manager</span>
                    <span className="font-bold text-slate-800 text-sm">{project.projectManager?.name}</span>
                    <span className="text-[11px] text-slate-500 block">{project.projectManager?.phone}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Sales Representative</span>
                    <span className="font-bold text-slate-800 text-sm">{project.salesperson?.name}</span>
                    <span className="text-[11px] text-slate-500 block">{project.salesperson?.phone}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block">Site Installation Supervisor</span>
                    <span className="font-bold text-slate-800 text-sm">{project.siteSupervisor?.name || "Jijo Varghese"}</span>
                    <span className="text-[11px] text-slate-500 block">+91 94466 78901</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STREAMLINED DOCUMENTS STATUS TRACKING */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* TOP SUMMARY (MATHEMATICALLY ACCURATE) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Status Tracking</span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {collectedDocsCount} / {totalDocsCount} Collected
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {collectedRequiredCount} of {requiredDocs.length} Required Documents Collected
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    ✓ {collectedDocsCount} Collected
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    ⚠ {pendingDocsCount} Pending
                  </span>
                  {notRequiredDocsCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      — {notRequiredDocsCount} Not Required
                    </span>
                  )}
                </div>
              </div>

              {/* DOCUMENT CHECKLIST ROWS */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                  Customer Documents
                </div>

                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Left: Document Name, Required/Optional, Status Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm">{doc.title}</span>

                      {doc.isRequired ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Optional
                        </span>
                      )}

                      <DocumentStatusBadge status={doc.status} />
                    </div>

                    {/* Right: Quick 1-Click Status Toggles */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {doc.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "COLLECTED")}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Collected
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "NOT_REQUIRED")}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            Not Required
                          </button>
                        </>
                      )}

                      {doc.status === "COLLECTED" && (
                        <>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "PENDING")}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                          >
                            Mark Pending
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "NOT_REQUIRED")}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                          >
                            Not Required
                          </button>
                        </>
                      )}

                      {doc.status === "NOT_REQUIRED" && (
                        <>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "PENDING")}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            Mark Pending
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "COLLECTED")}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          >
                            Mark Collected
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOAN TRACKING */}
          {activeTab === "loan" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Solar Finance & Bank Loan Tracker</h3>
                  <p className="text-xs text-slate-500">
                    Track NBFC / Bank loan processing status without accounting calculations.
                  </p>
                </div>
                <LoanStatusBadge status={project.loanDetail?.status || "NOT_REQUIRED"} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Loan Required?</span>
                  <select
                    value={project.loanDetail?.loanRequired ? "YES" : "NO"}
                    onChange={(e) => handleUpdateLoan({ loanRequired: e.target.value === "YES" })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="YES">Yes - Bank Loan Required</option>
                    <option value="NO">No - Self-funded Client</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Finance Provider / Bank</span>
                  <input
                    type="text"
                    value={project.loanDetail?.financeProvider || ""}
                    onChange={(e) => handleUpdateLoan({ financeProvider: e.target.value })}
                    placeholder="e.g. State Bank of India (Surya Ghar)"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Loan Application Number</span>
                  <input
                    type="text"
                    value={project.loanDetail?.applicationNumber || ""}
                    onChange={(e) => handleUpdateLoan({ applicationNumber: e.target.value })}
                    placeholder="SBI-SG-2026-89412"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Sanctioned Loan Amount (₹)</span>
                  <input
                    type="number"
                    value={project.loanDetail?.loanAmount || ""}
                    onChange={(e) => handleUpdateLoan({ loanAmount: parseFloat(e.target.value) })}
                    placeholder="200000"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Loan Processing Status</span>
                  <select
                    value={project.loanDetail?.status || "NOT_STARTED"}
                    onChange={(e) => handleUpdateLoan({ status: e.target.value as LoanStatus })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-semibold"
                  >
                    <option value="NOT_REQUIRED">NOT REQUIRED</option>
                    <option value="NOT_STARTED">NOT STARTED</option>
                    <option value="APPLICATION_SUBMITTED">APPLICATION SUBMITTED</option>
                    <option value="DOCUMENT_VERIFICATION">DOCUMENT VERIFICATION</option>
                    <option value="UNDER_PROCESS">UNDER PROCESS</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="DISBURSEMENT_PENDING">DISBURSEMENT PENDING</option>
                    <option value="DISBURSED">DISBURSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loan Processing Notes</label>
                <textarea
                  rows={3}
                  value={project.loanDetail?.notes || ""}
                  onChange={(e) => handleUpdateLoan({ notes: e.target.value })}
                  placeholder="e.g. Sanction letter received @ 7% concessional interest. Margin money paid."
                  className="w-full text-xs p-3 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 4: KSEB TRACKING */}
          {activeTab === "kseb" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">KSEB Soura Portal & Net Metering Workflow</h3>
                  <p className="text-xs text-slate-500">
                    Track Kerala State Electricity Board feasibility, agreement, section inspection, and bi-directional meter installation.
                  </p>
                </div>
                <KsebStatusBadge status={project.ksebDetail?.status || "NOT_STARTED"} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">KSEB 13-digit Consumer #</span>
                  <input
                    type="text"
                    value={project.ksebDetail?.consumerNumber || ""}
                    onChange={(e) => handleUpdateKseb({ consumerNumber: e.target.value })}
                    placeholder="1155420018942"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Electrical Section Office</span>
                  <input
                    type="text"
                    value={project.ksebDetail?.sectionOffice || ""}
                    onChange={(e) => handleUpdateKseb({ sectionOffice: e.target.value })}
                    placeholder="Kozhikode Town"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Soura Application #</span>
                  <input
                    type="text"
                    value={project.ksebDetail?.applicationNumber || ""}
                    onChange={(e) => handleUpdateKseb({ applicationNumber: e.target.value })}
                    placeholder="KSEB-KL-2026-98124"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Feasibility Power Allocation</span>
                  <input
                    type="text"
                    value={project.ksebDetail?.feasibilityStatus || ""}
                    onChange={(e) => handleUpdateKseb({ feasibilityStatus: e.target.value })}
                    placeholder="Approved (160kVA available)"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Agreement Status</span>
                  <input
                    type="text"
                    value={project.ksebDetail?.agreementStatus || ""}
                    onChange={(e) => handleUpdateKseb({ agreementStatus: e.target.value })}
                    placeholder="Signed on ₹200 Stamp Paper"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">KSEB Overall Workflow Status</span>
                  <select
                    value={project.ksebDetail?.status || "NOT_STARTED"}
                    onChange={(e) => handleUpdateKseb({ status: e.target.value as KsebStatus })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-semibold"
                  >
                    <option value="NOT_STARTED">NOT STARTED</option>
                    <option value="DOCUMENTATION">DOCUMENTATION</option>
                    <option value="APPLICATION_PREPARATION">APPLICATION PREPARATION</option>
                    <option value="APPLICATION_SUBMITTED">APPLICATION SUBMITTED</option>
                    <option value="FEASIBILITY">FEASIBILITY APPROVED</option>
                    <option value="AGREEMENT">AGREEMENT SIGNED</option>
                    <option value="INSPECTION">INSPECTION SCHEDULED</option>
                    <option value="APPROVED">INSPECTION APPROVED</option>
                    <option value="NET_METER_PENDING">NET METER PENDING</option>
                    <option value="NET_METER_INSTALLED">NET METER INSTALLED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">KSEB Section Notes & Instructions</label>
                <textarea
                  rows={3}
                  value={project.ksebDetail?.notes || ""}
                  onChange={(e) => handleUpdateKseb({ notes: e.target.value })}
                  placeholder="e.g. Feasibility approved for 5kW. Agreement stamp paper ₹200 purchased."
                  className="w-full text-xs p-3 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 5: INSTALLATION TRACKING */}
          {activeTab === "installation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">14-Item Technical Installation Checklist & Proofs</h3>
                  <p className="text-xs text-slate-500">
                    Verify physical mounting, wiring, earthing pits, and surge protection compliance.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                  Status: {project.installationDetail?.status || "NOT_STARTED"}
                </span>
              </div>

              {/* 14-Item Checklist */}
              <div className="space-y-2">
                {(project.installationDetail?.checklist || []).map((item: ChecklistItem, index: number) => {
                  const isDone = item.status === "COMPLETED";
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleInstallationItem(item.id)}
                      className={clsx(
                        "p-3 rounded-xl border transition cursor-pointer flex items-center justify-between",
                        isDone
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs",
                            isDone ? "bg-emerald-600 text-white" : "border-2 border-slate-300 bg-white"
                          )}
                        >
                          {isDone && "✓"}
                        </div>
                        <span className={clsx("font-medium text-xs", isDone ? "text-slate-800" : "text-slate-600")}>
                          {index + 1}. {item.title}
                        </span>
                      </div>

                      {isDone && item.completedBy && (
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Done by {item.completedBy}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Photo Proofs Gallery */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" /> Installation Site Photos & Proofs
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(project.installationDetail?.photos || []).map((photo: any) => (
                    <div key={photo.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={photo.url} alt={photo.title} className="w-full h-44 object-cover" />
                      <div className="p-3">
                        <h5 className="font-bold text-slate-900 text-xs">{photo.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUBSIDY TRACKING */}
          {activeTab === "subsidy" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">PM Surya Ghar: Muft Bijli Yojana Central Subsidy</h3>
                  <p className="text-xs text-slate-500">
                    Track National Portal direct benefit transfer (DBT) credit to customer bank account.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Status: {project.subsidyDetail?.status || "NOT_STARTED"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">National Portal Application #</span>
                  <input
                    type="text"
                    value={project.subsidyDetail?.portalApplicationNumber || ""}
                    onChange={(e) => handleUpdateSubsidy({ portalApplicationNumber: e.target.value })}
                    placeholder="PMSG-KL-2026-98124"
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Estimated Subsidy Claim (₹)</span>
                  <input
                    type="number"
                    value={project.subsidyDetail?.estimatedSubsidyAmount || 78000}
                    onChange={(e) => handleUpdateSubsidy({ estimatedSubsidyAmount: parseFloat(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Subsidy Workflow Status</span>
                  <select
                    value={project.subsidyDetail?.status || "NOT_STARTED"}
                    onChange={(e) => handleUpdateSubsidy({ status: e.target.value as SubsidyStatus })}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-semibold"
                  >
                    <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                    <option value="NOT_STARTED">NOT STARTED</option>
                    <option value="APPLICATION">APPLICATION SUBMITTED</option>
                    <option value="INSPECTION">INSPECTION</option>
                    <option value="APPROVAL">APPROVAL</option>
                    <option value="PROCESSING">PROCESSING IN QUEUE</option>
                    <option value="CREDITED">CREDITED TO BANK</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TASKS */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-bold text-sm text-slate-900">Project Tasks & Action Items</h3>
              </div>

              {/* Add Task Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task for this project..."
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  + Add Task
                </button>
              </div>

              <div className="space-y-2">
                {(project.tasks || []).map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Assigned to: {t.assignedUser?.name || "Team"}</span>
                        <span>• Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="pb-3 border-b">
                <h3 className="font-bold text-sm text-slate-900">Chronological Milestone & Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Full immutable history of every stage change, document status update, loan sanction, and health transition.
                </p>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-4">
                {auditLogs.length === 0 ? (
                  <p className="text-slate-400 italic">No audit events recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-100" />
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <strong className="text-slate-800">{log.userName}</strong>
                          <span>({log.userRole})</span>
                          <span>•</span>
                          <span>{new Date(log.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          {log.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 9: TEAM NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a project note or update..."
                  className="flex-1 text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Post Note
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <strong className="text-slate-800">{n.authorName}</strong>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STAGE CHANGE MODAL */}
      {stageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">Change Project Stage</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Next Operational Stage *</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value as ProjectStage)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
              >
                {PROJECT_STAGES_CONFIG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stepNumber}. {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Log Comment</label>
              <textarea
                rows={2}
                value={stageComment}
                onChange={(e) => setStageComment(e.target.value)}
                placeholder="e.g. KSEB feasibility approved by section engineer"
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setStageModalOpen(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleConfirmStageChange} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                Confirm Stage Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH UPDATE MODAL */}
      {healthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">Update Project Health Status</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Health Category *</label>
              <select
                value={targetHealth}
                onChange={(e) => setTargetHealth(e.target.value as ProjectHealth)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
              >
                <option value="ON_TRACK">🟢 On Track</option>
                <option value="AT_RISK">🟠 At Risk</option>
                <option value="DELAYED">🔴 Delayed</option>
                <option value="ON_HOLD">⚪ On Hold</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason / Explanation</label>
              <textarea
                rows={2}
                value={healthReason}
                onChange={(e) => setHealthReason(e.target.value)}
                placeholder="e.g. Waiting for KSEB section re-inspection schedule"
                className="w-full text-xs p-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setHealthModalOpen(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleConfirmHealthChange} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
