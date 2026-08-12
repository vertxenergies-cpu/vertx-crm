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
  Wallet,
  CreditCard,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  ChevronDown,
  Minus,
  Lock,
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
  PaymentMode,
  PaymentMilestone,
  PaymentMilestoneStatus,
  ProjectDeletionReason,
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
import {
  PROJECT_STAGES_CONFIG,
  ROLES_CONFIG,
  canUserDeleteProject,
  PROJECT_DELETION_REASONS_CONFIG,
  NEXT_STAGE_MAP,
  canCompleteStage,
  calculateProjectProgress,
  getStageState,
  CANONICAL_PROJECT_STAGES,
  normalizeStageId,
} from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

function DocumentStatusDropdown({
  currentStatus,
  onSelectStatus,
}: {
  currentStatus: DocumentStatus;
  onSelectStatus: (newStatus: DocumentStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const config: Record<
    DocumentStatus,
    { label: string; icon: string; buttonClasses: string }
  > = {
    COLLECTED: {
      label: "Collected",
      icon: "✓",
      buttonClasses:
        "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold",
    },
    PENDING: {
      label: "Pending",
      icon: "⚠",
      buttonClasses:
        "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold",
    },
    NOT_REQUIRED: {
      label: "Not Required",
      icon: "—",
      buttonClasses:
        "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-semibold",
    },
  };

  const current = config[currentStatus] || config.PENDING;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "inline-flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl border text-xs shadow-2xs transition cursor-pointer select-none min-w-[136px]",
          current.buttonClasses
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="font-bold">{current.icon}</span>
          <span>{current.label}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-fadeIn text-xs">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (currentStatus !== "COLLECTED") onSelectStatus("COLLECTED");
            }}
            className={clsx(
              "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 text-emerald-800 transition font-semibold cursor-pointer",
              currentStatus === "COLLECTED" && "bg-emerald-50/70 font-bold"
            )}
          >
            <span className="w-4 text-center font-bold text-emerald-600">✓</span>
            <span>Collected</span>
            {currentStatus === "COLLECTED" && (
              <span className="ml-auto text-[10px] text-emerald-600 font-bold">Current</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (currentStatus !== "PENDING") onSelectStatus("PENDING");
            }}
            className={clsx(
              "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-amber-50 text-amber-900 transition font-semibold cursor-pointer",
              currentStatus === "PENDING" && "bg-amber-50/70 font-bold"
            )}
          >
            <span className="w-4 text-center font-bold text-amber-600">⚠</span>
            <span>Pending</span>
            {currentStatus === "PENDING" && (
              <span className="ml-auto text-[10px] text-amber-700 font-bold">Current</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (currentStatus !== "NOT_REQUIRED") onSelectStatus("NOT_REQUIRED");
            }}
            className={clsx(
              "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 text-slate-700 transition font-semibold cursor-pointer",
              currentStatus === "NOT_REQUIRED" && "bg-slate-100/70 font-bold"
            )}
          >
            <span className="w-4 text-center font-bold text-slate-500">—</span>
            <span>Not Required</span>
            {currentStatus === "NOT_REQUIRED" && (
              <span className="ml-auto text-[10px] text-slate-500 font-bold">Current</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

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
  const { currentUser, allUsers, getIdToken } = useAuth();

  const projectId = params.id as string;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.email === "vertxenergies@gmail.com";
  const permissions = currentUser?.role ? (ROLES_CONFIG[currentUser.role]?.permissions || []) : [];
  const canDelete = canUserDeleteProject(currentUser);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "overview");

  // Delete project state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState<ProjectDeletionReason>("DUPLICATE_ENTRY");
  const [deletionDetails, setDeletionDetails] = useState("");
  const [duplicateOfProjectId, setDuplicateOfProjectId] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [otherProjectsList, setOtherProjectsList] = useState<any[]>([]);

  // Restore project state
  const [restoring, setRestoring] = useState(false);

  // Strict Sequential Stage Advance Modal state
  const [completeStageModalOpen, setCompleteStageModalOpen] = useState(false);
  const [stageComment, setStageComment] = useState("");
  const [advancingStage, setAdvancingStage] = useState(false);
  const [inlineConfirmations, setInlineConfirmations] = useState<Record<string, boolean>>({});

  // Super Admin Stage Override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTargetStage, setOverrideTargetStage] = useState<ProjectStage>("BOOKING");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [overriding, setOverriding] = useState(false);

  // Super Admin Stage History Reconciliation state
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [reconcileConfirmedStages, setReconcileConfirmedStages] = useState<ProjectStage[]>([]);
  const [reconcileReason, setReconcileReason] = useState("");
  const [reconciling, setReconciling] = useState(false);

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

  // Payment milestone tracking state
  const [editingMilestone, setEditingMilestone] = useState<PaymentMilestone | null>(null);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    amount: "0",
    status: "PENDING" as PaymentMilestoneStatus,
    dueDate: "",
    collectedDate: "",
    notes: "",
  });
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const fetchActiveProjectsForDuplicate = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/projects", { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOtherProjectsList(json.data.filter((p: Project) => p.id !== projectId && p.projectNumber !== project?.projectNumber));
      }
    } catch (err) {
      console.error("Failed to fetch other projects for duplicate selection:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmed) return;
    if (deletionReason === "DUPLICATE_ENTRY" && !duplicateOfProjectId) {
      alert("Please select or enter the original project that this is a duplicate of.");
      return;
    }
    if (deletionReason === "OTHER" && (!deletionDetails || deletionDetails.trim().length < 5)) {
      alert("Please provide a meaningful explanation when selecting Other.");
      return;
    }

    try {
      setDeleting(true);
      const token = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          reason: deletionReason,
          details: deletionDetails,
          duplicateOfProjectId: deletionReason === "DUPLICATE_ENTRY" ? duplicateOfProjectId : undefined,
          _userId: currentUser?.uid || currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        router.push("/projects");
      } else {
        alert(data.error || "Failed to delete project");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreProject = async () => {
    if (!confirm("Restore this project to the active project pipeline?")) return;
    try {
      setRestoring(true);
      const token = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers,
        body: JSON.stringify({ _userId: currentUser?.uid || currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjectDetails();
        fetchAuditLogs();
        alert("Project restored to active pipeline successfully.");
      } else {
        alert(data.error || "Failed to restore project");
      }
    } catch (err: any) {
      alert(err.message || "Failed to restore project");
    } finally {
      setRestoring(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/projects/${projectId}`, { headers });
      const data = await res.json();
      if (data.success && data.data) {
        setProject(data.data);
      } else {
        setProject(null);
      }
    } catch (err) {
      console.error(err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/notes?entityType=PROJECT&entityId=${projectId}`, { headers });
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/audit?entityId=${projectId}`, { headers });
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-32 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">ACCESS DENIED</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          You are not authorized to view this project or the project does not exist.
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  // Strict Sequential Stage Advance Handler
  const handleConfirmStageAdvance = async () => {
    if (!project) return;
    try {
      setAdvancingStage(true);
      const res = await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStage: NEXT_STAGE_MAP[project.currentStage],
          comment: stageComment,
          confirmations: inlineConfirmations,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCompleteStageModalOpen(false);
        setStageComment("");
        setInlineConfirmations({});
        fetchProjectDetails();
        fetchAuditLogs();
      } else {
        alert(data.error || "Cannot complete stage");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to complete project stage");
    } finally {
      setAdvancingStage(false);
    }
  };

  // Super Admin Stage Override Handler
  const handleConfirmStageOverride = async () => {
    if (!project) return;
    if (!overrideReason || overrideReason.trim().length < 5) {
      alert("A mandatory reason (minimum 5 characters) is required for stage override.");
      return;
    }
    if (!overrideConfirmed) {
      alert("Please confirm the override acknowledgment checkbox.");
      return;
    }

    try {
      setOverriding(true);
      const res = await fetch(`/api/projects/${projectId}/stage/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStage: overrideTargetStage,
          reason: overrideReason,
          confirmation: true,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOverrideModalOpen(false);
        setOverrideReason("");
        setOverrideConfirmed(false);
        fetchProjectDetails();
        fetchAuditLogs();
      } else {
        alert(data.error || "Failed to override project stage");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to override project stage");
    } finally {
      setOverriding(false);
    }
  };

  // Super Admin Stage History Reconciliation Handler
  const handleConfirmStageReconciliation = async () => {
    if (!project) return;
    if (!reconcileReason || reconcileReason.trim().length < 5) {
      alert("A mandatory reconciliation reason (minimum 5 characters) is required.");
      return;
    }

    try {
      setReconciling(true);
      const res = await fetch(`/api/projects/${projectId}/stage/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmedStages: reconcileConfirmedStages,
          reason: reconcileReason,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReconcileModalOpen(false);
        setReconcileReason("");
        fetchProjectDetails();
        fetchAuditLogs();
      } else {
        alert(data.error || "Failed to reconcile project stages");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reconcile project stages");
    } finally {
      setReconciling(false);
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

  // Payment Milestone Action Handlers
  const handleToggleMilestoneStatus = async (milestone: PaymentMilestone, newStatus: PaymentMilestoneStatus) => {
    try {
      setUpdatingPayment(true);
      const res = await fetch(`/api/projects/${projectId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          status: newStatus,
          collectedDate: newStatus === "COLLECTED" ? new Date().toISOString() : null,
          _userId: currentUser?.uid || currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        fetchAuditLogs();
      } else {
        alert(`Failed to update payment status: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleUpdatePaymentMode = async (newMode: PaymentMode) => {
    try {
      setUpdatingPayment(true);
      const res = await fetch(`/api/projects/${projectId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: newMode,
          _userId: currentUser?.uid || currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        fetchAuditLogs();
      } else {
        alert(`Failed to update payment mode: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleSaveMilestoneDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    try {
      setUpdatingPayment(true);
      const res = await fetch(`/api/projects/${projectId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: editingMilestone.id,
          amount: parseFloat(milestoneForm.amount) || editingMilestone.amount,
          status: milestoneForm.status,
          dueDate: milestoneForm.dueDate || null,
          collectedDate: milestoneForm.collectedDate || null,
          notes: milestoneForm.notes || null,
          _userId: currentUser?.uid || currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        setMilestoneModalOpen(false);
        setEditingMilestone(null);
        fetchAuditLogs();
      } else {
        alert(`Failed to update milestone: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingPayment(false);
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
  const totalRequiredCount = docs.filter((d) => d.isRequired).length;
  const collectedRequiredCount = docs.filter((d) => d.isRequired && d.status === "COLLECTED").length;
  const pendingRequiredCount = docs.filter((d) => d.isRequired && d.status === "PENDING").length;
  const notRequiredDocsCount = docs.filter((d) => d.status === "NOT_REQUIRED").length;
  const optionalDocsCount = docs.filter((d) => !d.isRequired).length;
  const totalCollectedDocsCount = docs.filter((d) => d.status === "COLLECTED").length;
  const totalPendingDocsCount = docs.filter((d) => d.status === "PENDING").length;

  // Strict Sequential Stage Gating Variables & Readiness Evaluation
  const currentStageConfig = PROJECT_STAGES_CONFIG.find(
    (s) => normalizeStageId(s.id) === normalizeStageId(project.currentStage)
  );
  const currentStepIdx = PROJECT_STAGES_CONFIG.findIndex(
    (s) => normalizeStageId(s.id) === normalizeStageId(project.currentStage)
  );
  const stageNumber = currentStepIdx === -1 ? 1 : currentStepIdx + 1;
  const nextStageId = NEXT_STAGE_MAP[project.currentStage];
  const nextStageConfig = nextStageId
    ? PROJECT_STAGES_CONFIG.find((s) => normalizeStageId(s.id) === normalizeStageId(nextStageId))
    : null;

  const effectiveProjectForValidation = {
    ...project,
    installationDetail: {
      ...project.installationDetail,
      ...inlineConfirmations,
    },
    ksebDetail: {
      ...project.ksebDetail,
      ...inlineConfirmations,
    },
    subsidyDetail: {
      ...project.subsidyDetail,
      ...inlineConfirmations,
    },
  };
  const stageValidation = canCompleteStage(effectiveProjectForValidation as any, project.currentStage);
  const canSubmitAdvance = stageValidation.allowed;

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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Strict Sequential Stage Completion Button */}
          {!project.deleted && project.currentStage !== "COMPLETED" && (
            <button
              onClick={() => {
                setStageComment("");
                setInlineConfirmations({});
                setCompleteStageModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Mark {PROJECT_STAGES_CONFIG.find((s) => normalizeStageId(s.id) === normalizeStageId(project.currentStage))?.shortLabel || project.currentStage} Complete
              </span>
            </button>
          )}

          {/* Change Health Button */}
          {!project.deleted && (
            <button
              onClick={() => {
                setTargetHealth(project.overallStatus);
                setHealthModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
            >
              Update Health
            </button>
          )}

          {/* Super Admin Stage Override (Discreet, Super Admin only) */}
          {(currentUser?.role === "SUPER_ADMIN" || currentUser?.email === "vertxenergies@gmail.com") && !project.deleted && (
            <button
              onClick={() => {
                setOverrideTargetStage(project.currentStage);
                setOverrideReason("");
                setOverrideConfirmed(false);
                setOverrideModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
              title="Super Admin Emergency Stage Override"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Override Stage</span>
            </button>
          )}

          {/* Restore Project Button (for deleted projects) */}
          {canDelete && project.deleted && (
            <button
              onClick={handleRestoreProject}
              disabled={restoring}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{restoring ? "Restoring..." : "Restore Project"}</span>
            </button>
          )}

          {/* Delete Project Button (discreet for authorized users) */}
          {canDelete && !project.deleted && (
            <button
              onClick={() => {
                fetchActiveProjectsForDuplicate();
                setDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Project</span>
            </button>
          )}
        </div>
      </div>

      {/* SOFT-DELETED WARNING BANNER */}
      {project.deleted && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>This project was removed from active CRM records (Soft-Deleted)</span>
            </div>
            <p className="text-rose-800">
              Reason: <strong>{PROJECT_DELETION_REASONS_CONFIG.find((r) => r.id === project.deletionReason)?.label || project.deletionReason}</strong>
              {project.duplicateOfProjectId && (
                <span>
                  {" "}• Duplicate of:{" "}
                  <Link href={`/projects/${project.duplicateOfProjectId}`} className="underline font-bold text-blue-700 hover:text-blue-900">
                    {project.duplicateOfProject?.projectNumber || project.duplicateOfProjectId} ({project.duplicateOfProject?.customer?.name || "Original Project"})
                  </Link>
                </span>
              )}
              {project.deletionReasonDetails && <span> • Notes: {project.deletionReasonDetails}</span>}
            </p>
            <p className="text-slate-500 text-[11px]">
              Deleted on {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"} by {project.deletedByName || "Administrator"}
            </p>
          </div>

          {canDelete && (
            <button
              onClick={handleRestoreProject}
              disabled={restoring}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs text-xs whitespace-nowrap self-start sm:self-center inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{restoring ? "Restoring..." : "Restore to Pipeline"}</span>
            </button>
          )}
        </div>
      )}

      {/* STAGE RECONCILIATION WARNING BANNER */}
      {project.stageMigrationStatus === "NEEDS_REVIEW" && !project.deleted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Stage Data Requires Reconciliation</span>
            </div>
            <p className="text-amber-900 text-xs">
              {project.stageMigrationNotes || "This legacy project's historical stage sequence is incomplete or unverified. A Super Admin must review and confirm the historical progress."}
            </p>
          </div>

          {(currentUser?.role === "SUPER_ADMIN" || currentUser?.email === "vertxenergies@gmail.com") ? (
            <button
              onClick={() => {
                setReconcileConfirmedStages(project.completedStages || []);
                setReconcileReason("Verified against existing project records.");
                setReconcileModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-2xs text-xs whitespace-nowrap self-start sm:self-center inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Review & Reconcile</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/60 px-3 py-1.5 rounded-lg whitespace-nowrap self-start sm:self-center">
              Pending Super Admin Review
            </span>
          )}
        </div>
      )}

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
          completedStages={project.completedStages || []}
          onStageSelect={(stage) => {
            if (normalizeStageId(stage) === normalizeStageId(project.currentStage) && project.currentStage !== "COMPLETED") {
              setStageComment("");
              setInlineConfirmations({});
              setCompleteStageModalOpen(true);
            }
          }}
        />
      </div>

      {/* MODULAR PROJECT TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-4 scrollbar-thin">
          {[
            { id: "overview", label: "Overview & Specs", icon: FolderKanban },
            { id: "documents", label: `Documents (${collectedRequiredCount}/${totalRequiredCount})`, icon: FileCheck2 },
            { id: "loan", label: `Loan (${project.loanDetail?.status.replace(/_/g, " ") || "N/A"})`, icon: Landmark },
            { id: "payment", label: `Payment (${project.outstandingAmount === 0 ? "PAID" : `₹${Math.round((project.outstandingAmount || 0) / 1000)}k Out`})`, icon: Wallet },
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
                      {collectedRequiredCount} / {totalRequiredCount} Collected
                    </div>
                    <span
                      className={clsx(
                        "text-[11px] font-semibold block mt-0.5",
                        pendingRequiredCount > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"
                      )}
                    >
                      {pendingRequiredCount > 0 ? `⚠ ${pendingRequiredCount} Pending` : "✓ All Required"}
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

          {/* TAB 2: SIMPLIFIED DOCUMENT COLLECTION STATUS TRACKING */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* TOP SUMMARY & HEADLINE */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Document Collection Status
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {pendingRequiredCount === 0 && totalRequiredCount > 0
                        ? `${collectedRequiredCount} / ${totalRequiredCount} Collected`
                        : `${collectedRequiredCount} / ${totalRequiredCount} Collected · ${pendingRequiredCount} Pending`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {collectedRequiredCount} of {totalRequiredCount} Required Documents Collected
                    </p>
                  </div>

                  <div>
                    {pendingRequiredCount === 0 && totalRequiredCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                        <Check className="w-4 h-4 text-emerald-600" /> All Required Documents Collected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> {pendingRequiredCount} Required Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* COMPACT 5-METRIC SUMMARY CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Required</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">{totalRequiredCount}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Mandatory</div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Collected</div>
                    <div className="text-lg font-black text-emerald-900 mt-0.5">{collectedRequiredCount}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Verified</div>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending</div>
                    <div className="text-lg font-black text-amber-900 mt-0.5">{pendingRequiredCount}</div>
                    <div className="text-[10px] text-amber-700 font-medium">Awaiting</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Not Required</div>
                    <div className="text-lg font-black text-slate-700 mt-0.5">{notRequiredDocsCount}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Exempted</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Optional</div>
                    <div className="text-lg font-black text-slate-700 mt-0.5">{optionalDocsCount}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Additional</div>
                  </div>
                </div>
              </div>

              {/* DOCUMENT CHECKLIST ROWS */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                <div className="bg-slate-50/80 px-4 sm:px-5 py-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Customer Documents ({docs.length})
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Click status to change
                  </span>
                </div>

                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Document Name + Requirement Badge */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{doc.title}</span>

                      {doc.isRequired ? (
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Optional
                        </span>
                      )}
                    </div>

                    {/* Right: Single Status Dropdown Control */}
                    <div className="self-end sm:self-center">
                      <DocumentStatusDropdown
                        currentStatus={doc.status}
                        onSelectStatus={(newStatus) => handleUpdateDocStatus(doc.id, newStatus)}
                      />
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

          {/* TAB: PROJECT PAYMENT MILESTONE TRACKER */}
          {activeTab === "payment" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Configuration Bar */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" /> Project Payment Milestone Tracker
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lightweight operational milestone tracking for customer advances, loan disbursements, and remaining balances.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-600">Payment Mode:</span>
                  {isSuperAdmin || currentUser?.role === "ADMIN" || currentUser?.role === "MANAGEMENT" || permissions.includes("payment.update") ? (
                    <select
                      value={project.paymentMode || "CASH"}
                      onChange={(e) => handleUpdatePaymentMode(e.target.value as PaymentMode)}
                      disabled={updatingPayment}
                      className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-blue-900 cursor-pointer"
                    >
                      <option value="CASH">💵 CASH (Direct Customer Payments)</option>
                      <option value="LOAN">🏦 LOAN (100% Bank Financed)</option>
                      <option value="PARTIAL_LOAN">📑 PARTIAL LOAN (Bank + Customer)</option>
                    </select>
                  ) : (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs">
                      {project.paymentMode || "CASH"}
                    </span>
                  )}
                </div>
              </div>

              {/* 9 KEY QUESTIONS SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* 1. Project Value */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Project Value</span>
                  <div className="font-extrabold text-slate-900 text-base mt-1">
                    ₹{(project.projectAmount || project.estimatedProjectValue || 300000).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Total Contract Amount</span>
                </div>

                {/* 2. Customer Paid */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer Paid</span>
                  <div className="font-extrabold text-emerald-700 text-base mt-1">
                    ₹{(project.customerContribution || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Direct Customer Funds</span>
                </div>

                {/* 3. Loan Disbursed */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Loan Disbursed</span>
                  <div className={clsx("font-extrabold text-base mt-1", (project.loanDisbursedAmount || 0) > 0 ? "text-blue-700" : "text-slate-400")}>
                    ₹{(project.loanDisbursedAmount || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {project.loanStatus === "DISBURSED" ? "✓ Bank Funds Disbursed" : "Bank Disbursals"}
                  </span>
                </div>

                {/* 4. Outstanding Balance */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Outstanding</span>
                  <div className={clsx("font-extrabold text-base mt-1", (project.outstandingAmount || 0) > 0 ? "text-amber-700" : "text-emerald-700")}>
                    ₹{(project.outstandingAmount || 0).toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pending Project Funds</span>
                </div>

                {/* 5. Next Payment Milestone */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Payment Action</span>
                  <div className="font-extrabold text-blue-900 text-sm mt-1 truncate">
                    {project.nextPaymentMilestone || "Fully Paid"}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 block mt-0.5">
                    {project.outstandingAmount === 0 ? "✓ Contract Fully Settled" : "Awaiting Collection"}
                  </span>
                </div>
              </div>

              {/* LOAN SUMMARY CARD (IF LOAN / PARTIAL LOAN) */}
              {(project.paymentMode === "LOAN" || project.paymentMode === "PARTIAL_LOAN") && (
                <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">Bank Finance & Two-Stage Disbursal Summary</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                            {project.loanStatus || "NOT_APPLIED"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {project.loanDetail?.financeProvider || "Bank Finance"} {project.loanDetail?.applicationNumber ? `• App #: ${project.loanDetail.applicationNumber}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5-Metric Disbursal Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sanctioned Loan</span>
                      <div className="font-extrabold text-slate-900 text-sm mt-1">
                        ₹{(project.loanAmount || 0).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Approved by Bank</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">First Disbursal</span>
                      <div className="font-extrabold text-blue-700 text-sm mt-1">
                        ₹{(project.firstLoanDisbursalAmount || 0).toLocaleString("en-IN")}
                      </div>
                      <span className={clsx("text-[10px] font-semibold block mt-0.5", project.firstLoanDisbursalStatus === "COLLECTED" ? "text-emerald-700" : "text-amber-700")}>
                        {project.firstLoanDisbursalStatus === "COLLECTED" ? "✓ Collected" : "Pending"}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Second Disbursal</span>
                      <div className="font-extrabold text-blue-700 text-sm mt-1">
                        ₹{(project.secondLoanDisbursalAmount || 0).toLocaleString("en-IN")}
                      </div>
                      <span className={clsx("text-[10px] font-semibold block mt-0.5", project.secondLoanDisbursalStatus === "COLLECTED" ? "text-emerald-700" : "text-amber-700")}>
                        {project.secondLoanDisbursalStatus === "COLLECTED" ? "✓ Collected" : "Pending"}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Disbursed Total</span>
                      <div className="font-extrabold text-emerald-700 text-sm mt-1">
                        ₹{(project.loanDisbursedAmount || 0).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Released to VERTX</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Remaining to Disburse</span>
                      <div className={clsx("font-extrabold text-sm mt-1", (project.remainingLoanToDisburse || 0) > 0 ? "text-amber-700" : "text-emerald-700")}>
                        ₹{(project.remainingLoanToDisburse || 0).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                        {(project.remainingLoanToDisburse || 0) === 0 ? "✓ 100% Disbursed" : "Bank Balance Due"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MILESTONES TIMELINE TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" /> Milestone Schedule & Collection Status
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    Mode: <strong className="text-slate-800">{project.paymentMode || "CASH"}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-3">Milestone Name</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Amount (₹)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Collected Date</th>
                        <th className="py-3 px-3">Notes</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {project.paymentMilestones?.map((m) => {
                        const isCollected = m.status === "COLLECTED";
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {m.label}
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {m.type}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-extrabold text-slate-800">
                              ₹{(m.amount || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={clsx(
                                  "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-block uppercase",
                                  isCollected
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : m.status === "DUE"
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : m.status === "NOT_APPLICABLE"
                                    ? "bg-slate-100 text-slate-400 border-slate-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                )}
                              >
                                {m.status}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                              {m.collectedDate
                                ? new Date(m.collectedDate).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>

                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                              {m.notes || "—"}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {(isSuperAdmin || currentUser?.role === "ADMIN" || currentUser?.role === "MANAGEMENT" || permissions.includes("payment.update")) && m.status !== "NOT_APPLICABLE" && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMilestoneStatus(m, isCollected ? "PENDING" : "COLLECTED")}
                                    disabled={updatingPayment}
                                    className={clsx(
                                      "px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer disabled:opacity-50",
                                      isCollected
                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                    )}
                                  >
                                    {isCollected ? "Mark Pending" : "✓ Collect"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMilestone(m);
                                      setMilestoneForm({
                                        amount: String(m.amount || 0),
                                        status: m.status,
                                        dueDate: m.dueDate || "",
                                        collectedDate: m.collectedDate || "",
                                        notes: m.notes || "",
                                      });
                                      setMilestoneModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                    title="Edit Milestone"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

      {/* STRICT SEQUENTIAL STAGE ADVANCE MODAL */}
      {completeStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  EPC Stage Advancement
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                  Complete Stage: {currentStageConfig?.label || project.currentStage}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                <span>Stage {stageNumber} of 12</span>
              </div>
            </div>

            {/* Transition Indicator */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Working Stage</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {currentStageConfig?.label || project.currentStage}
                </span>
              </div>

              <div className="text-slate-400 font-bold text-lg">→</div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Next Unlockable Stage</span>
                <span className="font-extrabold text-blue-700 text-sm">
                  {nextStageConfig?.label || "Project Completed"}
                </span>
              </div>
            </div>

            {/* Prerequisites Checklist / Validation */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Completion Prerequisites & Validation
              </span>

              {stageValidation.allowed ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    All mandatory criteria for &quot;{currentStageConfig?.label}&quot; are satisfied.
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Missing Stage Completion Criteria ({stageValidation.missingRequirements.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-900">
                    {stageValidation.missingRequirements.map((req, i) => (
                      <li key={i} className="font-semibold">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contextual Quick Confirmation Toggles for Specific Stages */}
              {normalizeStageId(project.currentStage) === "EQUIPMENT_DELIVERED" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Equipment Delivery Confirmations</span>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.panelsDelivered ?? project.installationDetail?.panelsDelivered ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, panelsDelivered: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Solar Panels Delivered to Site</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.inverterDelivered ?? project.installationDetail?.inverterDelivered ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, inverterDelivered: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Solar Inverter Delivered to Site</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "STRUCTURE_MATERIAL_DELIVERED" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.structureDelivered ?? project.installationDetail?.structureDelivered ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, structureDelivered: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Mounting Structure & Hardware Delivered to Site</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "INSTALLATION" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.installationCompleted ?? project.installationDetail?.installationCompleted ?? (project.installationDetail?.status === "COMPLETED")}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, installationCompleted: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Physical Installation Complete & Ready for Inspection</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "KSEB_DCR_DOCS_SUBMITTED" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.dcrSubmitted ?? project.ksebDetail?.dcrSubmitted ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, dcrSubmitted: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Post-Installation KSEB DCR Documentation Submitted</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "INSPECTION" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.inspectionCompleted ?? project.ksebDetail?.inspectionCompleted ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, inspectionCompleted: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm KSEB Electrical Inspection Completed & Approved</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "NET_METER" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.netMeterInstalled ?? project.ksebDetail?.netMeterInstalled ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, netMeterInstalled: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm Bi-Directional Net Meter Installed & Grid Energized</span>
                  </label>
                </div>
              )}

              {normalizeStageId(project.currentStage) === "SUBSIDY" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={inlineConfirmations.claimed ?? project.subsidyDetail?.claimed ?? false}
                      onChange={(e) => setInlineConfirmations((prev) => ({ ...prev, claimed: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Confirm PM Surya Ghar National Portal Subsidy Claimed / Processed</span>
                  </label>
                </div>
              )}
            </div>

            {/* Audit Log Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Completion Notes / Remarks (Optional)</label>
              <textarea
                rows={2}
                value={stageComment}
                onChange={(e) => setStageComment(e.target.value)}
                placeholder="Add verified handover notes or inspection references..."
                className="w-full text-xs p-2.5 border rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteStageModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStageAdvance}
                disabled={!canSubmitAdvance || advancingStage}
                className={clsx(
                  "px-5 py-2 rounded-xl text-white font-bold shadow-sm transition inline-flex items-center gap-1.5",
                  canSubmitAdvance && !advancingStage
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                )}
              >
                <Check className="w-4 h-4" />
                <span>
                  {advancingStage ? "Advancing..." : `Mark ${currentStageConfig?.shortLabel || project.currentStage} Complete & Advance`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EMERGENCY STAGE OVERRIDE MODAL */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden p-6 space-y-4 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-base border-b border-amber-100 pb-3">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Super Admin Stage Override</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">⚠️ Warning: Emergency Bypass</p>
              <p className="text-[11px] text-amber-800">
                This action bypasses standard sequential gating and creates an immutable <strong>SUPER_ADMIN_STAGE_OVERRIDE</strong> audit entry.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Target Project Stage *</label>
              <select
                value={overrideTargetStage}
                onChange={(e) => setOverrideTargetStage(e.target.value as ProjectStage)}
                className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white font-semibold"
              >
                {PROJECT_STAGES_CONFIG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stepNumber}. {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Override Reason * (Minimum 5 characters)
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Stage was mistakenly marked by field crew; reverting to KSEB Feasibility for re-verification."
                className="w-full text-xs p-2.5 border rounded-xl"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {overrideReason.trim().length}/5 characters minimum
              </span>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideConfirmed}
                onChange={(e) => setOverrideConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-amber-600"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                I understand this is a manual override and acknowledge this action will be permanently logged.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStageOverride}
                disabled={overrideReason.trim().length < 5 || !overrideConfirmed || overriding}
                className={clsx(
                  "px-5 py-2 rounded-xl text-white font-bold shadow-sm transition",
                  overrideReason.trim().length >= 5 && overrideConfirmed && !overriding
                    ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                )}
              >
                {overriding ? "Overriding..." : "Confirm Manual Override"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN STAGE HISTORY RECONCILIATION MODAL */}
      {reconcileModalOpen && (
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
              <p className="font-bold">Reconcile Project #{project.projectNumber} ({project.customer?.name})</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Explicitly check all stages that have been physically or operationally completed. Completed stages must form a continuous sequence from Booking.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Canonical 12-Stage Sequence
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 scrollbar-thin">
                {PROJECT_STAGES_CONFIG.map((st, idx) => {
                  const isChecked = reconcileConfirmedStages.includes(st.id);

                  const handleToggleStage = (checked: boolean) => {
                    if (checked) {
                      // Check all stages up to idx to enforce contiguity
                      const updated = PROJECT_STAGES_CONFIG.slice(0, idx + 1).map((s) => s.id);
                      setReconcileConfirmedStages(updated);
                    } else {
                      // Uncheck this and all following stages
                      const updated = PROJECT_STAGES_CONFIG.slice(0, idx).map((s) => s.id);
                      setReconcileConfirmedStages(updated);
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
                value={reconcileReason}
                onChange={(e) => setReconcileReason(e.target.value)}
                placeholder="e.g. Verified against physical customer file, KSEB Soura feasibility receipt, and inspection pass certificate."
                className="w-full text-xs p-2.5 border rounded-xl"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {reconcileReason.trim().length}/5 characters minimum
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReconcileModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStageReconciliation}
                disabled={reconcileReason.trim().length < 5 || reconciling}
                className={clsx(
                  "px-5 py-2 rounded-xl text-white font-bold shadow-sm transition inline-flex items-center gap-1.5",
                  reconcileReason.trim().length >= 5 && !reconciling
                    ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                )}
              >
                <Check className="w-4 h-4" />
                <span>
                  {reconciling ? "Reconciling..." : "Confirm Historical Progress"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH UPDATE MODAL */}
      {healthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* EDIT MILESTONE MODAL */}
      {milestoneModalOpen && editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" /> Edit {editingMilestone.label}
              </h3>
              <button
                onClick={() => setMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMilestoneDetails} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={milestoneForm.amount}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                <select
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value as PaymentMilestoneStatus })}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="DUE">DUE</option>
                  <option value="COLLECTED">COLLECTED</option>
                  <option value="PARTIALLY_COLLECTED">PARTIALLY COLLECTED</option>
                  <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <textarea
                  rows={2}
                  value={milestoneForm.notes}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                  placeholder="e.g. Bank transfer ref #TXN-98471"
                  className="w-full text-xs p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setMilestoneModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Delete Project?
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Target Project Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Project:</span>
                <span className="font-mono font-bold text-slate-900">{project.projectNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">{project.customer?.name || "Customer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Capacity / Stage:</span>
                <span className="font-semibold text-slate-700">{project.systemSizeKw} kW • {project.currentStage}</span>
              </div>
            </div>

            {/* Warning Notices */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
              <strong>Warning:</strong> This action will remove this project from active project records and pipeline views.
            </div>

            {((project.paymentMilestones && project.paymentMilestones.length > 0) || (project.estimatedProjectValue && project.estimatedProjectValue > 0)) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <strong>Financial Safety Notice:</strong> This project contains financial records. Deleting the project will only remove it from the CRM active project workflow. Financial/accounting records will remain unchanged.
              </div>
            )}

            {/* Deletion Reason Dropdown */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Deletion Reason *</label>
              <select
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value as ProjectDeletionReason)}
                className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                {PROJECT_DELETION_REASONS_CONFIG.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* If Duplicate Entry: Duplicate Project Selector */}
            {deletionReason === "DUPLICATE_ENTRY" && (
              <div className="space-y-1.5 p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                <label className="block font-bold text-blue-900 text-xs">
                  Duplicate of (Original Project) *
                </label>
                {otherProjectsList.length > 0 ? (
                  <select
                    value={duplicateOfProjectId}
                    onChange={(e) => setDuplicateOfProjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">-- Select Original Project --</option>
                    {otherProjectsList.map((op: Project) => (
                      <option key={op.id} value={op.id}>
                        {op.projectNumber} — {op.customer?.name} ({op.systemSizeKw} kW, {op.currentStage})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter original project ID (e.g. SOL-2026-00471)"
                    value={duplicateOfProjectId}
                    onChange={(e) => setDuplicateOfProjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                )}
                <p className="text-[10px] text-blue-700">
                  Select or enter the original project ID to preserve traceability in audit logs.
                </p>
              </div>
            )}

            {/* Additional Reason / Notes Textarea */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {deletionReason === "OTHER" ? "Additional Reason * (Required)" : "Additional Notes (Optional)"}
              </label>
              <textarea
                rows={2}
                value={deletionDetails}
                onChange={(e) => setDeletionDetails(e.target.value)}
                placeholder={deletionReason === "OTHER" ? "Please provide a detailed explanation..." : "Optional context for audit log..."}
                className="w-full text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="pt-2 border-t">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  I confirm this deletion and understand this project will be removed from active CRM records.
                </span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !deleteConfirmed ||
                  deleting ||
                  (deletionReason === "DUPLICATE_ENTRY" && !duplicateOfProjectId) ||
                  (deletionReason === "OTHER" && (!deletionDetails || deletionDetails.trim().length < 5))
                }
                onClick={handleDeleteProject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? "Deleting..." : "Delete Project"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
