import React from "react";
import { FolderKanban, CheckCircle2, AlertTriangle, Clock, Activity, ArrowRight } from "lucide-react";

export function LandingProjectVisibility() {
  return (
    <section id="visibility" className="py-20 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            Pipeline Transparency
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Real-Time Project Health
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Categorized status tracking across every ongoing solar installation in Kerala so leadership always knows project health at a glance.
          </p>
        </div>

        {/* Status Counters Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">On Track</div>
              <div className="text-3xl font-black text-white mt-1">24</div>
              <div className="text-[11px] text-slate-400 mt-1">On schedule</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-amber-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">At Risk</div>
              <div className="text-3xl font-black text-amber-400 mt-1">5</div>
              <div className="text-[11px] text-slate-400 mt-1">Approaching deadline</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-rose-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Delayed</div>
              <div className="text-3xl font-black text-rose-400 mt-1">2</div>
              <div className="text-[11px] text-slate-400 mt-1">Requires intervention</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-blue-900/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Completed</div>
              <div className="text-3xl font-black text-white mt-1">18</div>
              <div className="text-[11px] text-slate-400 mt-1">Handed over & energized</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Live Stage Distribution Strip */}
        <div className="max-w-5xl mx-auto bg-slate-950 rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-sm text-white mb-4 flex items-center justify-between">
            <span>Active Capacity in EPC Pipeline</span>
            <span className="text-amber-400 font-mono text-xs">184.2 kW In Progress</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            {[
              { stage: "Booking", count: 4, color: "border-blue-500/30 text-blue-300" },
              { stage: "Documents", count: 3, color: "border-indigo-500/30 text-indigo-300" },
              { stage: "Bank Loan", count: 2, color: "border-teal-500/30 text-teal-300" },
              { stage: "KSEB Soura", count: 5, color: "border-amber-500/30 text-amber-300" },
              { stage: "Installation", count: 4, color: "border-orange-500/30 text-orange-300" },
              { stage: "Inspection", count: 2, color: "border-pink-500/30 text-pink-300" },
              { stage: "Net Meter", count: 2, color: "border-purple-500/30 text-purple-300" },
              { stage: "Subsidy", count: 2, color: "border-emerald-500/30 text-emerald-300" },
            ].map((s, idx) => (
              <div key={idx} className={`p-3 rounded-xl bg-slate-900 border ${s.color}`}>
                <div className="text-base font-extrabold text-white">{s.count}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 truncate mt-0.5">{s.stage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
