"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FolderKanban,
  Search,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  Calendar,
  Zap,
  ArrowRight,
  X,
  RotateCcw,
  SlidersHorizontal,
  Landmark,
  Wallet,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Project, ProjectStage, ProjectHealth } from "@/types";
import { HealthBadge, ProjectStageBadge } from "@/components/ui/badges";
import { PROJECT_STAGES_CONFIG, KERALA_DISTRICTS, PROJECT_HEALTH_CONFIG, canUserDeleteProject, PROJECT_DELETION_REASONS_CONFIG } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, getIdToken } = useAuth();
  const canDelete = canUserDeleteProject(currentUser);

  // Read current filters directly from URL Search Parameters (Single Source of Truth)
  const onlyDeleted = searchParams.get("onlyDeleted") === "true";
  const currentStage = searchParams.get("stage") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentDistrict = searchParams.get("district") || "ALL";
  const currentSearch = searchParams.get("search") || "";

  // Local state for search input text to allow instant typing feedback
  const [searchInput, setSearchInput] = useState(currentSearch);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Projects data and counts from unified API query
  const [projects, setProjects] = useState<Project[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [healthCounts, setHealthCounts] = useState<Record<string, number>>({});
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Keep searchInput in sync if URL search param changes via back/forward navigation
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Helper to construct updated query URL
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  // Fetch projects and dynamic counts from the API whenever URL searchParams change
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/projects${queryString ? `?${queryString}` : ""}`, { headers });
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
        setStageCounts(json.stageCounts || {});
        setHealthCounts(json.healthCounts || {});
        setDeletedCount(json.deletedCount || 0);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch solar projects:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, getIdToken]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRestoreProject = async (id: string, projectNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Restore project ${projectNumber} to the active project pipeline?`)) return;

    try {
      setRestoringId(id);
      const res = await fetch(`/api/projects/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _userId: currentUser?.uid || currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
      } else {
        alert(data.error || "Failed to restore project");
      }
    } catch (err: any) {
      alert(err.message || "Failed to restore project");
    } finally {
      setRestoringId(null);
    }
  };

  // Handler: Toggle / Select Stage Tab
  const handleSelectStage = (stageId: string) => {
    const nextStage = stageId === currentStage || stageId === "ALL" ? null : stageId;
    const qs = createQueryString({ stage: nextStage });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Handler: Toggle / Select Health Status Metric Card
  const handleSelectStatus = (statusId: string) => {
    const nextStatus = statusId === currentStatus || statusId === "ALL" ? null : statusId;
    const qs = createQueryString({ status: nextStatus });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Handler: Select District
  const handleSelectDistrict = (district: string) => {
    const qs = createQueryString({ district: district === "ALL" ? null : district });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Handler: Debounced Search Input
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    searchDebounceTimer.current = setTimeout(() => {
      const qs = createQueryString({ search: value.trim() ? value.trim() : null });
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
  };

  // Handler: Reset / Clear All Filters
  const handleClearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  // Check if any filter is currently active
  const hasActiveFilters =
    currentStage !== "ALL" ||
    currentStatus !== "ALL" ||
    currentDistrict !== "ALL" ||
    Boolean(currentSearch.trim());

  // Generate dynamic, context-aware empty state text
  const getEmptyStateDescription = () => {
    const stageConfig = PROJECT_STAGES_CONFIG.find((s) => s.id === currentStage);
    const stageLabel = stageConfig ? stageConfig.shortLabel : "";

    const statusLabel =
      currentStatus === "ON_TRACK"
        ? "On Track"
        : currentStatus === "AT_RISK"
        ? "At Risk"
        : currentStatus === "DELAYED"
        ? "Delayed"
        : currentStatus === "COMPLETED"
        ? "Completed"
        : "";

    if (currentStatus !== "ALL" && currentStage !== "ALL" && currentDistrict !== "ALL") {
      return `No ${statusLabel.toLowerCase()} ${stageLabel} projects found in ${currentDistrict}.`;
    }
    if (currentStatus !== "ALL" && currentStage !== "ALL") {
      return `No ${statusLabel.toLowerCase()} ${stageLabel} projects found.`;
    }
    if (currentStatus !== "ALL" && currentDistrict !== "ALL") {
      return `No ${statusLabel.toLowerCase()} projects found in ${currentDistrict}.`;
    }
    if (currentStage !== "ALL" && currentDistrict !== "ALL") {
      return `No ${stageLabel} projects found in ${currentDistrict}.`;
    }
    if (currentStatus !== "ALL") {
      return `No ${statusLabel.toLowerCase()} projects found.`;
    }
    if (currentStage !== "ALL") {
      return `No ${stageLabel} projects found.`;
    }
    if (currentDistrict !== "ALL") {
      return `No solar projects found in ${currentDistrict}.`;
    }
    if (currentSearch) {
      return `No solar projects matching "${currentSearch}".`;
    }
    return "No projects match your current filters.";
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Solar Projects Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage progression, KSEB Soura workflow, and next action accountability across Kerala.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}

          <Link
            href="/leads"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Book From Lead
          </Link>
        </div>
      </div>

      {/* Health Overview Metric Cards (Interactive Health Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* On Track */}
        <div
          onClick={() => handleSelectStatus("ON_TRACK")}
          className={clsx(
            "p-4 rounded-xl border cursor-pointer transition flex items-center justify-between shadow-2xs group",
            currentStatus === "ON_TRACK"
              ? "bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-400"
              : "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">On Track</span>
            <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">
              {healthCounts["ON_TRACK"] ?? 0}
            </div>
          </div>
          <CheckCircle2
            className={clsx(
              "w-6 h-6 transition-transform group-hover:scale-110",
              currentStatus === "ON_TRACK" ? "text-emerald-700" : "text-emerald-600"
            )}
          />
        </div>

        {/* At Risk */}
        <div
          onClick={() => handleSelectStatus("AT_RISK")}
          className={clsx(
            "p-4 rounded-xl border cursor-pointer transition flex items-center justify-between shadow-2xs group",
            currentStatus === "AT_RISK"
              ? "bg-amber-100/80 border-amber-400 ring-2 ring-amber-400"
              : "bg-amber-50/50 border-amber-200 hover:bg-amber-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">At Risk</span>
            <div className="text-2xl font-extrabold text-amber-950 mt-0.5">
              {healthCounts["AT_RISK"] ?? 0}
            </div>
          </div>
          <AlertTriangle
            className={clsx(
              "w-6 h-6 transition-transform group-hover:scale-110",
              currentStatus === "AT_RISK" ? "text-amber-700" : "text-amber-600"
            )}
          />
        </div>

        {/* Delayed */}
        <div
          onClick={() => handleSelectStatus("DELAYED")}
          className={clsx(
            "p-4 rounded-xl border cursor-pointer transition flex items-center justify-between shadow-2xs group",
            currentStatus === "DELAYED"
              ? "bg-rose-100/80 border-rose-400 ring-2 ring-rose-400"
              : "bg-rose-50/50 border-rose-200 hover:bg-rose-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Delayed</span>
            <div className="text-2xl font-extrabold text-rose-950 mt-0.5">
              {healthCounts["DELAYED"] ?? 0}
            </div>
          </div>
          <Clock
            className={clsx(
              "w-6 h-6 transition-transform group-hover:scale-110",
              currentStatus === "DELAYED" ? "text-rose-700" : "text-rose-600"
            )}
          />
        </div>

        {/* Completed */}
        <div
          onClick={() => handleSelectStatus("COMPLETED")}
          className={clsx(
            "p-4 rounded-xl border cursor-pointer transition flex items-center justify-between shadow-2xs group",
            currentStatus === "COMPLETED"
              ? "bg-teal-100/80 border-teal-400 ring-2 ring-teal-400"
              : "bg-teal-50/50 border-teal-200 hover:bg-teal-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Completed</span>
            <div className="text-2xl font-extrabold text-teal-950 mt-0.5">
              {healthCounts["COMPLETED"] ?? 0}
            </div>
          </div>
          <Zap
            className={clsx(
              "w-6 h-6 transition-transform group-hover:scale-110",
              currentStatus === "COMPLETED" ? "text-teal-700" : "text-teal-600"
            )}
          />
        </div>
      </div>

      {/* Stage Filter Tabs Carousel (Dynamic Counts driven by API) */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          {/* All Stages Tab */}
          <button
            onClick={() => handleSelectStage("ALL")}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2",
              currentStage === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            <span>All Stages</span>
            <span
              className={clsx(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                currentStage === "ALL" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700"
              )}
            >
              {stageCounts["ALL"] ?? 0}
            </span>
          </button>

          {/* 10 Operational Stages */}
          {PROJECT_STAGES_CONFIG.map((s) => {
            const isSelected = currentStage === s.id;
            const count = stageCounts[s.id] ?? 0;

            return (
              <button
                key={s.id}
                onClick={() => handleSelectStage(s.id)}
                className={clsx(
                  "px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2",
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                <span>{s.shortLabel}</span>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold transition",
                    isSelected
                      ? "bg-blue-800 text-white"
                      : count > 0
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & District Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer name, phone, project #, KSEB consumer #, loan app #..."
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={currentDistrict}
            onChange={(e) => handleSelectDistrict(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Kerala Districts</option>
            {KERALA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Active Filters:
          </span>

          {currentStatus !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs">
              Status: <strong className="text-blue-700">{currentStatus}</strong>
              <button
                onClick={() => handleSelectStatus("ALL")}
                className="hover:text-rose-600 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentStage !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs">
              Stage:{" "}
              <strong className="text-blue-700">
                {PROJECT_STAGES_CONFIG.find((s) => s.id === currentStage)?.shortLabel || currentStage}
              </strong>
              <button
                onClick={() => handleSelectStage("ALL")}
                className="hover:text-rose-600 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentDistrict !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs">
              District: <strong className="text-rose-600">{currentDistrict}</strong>
              <button
                onClick={() => handleSelectDistrict("ALL")}
                className="hover:text-rose-600 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 shadow-2xs">
              Search: <strong className="text-slate-900">&quot;{currentSearch}&quot;</strong>
              <button
                onClick={() => handleSearchChange("")}
                className="hover:text-rose-600 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Projects Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              {onlyDeleted ? (
                <>
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Deleted Projects Archive</span>
                </>
              ) : (
                <>
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                  <span>Solar Projects Pipeline</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {getEmptyStateDescription()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Total: {total} {total === 1 ? "Project" : "Projects"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium animate-pulse space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {onlyDeleted ? "No deleted projects found." : "No solar projects found."}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try clearing some filters or search query to find more records."
                  : onlyDeleted
                  ? "Deleted projects will appear here with complete audit trail and restore capability."
                  : "Convert won leads to projects from the Leads pipeline to start tracking."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {hasActiveFilters ? (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Filters & View All
                </button>
              ) : (
                <Link
                  href="/leads"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Book Project From Leads
                </Link>
              )}
            </div>
          </div>
        ) : onlyDeleted ? (
          /* DELETED PROJECTS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Project & Customer</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Deletion Reason</th>
                  <th className="py-3.5 px-4">Duplicate Of</th>
                  <th className="py-3.5 px-4">Deleted By</th>
                  <th className="py-3.5 px-4">Deleted Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="hover:bg-rose-50/40 cursor-pointer transition group"
                  >
                    {/* Customer & Project ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-rose-600 transition flex items-center gap-1.5">
                        {p.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-slate-700">{p.projectNumber}</span>
                        <span>• {p.customer?.district}</span>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{p.systemSizeKw} kW</span>
                      </div>
                    </td>

                    {/* Deletion Reason */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {PROJECT_DELETION_REASONS_CONFIG.find((r) => r.id === p.deletionReason)?.label || p.deletionReason || "Deleted"}
                      </span>
                      {p.deletionReasonDetails && (
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate">
                          {p.deletionReasonDetails}
                        </p>
                      )}
                    </td>

                    {/* Duplicate Of */}
                    <td className="py-3.5 px-4">
                      {p.duplicateOfProjectId ? (
                        <Link
                          href={`/projects/${p.duplicateOfProjectId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          <span>{p.duplicateOfProject?.projectNumber || p.duplicateOfProjectId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Deleted By */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {p.deletedByName || "Administrator"}
                    </td>

                    {/* Deleted Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canDelete && (
                          <button
                            type="button"
                            disabled={restoringId === p.id}
                            onClick={(e) => handleRestoreProject(p.id, p.projectNumber, e)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{restoringId === p.id ? "Restoring..." : "Restore"}</span>
                          </button>
                        )}
                        <span className="text-slate-400 group-hover:text-blue-600 transition font-semibold text-xs inline-flex items-center gap-0.5">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ACTIVE PROJECTS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Project & Customer</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Next Action & Responsibility</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projects.map((p) => {
                  const isOverdue =
                    p.nextActionDueDate &&
                    new Date(p.nextActionDueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                    p.nextActionStatus !== "COMPLETED";

                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                      {/* Customer & Project ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                          {p.customer?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-slate-700">{p.projectNumber}</span>
                          <span>• {p.customer?.district}</span>
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>{p.systemSizeKw} kW</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal capitalize">
                          {p.projectType.toLowerCase()}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td className="py-3.5 px-4">
                        <ProjectStageBadge stage={p.currentStage} />
                      </td>

                      {/* Health Badge */}
                      <td className="py-3.5 px-4">
                        <HealthBadge health={p.overallStatus} />
                      </td>

                      {/* Payment Status Indicator */}
                      <td className="py-3.5 px-4">
                        {p.outstandingAmount === 0 || p.nextPaymentMilestone === "Fully Paid" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Paid
                          </span>
                        ) : (p.paymentMode === "LOAN" || p.paymentMode === "PARTIAL_LOAN") && (p.loanDisbursedAmount || 0) > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              <Landmark className="w-3 h-3 text-blue-600" /> ₹{(p.loanDisbursedAmount || 0).toLocaleString("en-IN")} Disbursed
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                              Next: {p.nextPaymentMilestone || "Pending"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              ₹{(p.outstandingAmount || 0).toLocaleString("en-IN")} Outstanding
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                              Next: {p.nextPaymentMilestone || "Pending"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Next Action */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {p.nextActionTitle || "No next action assigned"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            Owner:{" "}
                            <strong className="text-slate-700">
                              {p.nextActionOwner?.name || "Team"}
                            </strong>
                          </span>
                          {p.nextActionDueDate && (
                            <span
                              className={clsx(
                                "font-semibold",
                                isOverdue ? "text-rose-600" : "text-slate-600"
                              )}
                            >
                              • Due:{" "}
                              {new Date(p.nextActionDueDate).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div>
                          Started:{" "}
                          {new Date(p.startDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {p.expectedCompletionDate && (
                          <div className="text-slate-400">
                            Target:{" "}
                            {new Date(p.expectedCompletionDate).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700">
                          Inspect{" "}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
