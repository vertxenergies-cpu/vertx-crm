"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Phone,
  MessageCircle,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { FollowUp, ActionType } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

export default function FollowUpsPage() {
  const { allUsers, currentUser } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | "overdue" | "today" | "upcoming" | "completed">("today");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const [formData, setFormData] = useState({
    assignedUserId: "usr-super-admin",
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: "11:00 AM",
    actionType: "CALL" as ActionType,
    notes: "",
  });

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/followups");
      const data = await res.json();
      if (data.success) {
        setFollowUps(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  const overdueList = followUps.filter(
    (f) => f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart
  );
  const todayList = followUps.filter((f) => {
    const t = new Date(f.dueDate).getTime();
    return f.status === "PENDING" && t >= todayStart && t < todayEnd;
  });
  const upcomingList = followUps.filter(
    (f) => f.status === "PENDING" && new Date(f.dueDate).getTime() >= todayEnd
  );
  const completedList = followUps.filter((f) => f.status === "COMPLETED");

  const displayedList =
    activeCategory === "overdue"
      ? overdueList
      : activeCategory === "today"
      ? todayList
      : activeCategory === "upcoming"
      ? upcomingList
      : activeCategory === "completed"
      ? completedList
      : followUps;

  const handleComplete = async (id: string) => {
    try {
      await fetch(`/api/followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleId || !rescheduleDate) return;
    try {
      await fetch(`/api/followups/${rescheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(rescheduleDate).toISOString(),
          status: "PENDING",
        }),
      });
      setRescheduleId(null);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });
      setCreateModalOpen(false);
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Solar Follow-up System</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Never miss a customer callback, quotation review, or site survey appointment.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Schedule Follow-up
        </button>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveCategory("overdue")}
          className={clsx(
            "p-4 rounded-xl border text-left transition flex items-center justify-between",
            activeCategory === "overdue"
              ? "bg-rose-100/70 border-rose-300 ring-2 ring-rose-400"
              : "bg-rose-50/50 border-rose-200 hover:bg-rose-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Overdue
            </span>
            <div className="text-2xl font-extrabold text-rose-950 mt-0.5">{overdueList.length}</div>
          </div>
          <span className="text-xs text-rose-600 font-semibold">Immediate</span>
        </button>

        <button
          onClick={() => setActiveCategory("today")}
          className={clsx(
            "p-4 rounded-xl border text-left transition flex items-center justify-between",
            activeCategory === "today"
              ? "bg-amber-100/70 border-amber-300 ring-2 ring-amber-400"
              : "bg-amber-50/50 border-amber-200 hover:bg-amber-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Today
            </span>
            <div className="text-2xl font-extrabold text-amber-950 mt-0.5">{todayList.length}</div>
          </div>
          <span className="text-xs text-amber-600 font-semibold">Today&apos;s Calls</span>
        </button>

        <button
          onClick={() => setActiveCategory("upcoming")}
          className={clsx(
            "p-4 rounded-xl border text-left transition flex items-center justify-between",
            activeCategory === "upcoming"
              ? "bg-blue-100/70 border-blue-300 ring-2 ring-blue-400"
              : "bg-blue-50/50 border-blue-200 hover:bg-blue-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-blue-600" /> Upcoming
            </span>
            <div className="text-2xl font-extrabold text-blue-950 mt-0.5">{upcomingList.length}</div>
          </div>
          <span className="text-xs text-blue-600 font-semibold">Scheduled</span>
        </button>

        <button
          onClick={() => setActiveCategory("completed")}
          className={clsx(
            "p-4 rounded-xl border text-left transition flex items-center justify-between",
            activeCategory === "completed"
              ? "bg-emerald-100/70 border-emerald-300 ring-2 ring-emerald-400"
              : "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50"
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
            </span>
            <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">{completedList.length}</div>
          </div>
          <span className="text-xs text-emerald-600 font-semibold">Resolved</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No Follow-ups in this Category"
            description="You're all caught up! Schedule a new follow-up callback or site survey."
            actionLabel="Schedule Follow-up"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          displayedList.map((f) => {
            const isOverdue =
              f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart;
            const targetName = f.lead?.customerName || f.customer?.name || "Client";
            const targetPhone = f.lead?.phone || f.customer?.phone || "";

            return (
              <div
                key={f.id}
                className={clsx(
                  "p-4 rounded-xl border bg-white shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isOverdue ? "border-rose-200 bg-rose-50/20" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 mt-0.5",
                      f.actionType === "CALL"
                        ? "bg-blue-600"
                        : f.actionType === "WHATSAPP"
                        ? "bg-emerald-600"
                        : f.actionType === "SITE_VISIT"
                        ? "bg-purple-600"
                        : "bg-indigo-600"
                    )}
                  >
                    {f.actionType === "CALL" && <Phone className="w-5 h-5" />}
                    {f.actionType === "WHATSAPP" && <MessageCircle className="w-5 h-5" />}
                    {f.actionType === "SITE_VISIT" && <MapPin className="w-5 h-5" />}
                    {f.actionType !== "CALL" && f.actionType !== "WHATSAPP" && f.actionType !== "SITE_VISIT" && (
                      <CalendarClock className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{targetName}</h4>
                      <span className="text-xs text-slate-500 font-medium">({targetPhone})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                        {f.actionType.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{f.notes || "No specific note provided"}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>
                        Due:{" "}
                        <strong className={clsx(isOverdue ? "text-rose-600 font-bold" : "text-slate-700")}>
                          {new Date(f.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} at {f.dueTime}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Assigned: {f.assignedUser?.name || "Sales"}</span>
                    </div>
                  </div>
                </div>

                {f.status === "PENDING" && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleComplete(f.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button
                      onClick={() => {
                        setRescheduleId(f.id);
                        setRescheduleDate(new Date().toISOString().slice(0, 10));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium shadow-sm transition"
                    >
                      Reschedule
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Solar Follow-up"
        icon={<CalendarClock className="w-5 h-5 text-blue-600" />}
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
              form="create-followup-form"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              Schedule Follow-up
            </button>
          </>
        }
      >
        <form id="create-followup-form" onSubmit={handleCreate} className="space-y-3.5 text-xs">
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
            <label className="block font-semibold text-slate-700 mb-1">Action Type *</label>
            <select
              value={formData.actionType}
              onChange={(e) => setFormData({ ...formData, actionType: e.target.value as ActionType })}
              className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp Follow-up</option>
              <option value="SITE_VISIT">Site Survey Visit</option>
              <option value="MEETING">Customer Consultation</option>
              <option value="SEND_QUOTATION">Send Proposal / Quotation</option>
              <option value="COLLECT_DOCUMENTS">Collect KYC / Agreement Docs</option>
            </select>
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
            <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Call to discuss 5kW rooftop layout and answer subsidy questions"
              className="w-full text-xs p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        isOpen={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        title="Reschedule Follow-up"
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        maxWidth="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRescheduleId(null)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
            >
              Save Date
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Due Date *</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
