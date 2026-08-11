import React from "react";
import {
  UserPlus,
  FolderKanban,
  Zap,
  Users2,
  FileCheck2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function LandingFeatures() {
  const features = [
    {
      id: "leads",
      title: "Lead Management",
      icon: UserPlus,
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Capture, qualify and assign residential and commercial solar enquiries across Kerala.",
      points: [
        "Channel attribution (Meta Ads, Referrals, Walk-ins)",
        "Sales executive ownership & stage progression",
        "Hot/Warm/Cold lead prioritization",
        "Automated follow-up scheduling & reminders",
      ],
    },
    {
      id: "lifecycle",
      title: "Project Lifecycle",
      icon: FolderKanban,
      color: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      description: "Track every solar installation through 10 distinct, sequential milestones from booking to commissioning.",
      points: [
        "Booking & Site Survey handover",
        "KYC Document collection & bank loan processing",
        "Structure rigging & DC wiring verification",
        "Bi-directional net metering & PM Surya Ghar subsidy",
      ],
    },
    {
      id: "kseb",
      title: "KSEB Tracking",
      icon: Zap,
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: "Keep the operational KSEB procedure transparent and accountable without losing project momentum.",
      points: [
        "13-digit KSEB Consumer # and Section Office mapping",
        "Soura portal feasibility sanction tracking",
        "Subdivision electrical inspection status",
        "Net meter installation & energization dates",
      ],
    },
    {
      id: "team",
      title: "Team Accountability",
      icon: Users2,
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: "Clear role ownership so every surveyor, liaison officer, engineer and manager knows exactly what to do next.",
      points: [
        "Daily automated operational duties by role",
        "Actionable My Work view with Overdue / Today / Upcoming",
        "Task assignments with due dates & priority",
        "Next action visibility on every project",
      ],
    },
    {
      id: "docs",
      title: "Document Collection",
      icon: FileCheck2,
      color: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      description: "Track required customer KYC and electrical approvals without turning the CRM into a messy file locker.",
      points: [
        "Standardized 8-point solar document checklist",
        "Visual progress indicator (e.g. 6 / 8 Documents Collected)",
        "Identity KYC, KSEB Bill, Ownership & Bank Loan Files",
        "Flags missing mandatory documents before installation",
      ],
    },
    {
      id: "management",
      title: "Management Visibility",
      icon: BarChart3,
      color: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description: "Executive dashboards and automated alerts to catch bottlenecks before they impact delivery timelines.",
      points: [
        "Instant Needs Management Attention panel",
        "At Risk and Delayed project health tracking",
        "District-wise solar capacity sold & installed (kW)",
        "Lead conversion win rate analytics & CSV export",
      ],
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            Comprehensive Platform
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Everything Your Solar Team Needs
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            A cohesive operational system connecting sales, site assessments, electrical liaison, material rigging, and management oversight.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                className="bg-slate-950/70 rounded-2xl p-6 sm:p-7 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${f.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {f.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-5 border-t border-slate-800/80">
                  {f.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
