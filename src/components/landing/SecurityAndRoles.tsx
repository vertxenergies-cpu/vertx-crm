import React from "react";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  History,
  Server,
  UserPlus,
  Compass,
  FileCheck2,
  Zap,
  Wrench,
  BarChart3,
  Settings,
} from "lucide-react";

export function LandingSecurityAndRoles() {
  const roles = [
    {
      role: "Sales Executive",
      icon: UserPlus,
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      modules: ["Leads & Enquiries", "Customer Directory", "Follow-up Reminders", "Quotations"],
    },
    {
      role: "Site Surveyor",
      icon: Compass,
      color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
      modules: ["Rooftop Assessments", "Shade Analysis", "Electrical Feasibility", "Survey Tasks"],
    },
    {
      role: "Documentation Specialist",
      icon: FileCheck2,
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
      modules: ["8-Point KYC Checklist", "Bank Loan Files", "Agreement Verification", "Doc Duties"],
    },
    {
      role: "KSEB Liaison Officer",
      icon: Zap,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      modules: ["Soura Online Portal", "Section Feasibility", "Electrical Inspection", "Net Metering"],
    },
    {
      role: "Installation Engineer",
      icon: Wrench,
      color: "text-orange-400 border-orange-500/20 bg-orange-500/10",
      modules: ["Structure Rigging", "Panel Mounting", "Inverter Commissioning", "Earthing Audit"],
    },
    {
      role: "Management / COO",
      icon: BarChart3,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
      modules: ["Executive Reports", "District Capacity", "Win Rate Analytics", "Team Visibility"],
    },
    {
      role: "System Administrator",
      icon: Settings,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      modules: ["Employee Accounts", "Role Permissions", "Pipeline Settings", "Audit Trail"],
    },
  ];

  return (
    <section id="security" className="py-20 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            Enterprise Security
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Built for Controlled Access.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Ensure customer contact data and operational project records are only accessible to authorized personnel based on strictly defined employee roles.
          </p>
        </div>

        {/* Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Firebase Authentication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encrypted credential verification with optional Google Workspace single sign-on.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Role-Based Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Granular access boundaries preventing unauthorized stage modifications or record views.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Complete Audit History</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every status change, stage transition, and customer edit is logged with timestamp and user ID.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Secure Backend Operations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protected API routes, parameterized database queries, and isolated client sessions.
            </p>
          </div>
        </div>

        {/* Role Matrix Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Role-Specific Workspace Views
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Employees only see the operational modules relevant to their daily duties.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r, idx) => {
              const Icon = r.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${r.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-white">{r.role}</h4>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {r.modules.map((m, mIdx) => (
                        <li key={mIdx} className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
