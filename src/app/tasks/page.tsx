"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  User,
  X,
} from "lucide-react";
import { Task, Priority, TaskStatus } from "@/types";
import { PriorityBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

export default function TasksPage() {
  const { allUsers, currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedUserId: "usr-super-admin",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "HIGH" as Priority,
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });
      setCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        assignedUserId: "usr-super-admin",
        dueDate: new Date().toISOString().slice(0, 10),
        priority: "HIGH",
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    const matchesAssignee = selectedAssignee === "ALL" || t.assignedUserId === selectedAssignee;
    return matchesStatus && matchesAssignee;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Project Tasks & Actions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual operational action items assigned across sales, surveying, KSEB, and installation teams.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Filter</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
          >
            <option value="ALL">All Task Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Employee</label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
          >
            <option value="ALL">All Team Members</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No Tasks Found"
            description="All tasks are completed or none match your selected filters."
            actionLabel="Create Task"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === "COMPLETED";
            const isOverdue =
              !isDone && new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={t.id}
                onClick={() => handleToggleStatus(t)}
                className={clsx(
                  "p-4 rounded-xl border bg-white shadow-2xs transition cursor-pointer flex items-start justify-between gap-4",
                  isDone
                    ? "bg-slate-50/70 border-slate-200 opacity-75"
                    : isOverdue
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-slate-200 hover:border-blue-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition",
                      isDone
                        ? "bg-emerald-600 text-white"
                        : "border-2 border-slate-300 hover:border-blue-500 bg-white"
                    )}
                  >
                    {isDone && "✓"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={clsx(
                          "font-bold text-sm",
                          isDone ? "line-through text-slate-400" : "text-slate-900"
                        )}
                      >
                        {t.title}
                      </h4>
                      <PriorityBadge priority={t.priority} />
                    </div>

                    {t.description && <p className="text-xs text-slate-600 mt-1">{t.description}</p>}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>Assigned to: <strong className="text-slate-700">{t.assignedUser?.name || "Team"}</strong></span>
                      <span>•</span>
                      <span>
                        Due:{" "}
                        <strong className={clsx(isOverdue ? "text-rose-600 font-bold" : "text-slate-700")}>
                          {new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </strong>
                      </span>
                      {t.project && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/projects/${t.project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FolderKanban className="w-3 h-3" /> Project #{t.project.projectNumber}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded border shrink-0",
                    isDone
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {t.status}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Operational Task"
        icon={<CheckSquare className="w-5 h-5 text-blue-600" />}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-task-form"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              Save Task
            </button>
          </>
        }
      >
        <form id="create-task-form" onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Affix solar warning label on ACDB box"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Employee *</label>
            <select
              value={formData.assignedUserId}
              onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
              className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional context or requirements..."
              className="w-full text-xs p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
