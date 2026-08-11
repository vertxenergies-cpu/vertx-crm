import React from "react";
import { CheckSquare, Clock, CalendarClock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export function LandingMyWorkPreview() {
  return (
    <section id="my-work" className="py-20 bg-slate-950 text-white relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            Employee Accountability
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Daily Clarity with &quot;My Work&quot;
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Every team member gets a prioritized, role-specific daily queue. No ambiguity over who owns the next action.
          </p>
        </div>

        {/* My Work Mockup UI Card */}
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header row with KPI filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">My Work Responsibilities</h3>
                <p className="text-xs text-slate-400">Assigned duties, pending follow-ups & operational tasks</p>
              </div>
            </div>

            {/* Metric counters */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue: 2
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Today: 5
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Upcoming: 11
              </span>
            </div>
          </div>

          {/* Sample Action Item Cards */}
          <div className="space-y-3">
            {/* Item 1: Overdue */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Follow up KSEB Section Feasibility</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      Overdue
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project SOL-2026-0018 • Customer: Muhammed S. • Kozhikode Town Section
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-rose-400 shrink-0 self-start sm:self-center">
                Action Required →
              </span>
            </div>

            {/* Item 2: Today */}
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Collect KSEB Bill & Aadhaar KYC Documents</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Due Today
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project SOL-2026-0021 • Customer: Anjali M. • 6 of 8 Documents Completed
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-blue-400 shrink-0 self-start sm:self-center">
                Review Checklist →
              </span>
            </div>

            {/* Item 3: Upcoming */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Schedule Structural Mounting & Inverter Delivery</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Upcoming (Tomorrow)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project SOL-2026-0012 • 8 kW RCC Flat Roof • Thrissur
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-400 group-hover:text-white shrink-0 self-start sm:self-center">
                View Project →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
