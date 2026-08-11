"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  FolderKanban,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Flame,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  FileCheck2,
  Building2,
  PhoneCall,
} from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { DashboardStats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const STAGE_COLORS = [
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#F59E0B",
  "#EA580C",
  "#8B5CF6",
  "#7C3AED",
  "#10B981",
  "#059669",
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-solar-navy via-solar-deep to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Vertx Energies • Solar EPC Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Solar CRM & Lifecycle Management
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            Real-time management visibility over leads, customer bookings, KSEB Soura portal filings,
            material installations, net meter energization, and PM Surya Ghar subsidies.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push("/leads?action=create")}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Lead
          </button>
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" /> View Projects
          </button>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-amber-500/10 blur-xl" />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Active Leads"
          value={stats.totalLeads}
          subtitle={`${stats.newLeads} new leads waiting for first contact`}
          icon={UserPlus}
          color="blue"
          badge={{ text: "Pipeline", variant: "neutral" }}
          onClick={() => router.push("/leads")}
        />

        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle={`${stats.totalCapacityKwSold.toFixed(1)} kW Total Capacity Managed`}
          icon={FolderKanban}
          color="indigo"
          badge={{ text: "In Progress", variant: "warning" }}
          onClick={() => router.push("/projects")}
        />

        <StatsCard
          title="Projects Completed"
          value={stats.completedProjects}
          subtitle="Commissioned & Net Meter active"
          icon={CheckCircle2}
          color="emerald"
          badge={{ text: "100% Handover", variant: "success" }}
          onClick={() => router.push("/projects?stage=COMPLETED")}
        />

        <StatsCard
          title="Follow-ups Today"
          value={stats.followUpsToday}
          subtitle={`${stats.overdueFollowUps} overdue follow-up calls`}
          icon={CalendarClock}
          color={stats.overdueFollowUps > 0 ? "rose" : "amber"}
          badge={
            stats.overdueFollowUps > 0
              ? { text: `${stats.overdueFollowUps} Overdue`, variant: "danger" }
              : { text: "On Schedule", variant: "success" }
          }
          onClick={() => router.push("/followups")}
        />
      </div>

      {/* Secondary Status Health Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => router.push("/projects?status=AT_RISK")}
          className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Projects At Risk
              </div>
              <div className="text-xl font-extrabold text-amber-950">{stats.projectsAtRisk}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </div>

        <div
          onClick={() => router.push("/projects?status=DELAYED")}
          className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Projects Delayed
              </div>
              <div className="text-xl font-extrabold text-rose-950">{stats.projectsDelayed}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-700" />
        </div>

        <div
          onClick={() => router.push("/leads?priority=HOT")}
          className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Hot Conversion Leads
              </div>
              <div className="text-xl font-extrabold text-orange-950">High Intent</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-700" />
        </div>
      </div>

      {/* SECTION: NEEDS ATTENTION (MOST IMPORTANT MANAGEMENT PANEL) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <h2 className="text-lg font-bold text-slate-900">Needs Management Attention</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Action items with elapsed deadlines, missing KYC documents, or KSEB stage bottlenecks.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            {stats.needsAttention.length} Critical Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {stats.needsAttention.map((item) => {
            const isCritical = item.severity === "CRITICAL";
            return (
              <div
                key={item.id}
                onClick={() => router.push(item.linkUrl)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                  isCritical
                    ? "bg-rose-50/40 border-rose-200 hover:bg-rose-50/80 hover:border-rose-300"
                    : "bg-amber-50/40 border-amber-200 hover:bg-amber-50/80 hover:border-amber-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                      isCritical ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {item.type === "OVERDUE_FOLLOWUP" && <PhoneCall className="w-4 h-4" />}
                    {item.type === "OVERDUE_TASK" && <Clock className="w-4 h-4" />}
                    {item.type === "PENDING_DOCS" && <FileCheck2 className="w-4 h-4" />}
                    {item.type === "OVERDUE_KSEB" && <Building2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">{item.subtitle}</p>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCritical
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.dueText}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition shrink-0 mt-2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts: Projects by Stage & Sales Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Projects Pipeline Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Projects by Operational Stage</h3>
              <Link href="/projects" className="text-xs font-semibold text-blue-600 hover:underline">
                View All →
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">
              Distribution of active projects across 10 EPC milestones
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.projectsByStage} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                <XAxis
                  dataKey="label"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 9, fill: "#64748b" }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B192C",
                    borderColor: "#1E3E62",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(value: any) => [`${value} Projects`, "Count"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.projectsByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Lead Sales Pipeline</h3>
              <Link href="/leads" className="text-xs font-semibold text-blue-600 hover:underline">
                Open Pipeline →
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">
              Breakdown of leads from initial enquiry to booked conversion
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.leadsByStage} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis dataKey="label" type="category" width={95} tick={{ fontSize: 10, fill: "#334155", fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B192C",
                    borderColor: "#1E3E62",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(value: any) => [`${value} Leads`, "Count"]}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
