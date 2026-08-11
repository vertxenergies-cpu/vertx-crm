import React from "react";
import {
  FolderKanban,
  UserPlus,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Zap,
  Building2,
  PhoneCall,
  Clock,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export function ProductPreview() {
  return (
    <section className="relative -mt-6 sm:-mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
      {/* Browser Mockup Container */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-blue-950/50 overflow-hidden backdrop-blur-xl">
        {/* Browser Top Window Bar */}
        <div className="h-11 bg-slate-950/90 px-4 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="px-6 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono flex items-center gap-2 max-w-sm truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>app.vertxenergies.com/dashboard</span>
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
            Operations Portal
          </div>
        </div>

        {/* Mockup Body */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-950/60 space-y-6">
          {/* Welcome Banner Mock */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-5 border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 mb-2">
                <Zap className="w-3 h-3 text-amber-400" /> Live Solar Operations Command
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Solar CRM & Lifecycle Management
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Real-time management visibility over leads, customer bookings, KSEB Soura filings, material rigging, and PM Surya Ghar subsidies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <UserPlus className="w-3.5 h-3.5" /> Quick Lead
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/20">
                10 Stages
              </span>
            </div>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 text-left">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Leads</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">Pipeline</span>
              </div>
              <div className="text-2xl font-black text-white">34</div>
              <div className="text-[11px] text-slate-400 mt-1">6 new leads today</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 text-left">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Projects</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold">In Progress</span>
              </div>
              <div className="text-2xl font-black text-amber-400">18</div>
              <div className="text-[11px] text-slate-400 mt-1">128.5 kW Total Sold</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 text-left">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Completed</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold">Net Meter Live</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">22</div>
              <div className="text-[11px] text-slate-400 mt-1">100% Handover Rate</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 text-left">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Follow-ups</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">On Track</span>
              </div>
              <div className="text-2xl font-black text-blue-400">5</div>
              <div className="text-[11px] text-slate-400 mt-1">0 overdue calls</div>
            </div>
          </div>

          {/* Attention & Stage Pipeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Needs Management Attention Card */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-sm text-white">Needs Management Attention</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Real-time Detection
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">KSEB Feasibility Sanction Pending</div>
                      <div className="text-[11px] text-slate-400">Project SOL-2026-0018 • Kozhikode Town</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 shrink-0 ml-2">
                    Action Required
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">Customer KYC Documents Incomplete (6/8)</div>
                      <div className="text-[11px] text-slate-400">Project SOL-2026-0021 • Ernakulam</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 shrink-0 ml-2">
                    Follow-up
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Progression Preview */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Project Stage Flow</span>
                <span className="text-xs text-blue-400 font-semibold">10 Milestone EPC Pipeline</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { stage: "Booking & Site Survey", count: "4 Projects", pct: "100%", color: "bg-blue-500" },
                  { stage: "Document KYC & Bank Loan", count: "3 Projects", pct: "75%", color: "bg-indigo-500" },
                  { stage: "KSEB Soura Portal Sanction", count: "5 Projects", pct: "60%", color: "bg-amber-500" },
                  { stage: "Structure & Panel Installation", count: "4 Projects", pct: "40%", color: "bg-emerald-500" },
                  { stage: "Net Meter Energization & Subsidy", count: "2 Projects", pct: "20%", color: "bg-purple-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">{item.stage}</span>
                      <span className="font-mono text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
