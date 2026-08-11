import React from "react";
import {
  AlertCircle,
  FileCheck2,
  Clock,
  UserX,
  Compass,
  Users,
  Building2,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export function LandingManagementSection() {
  const attentionItems = [
    {
      title: "Delayed Projects",
      icon: Clock,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      description: "Instantly surface installations exceeding standard milestone durations for immediate escalation.",
    },
    {
      title: "Pending KYC & Loan Files",
      icon: FileCheck2,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: "Flag missing consumer bills, land tax receipts, or bank sanctions before site mobilization.",
    },
    {
      title: "Overdue Employee Duties",
      icon: AlertCircle,
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      description: "Highlight elapsed follow-up phone calls, site visit deadlines, or KSEB inspection requests.",
    },
    {
      title: "Unassigned Solar Work",
      icon: UserX,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description: "Prevent inbound enquiries and newly booked projects from sitting without a dedicated owner.",
    },
    {
      title: "Projects Without Next Actions",
      icon: Compass,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Enforce strict workflow continuity so no active solar installation becomes stagnant.",
    },
    {
      title: "Team Workload Balancing",
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: "Track project distribution across sales reps, surveyors, and field installation engineers.",
    },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
            Proactive Operations
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Know What Needs Attention.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Operational bottlenecks, document gaps, and liaison delays are identified automatically so managers can act before issues escalate.
          </p>
        </div>

        {/* 6 Attention Item Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attentionItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real-time Detection</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
