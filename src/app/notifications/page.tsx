"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Notification } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { clsx } from "clsx";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications & Operational Alerts</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time system events, overdue reminders, KSEB inspection milestones, and document status updates.
        </p>
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="You are completely up to date with all solar EPC events and deadlines."
          />
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={clsx(
                "p-4 transition flex items-start justify-between gap-4 text-xs",
                !n.isRead ? "bg-blue-50/30" : "hover:bg-slate-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 mt-0.5",
                    !n.isRead ? "bg-blue-600" : "bg-slate-400"
                  )}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{n.title}</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 font-semibold flex items-center gap-1 transition"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
