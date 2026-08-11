"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Calendar, CheckCircle2, Clock, AlertTriangle, UserCheck, Edit3, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

interface NextActionCardProps {
  projectId: string;
  actionTitle?: string | null;
  owner?: User | null;
  dueDate?: string | null;
  status?: string;
  onActionUpdated?: () => void;
}

export function NextActionCard({
  projectId,
  actionTitle,
  owner,
  dueDate,
  status = "PENDING",
  onActionUpdated,
}: NextActionCardProps) {
  const { allUsers, currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(actionTitle || "");
  const [ownerId, setOwnerId] = useState(owner?.id || currentUser?.id || "usr-super-admin");
  const [date, setDate] = useState(
    dueDate ? new Date(dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const isOverdue =
    dueDate && new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && status !== "COMPLETED";

  const handleSave = async (newStatus = "PENDING") => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/next-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ownerId,
          dueDate: new Date(date).toISOString(),
          status: newStatus,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error("Failed to update next action", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!actionTitle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/next-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Completed: ${actionTitle}`,
          ownerId: owner?.id || currentUser?.id || "usr-super-admin",
          dueDate: new Date().toISOString(),
          status: "COMPLETED",
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(true); // Prompt for next action
        setTitle("");
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 shadow-sm transition-all relative overflow-hidden",
        isOverdue
          ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-400"
          : status === "COMPLETED"
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-blue-200"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm",
              isOverdue ? "bg-rose-600 animate-pulse" : "bg-blue-600"
            )}
          >
            <ArrowRight className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Current Next Action
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white animate-bounce">
                  <AlertTriangle className="w-3 h-3" /> OVERDUE
                </span>
              )}
              {status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="w-3 h-3" /> RESOLVED
                </span>
              )}
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            {status !== "COMPLETED" && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
              </button>
            )}
            <button
              onClick={() => {
                setTitle(actionTitle || "");
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> {actionTitle ? "Edit Action" : "Set Action"}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Action Description *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Submit KSEB agreement stamp paper to section engineer"
              className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Responsible Person *
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full text-sm px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave("PENDING")}
              disabled={loading || !title.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {loading ? "Saving..." : "Save Next Action"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {actionTitle || (
                <span className="text-amber-700 font-normal italic">
                  No next action set! Please assign a next action to prevent project stalling.
                </span>
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-white/80 px-3 py-2 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>
                Owner: <strong className="text-slate-900">{owner?.name || "Unassigned"}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className={clsx("w-4 h-4", isOverdue ? "text-rose-600 font-bold" : "text-slate-500")} />
              <span>
                Deadline:{" "}
                <strong className={clsx(isOverdue ? "text-rose-700" : "text-slate-900")}>
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No date"}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
