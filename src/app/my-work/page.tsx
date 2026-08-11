"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Filter,
  CheckSquare,
  PhoneCall,
  Zap,
  ArrowRight,
  User,
  RotateCcw,
  Search,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Project, Task, FollowUp } from "@/types";
import { clsx } from "clsx";

interface WorkItem {
  id: string;
  type: "DUTY" | "TASK" | "FOLLOWUP" | "PROJECT_NEXT_ACTION";
  title: string;
  subtitle?: string;
  projectId?: string | null;
  projectNumber?: string | null;
  customerName?: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  category: "OVERDUE" | "TODAY" | "UPCOMING" | "COMPLETED";
}

export default function MyWorkPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "TODAY" | "UPCOMING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkItems = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, followupsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/followups"),
      ]);

      const [projData, tasksData, followupsData] = await Promise.all([
        projRes.json(),
        tasksRes.json(),
        followupsRes.json(),
      ]);

      const items: WorkItem[] = [];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

      const getCategory = (dueDateStr?: string | null, statusStr?: string): "OVERDUE" | "TODAY" | "UPCOMING" | "COMPLETED" => {
        if (statusStr === "COMPLETED" || statusStr === "CANCELLED") return "COMPLETED";
        if (!dueDateStr) return "UPCOMING";

        const dueTime = new Date(dueDateStr).getTime();
        if (dueTime < todayStart) return "OVERDUE";
        if (dueTime >= todayStart && dueTime <= todayEnd) return "TODAY";
        return "UPCOMING";
      };

      // 1. Projects where currentUser is responsible for Next Action
      if (projData.success && Array.isArray(projData.data)) {
        projData.data.forEach((p: Project) => {
          if (
            p.nextActionTitle &&
            p.nextActionStatus !== "COMPLETED" &&
            (p.nextActionOwnerId === currentUser?.id ||
              p.salespersonId === currentUser?.id ||
              p.projectManagerId === currentUser?.id ||
              currentUser?.role === "ADMIN" ||
              currentUser?.role === "MANAGEMENT")
          ) {
            const cat = getCategory(p.nextActionDueDate, p.nextActionStatus);
            items.push({
              id: `pna-${p.id}`,
              type: "PROJECT_NEXT_ACTION",
              title: p.nextActionTitle,
              subtitle: `Project #${p.projectNumber} • Stage: ${p.currentStage?.replace(/_/g, " ")}`,
              projectId: p.id,
              projectNumber: p.projectNumber,
              customerName: p.customer?.name,
              dueDate: p.nextActionDueDate || p.startDate,
              priority: p.priority,
              status: p.nextActionStatus,
              category: cat,
            });
          }
        });
      }

      // 2. Tasks assigned to current user
      if (tasksData.success && Array.isArray(tasksData.data)) {
        tasksData.data.forEach((t: Task) => {
          if (
            t.assignedUserId === currentUser?.id ||
            !t.assignedUserId ||
            currentUser?.role === "ADMIN" ||
            currentUser?.role === "MANAGEMENT"
          ) {
            const cat = getCategory(t.dueDate, t.status);
            items.push({
              id: `task-${t.id}`,
              type: "TASK",
              title: t.title,
              subtitle: t.project?.projectNumber
                ? `Project #${t.project.projectNumber}`
                : t.lead?.customerName
                ? `Lead: ${t.lead.customerName}`
                : "Operational Task",
              projectId: t.projectId,
              projectNumber: t.project?.projectNumber,
              customerName: t.customer?.name || t.lead?.customerName,
              dueDate: t.dueDate,
              priority: t.priority,
              status: t.status,
              category: cat,
            });
          }
        });
      }

      // 3. Follow-ups assigned to current user
      if (followupsData.success && Array.isArray(followupsData.data)) {
        followupsData.data.forEach((f: FollowUp) => {
          if (
            f.assignedUserId === currentUser?.id ||
            !f.assignedUserId ||
            currentUser?.role === "ADMIN" ||
            currentUser?.role === "MANAGEMENT"
          ) {
            const cat = getCategory(f.dueDate, f.status);
            items.push({
              id: `fu-${f.id}`,
              type: "FOLLOWUP",
              title: `${f.actionType?.replace(/_/g, " ")}: ${f.customer?.name || f.lead?.customerName || "Customer Follow-up"}`,
              subtitle: f.notes || "Scheduled sales follow-up",
              projectId: f.projectId,
              projectNumber: f.project?.projectNumber,
              customerName: f.customer?.name || f.lead?.customerName,
              dueDate: f.dueDate,
              priority: "HIGH",
              status: f.status,
              category: cat,
            });
          }
        });
      }

      setWorkItems(items);
    } catch (err) {
      console.error("Failed to load work items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkItems();
  }, [currentUser]);

  const overdueCount = workItems.filter((i) => i.category === "OVERDUE").length;
  const todayCount = workItems.filter((i) => i.category === "TODAY").length;
  const upcomingCount = workItems.filter((i) => i.category === "UPCOMING").length;
  const completedCount = workItems.filter((i) => i.category === "COMPLETED").length;
  const activeTotal = workItems.filter((i) => i.category !== "COMPLETED").length;

  const filteredItems = workItems.filter((item) => {
    const matchesTab = activeTab === "ALL" ? item.category !== "COMPLETED" : item.category === activeTab;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.projectNumber && item.projectNumber.toLowerCase().includes(q)) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-16">
      {/* Mobile-Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                My Work Action Center
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Personalized task queue for <strong className="text-slate-700">{currentUser?.name || "Staff Member"}</strong> ({currentUser?.role?.replace(/_/g, " ") || "Employee"})
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchWorkItems}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 self-stretch sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh Items
        </button>
      </div>

      {/* Metric Cards Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Overdue */}
        <div
          onClick={() => setActiveTab(activeTab === "OVERDUE" ? "ALL" : "OVERDUE")}
          className={clsx(
            "p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between shadow-2xs select-none",
            activeTab === "OVERDUE"
              ? "bg-rose-100 border-rose-400 ring-2 ring-rose-400"
              : "bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/70"
          )}
        >
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" /> Overdue
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-950 mt-0.5">{overdueCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-200/60 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Today */}
        <div
          onClick={() => setActiveTab(activeTab === "TODAY" ? "ALL" : "TODAY")}
          className={clsx(
            "p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between shadow-2xs select-none",
            activeTab === "TODAY"
              ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400"
              : "bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/70"
          )}
        >
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Due Today
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-950 mt-0.5">{todayCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-200/60 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveTab(activeTab === "UPCOMING" ? "ALL" : "UPCOMING")}
          className={clsx(
            "p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between shadow-2xs select-none",
            activeTab === "UPCOMING"
              ? "bg-blue-100 border-blue-400 ring-2 ring-blue-400"
              : "bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/70"
          )}
        >
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Upcoming
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-950 mt-0.5">{upcomingCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-200/60 text-blue-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab(activeTab === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={clsx(
            "p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between shadow-2xs select-none",
            activeTab === "COMPLETED"
              ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400"
              : "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/70"
          )}
        >
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 mt-0.5">{completedCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Search and Tabs Container */}
      <div className="space-y-3">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action items by title, customer name, project #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Horizontally Scrollable Tabs for Mobile */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1 flex items-center gap-1.5 sm:gap-2">
          {[
            { id: "ALL", label: `Active Work`, count: activeTotal },
            { id: "OVERDUE", label: "Overdue", count: overdueCount },
            { id: "TODAY", label: "Today", count: todayCount },
            { id: "UPCOMING", label: "Upcoming", count: upcomingCount },
            { id: "COMPLETED", label: "Completed", count: completedCount },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Work Items List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500 animate-pulse">
            Loading your work items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">All clear!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No responsibilities found matching this filter. You can select another tab or search query.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isOverdue = item.category === "OVERDUE";
              const isToday = item.category === "TODAY";

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left content block */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={clsx(
                          "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0",
                          item.type === "PROJECT_NEXT_ACTION"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.type === "TASK"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {item.type === "PROJECT_NEXT_ACTION"
                          ? "Project Action"
                          : item.type === "TASK"
                          ? "Task"
                          : "Follow-up"}
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md shrink-0 animate-pulse">
                          OVERDUE
                        </span>
                      )}

                      {isToday && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
                          TODAY
                        </span>
                      )}

                      <span
                        className={clsx(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                          item.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700"
                            : item.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {item.priority} Priority
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                      {item.title}
                    </h3>

                    {/* Subtitle and Metadata */}
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      {item.customerName && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.customerName}
                        </span>
                      )}

                      {item.projectNumber && (
                        <span className="font-mono text-slate-500">#{item.projectNumber}</span>
                      )}

                      {item.dueDate && (
                        <span
                          className={clsx(
                            "flex items-center gap-1 font-medium",
                            isOverdue
                              ? "text-rose-600 font-bold"
                              : isToday
                              ? "text-amber-700 font-bold"
                              : "text-slate-500"
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          Due:{" "}
                          {new Date(item.dueDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}

                      {item.subtitle && (
                        <span className="text-slate-400 italic break-words">{item.subtitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Action Button (Full width on small phones, compact on tablet/desktop) */}
                  <div className="shrink-0 pt-1 sm:pt-0">
                    {item.projectId ? (
                      <Link
                        href={`/projects/${item.projectId}`}
                        className="w-full sm:w-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>Open Project</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : item.type === "FOLLOWUP" ? (
                      <Link
                        href="/followups"
                        className="w-full sm:w-auto px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>View Follow-up</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/tasks"
                        className="w-full sm:w-auto px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>View Task</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
