import React from "react";
import { Zap, GitBranch, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";

export function LandingWhyThisCRM() {
  return (
    <section className="py-20 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              Operational Focus
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Built Around How Solar Projects Actually Move.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Solar projects don&apos;t end when a customer says yes. Sales, documentation, finance, KSEB, installation and follow-ups all have to move together.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed">
              When these stages are managed across fragmented WhatsApp groups, paper files, and disconnected spreadsheets, projects stall at feasibility approvals or subsidy submissions. Kerala Solar CRM keeps every stakeholder synchronized with clear handoffs and role-specific duties.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span><strong>No Orphaned Handoffs:</strong> Seamless transition from Sales enquiry to Site Survey, KSEB Liaison, and Installation teams.</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span><strong>KSEB & Soura Specialization:</strong> Dedicated tracking fields for consumer numbers, section offices, and feasibility deadlines.</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span><strong>Zero Spreadsheet Chaos:</strong> Live cloud records mean everyone works with verified, up-to-date project specifications.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Diagram Card */}
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-400" /> Unified Operations vs. Fragmented Tools
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Traditional EPC Process
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Leads on WhatsApp → Documents in email attachments → KSEB files in local office drawers → Installation delays due to missing KYC.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Kerala Solar CRM Architecture
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Single live project record with automated stage checklists, daily employee My Work queues, KSEB status updates, and management health alerts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-lg font-extrabold text-white">100%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Stage Traceability</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-lg font-extrabold text-emerald-400">8 Roles</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Accountability Matrix</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
