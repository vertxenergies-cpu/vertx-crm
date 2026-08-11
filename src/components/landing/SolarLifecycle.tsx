import React from "react";
import {
  UserPlus,
  CheckCircle,
  FileCheck2,
  Landmark,
  Zap,
  Wrench,
  ShieldCheck,
  Activity,
  Award,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function LandingSolarLifecycle() {
  const stages = [
    {
      step: "01",
      title: "Lead",
      icon: UserPlus,
      color: "border-blue-500 text-blue-400 bg-blue-500/10",
      description: "Initial customer enquiry, site qualification, rooftop feasibility & formal quote.",
    },
    {
      step: "02",
      title: "Booking",
      icon: CheckCircle,
      color: "border-indigo-500 text-indigo-400 bg-indigo-500/10",
      description: "Token advance received, capacity confirmed (kW), and project converted into EPC pipeline.",
    },
    {
      step: "03",
      title: "Documents",
      icon: FileCheck2,
      color: "border-cyan-500 text-cyan-400 bg-cyan-500/10",
      description: "8-point KYC checklist verified: Aadhaar, KSEB electricity bill, property tax & deed.",
    },
    {
      step: "04",
      title: "Loan",
      icon: Landmark,
      color: "border-teal-500 text-teal-400 bg-teal-500/10",
      description: "Bank green solar loan application, income documentation & disbursement tracking.",
    },
    {
      step: "05",
      title: "KSEB",
      icon: Zap,
      color: "border-amber-500 text-amber-400 bg-amber-500/10",
      description: "KSEB Soura portal online filing, consumer verification & technical feasibility sanction.",
    },
    {
      step: "06",
      title: "Installation",
      icon: Wrench,
      color: "border-orange-500 text-orange-400 bg-orange-500/10",
      description: "GI/Aluminium structure rigging, TopCon solar panel mounting & inverter DC/AC wiring.",
    },
    {
      step: "07",
      title: "Inspection",
      icon: ShieldCheck,
      color: "border-pink-500 text-pink-400 bg-pink-500/10",
      description: "KSEB section electrical officer site visit, earthing resistance & protection audit.",
    },
    {
      step: "08",
      title: "Net Meter",
      icon: Activity,
      color: "border-purple-500 text-purple-400 bg-purple-500/10",
      description: "Bi-directional smart net meter installation, test energization & grid synchronisation.",
    },
    {
      step: "09",
      title: "Subsidy",
      icon: Award,
      color: "border-violet-500 text-violet-400 bg-violet-500/10",
      description: "National Portal for PM Surya Ghar: Muft Bijli Yojana direct subsidy claim submission.",
    },
    {
      step: "10",
      title: "Completed",
      icon: CheckCircle2,
      color: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
      description: "100% project completion, commissioning certificate, warranty card & customer handover.",
    },
  ];

  return (
    <section id="lifecycle" className="py-20 bg-slate-950 text-white relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            End-to-End Solar Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            From Lead to Solar Commissioning
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Standardized operational milestones built around how Kerala solar EPC projects actually progress through regulatory and electrical hurdles.
          </p>
        </div>

        {/* 10-Stage Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stages.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      STEP {st.step}
                    </span>
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${st.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {st.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Milestone {st.step}</span>
                  <span className="text-emerald-400 font-bold">● Tracked</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
