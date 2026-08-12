"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Sliders,
  FileCheck2,
  Building2,
  Wrench,
  ShieldCheck,
  CheckCircle,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  LEAD_STAGES_CONFIG,
  PROJECT_STAGES_CONFIG,
  LEAD_SOURCES,
  KERALA_DISTRICTS,
  DEFAULT_DOCUMENT_CHECKLIST,
  DEFAULT_INSTALLATION_CHECKLIST,
} from "@/lib/constants";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "docs" | "install" | "kseb" | "roles">("pipeline");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Workflow Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pipeline stages, document checklists, KSEB procedures, and role permissions without rewriting code.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> Settings updated and persisted successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-4 scrollbar-thin">
          {[
            { id: "pipeline", label: "Pipeline Stages", icon: Sliders },
            { id: "docs", label: "Document Checklist", icon: FileCheck2 },
            { id: "install", label: "Installation Checklist (14 Items)", icon: Wrench },
            { id: "kseb", label: "KSEB Sections Master", icon: Building2 },
            { id: "roles", label: "Role Permissions Matrix", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 text-xs space-y-6">
          {/* TAB 1: PIPELINE STAGES */}
          {activeTab === "pipeline" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-2">Solar Project Lifecycle Stages (12 Stages)</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Standard operational milestones from booking confirmation to PM Surya Ghar subsidy claim.
                </p>

                <div className="space-y-2">
                  {PROJECT_STAGES_CONFIG.map((stage) => (
                    <div
                      key={stage.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {stage.stepNumber}
                        </span>
                        <div>
                          <strong className="text-slate-900">{stage.label}</strong>
                          <p className="text-slate-500 text-[11px] mt-0.5">{stage.description}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{stage.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-bold text-sm text-slate-900 mb-2">Lead Sales Pipeline Stages (8 Stages)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {LEAD_STAGES_CONFIG.map((s) => (
                    <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                      <span className="font-bold text-slate-800">{s.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT CHECKLIST */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Standard KYC & Building Document Templates</h3>
              <p className="text-xs text-slate-500">
                Documents automatically initialized for every newly created solar customer project.
              </p>

              <div className="space-y-2">
                {DEFAULT_DOCUMENT_CHECKLIST.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{doc.title}</span>
                      {doc.isRequired ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                          Optional
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-400 text-[10px]">{doc.documentType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INSTALLATION CHECKLIST */}
          {activeTab === "install" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">14-Point Technical Rigging & Installation Checklist</h3>
              <p className="text-xs text-slate-500">
                Technical quality assurance steps required before KSEB electrical inspection.
              </p>

              <div className="space-y-2">
                {DEFAULT_INSTALLATION_CHECKLIST.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-slate-800 font-medium">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: KSEB SECTIONS MASTER */}
          {activeTab === "kseb" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Kerala KSEB Electrical Sections & Divisions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  "Kozhikode Town",
                  "Feroke",
                  "Manjeri West",
                  "Edappally",
                  "Aluva East",
                  "Thrissur Town East",
                  "Palakkad Central",
                  "Kannur City",
                  "Kalpetta (Wayanad)",
                  "Aroor (Alappuzha)",
                  "Kottayam Central",
                  "Kazhakkoottam (TVM)",
                ].map((sec) => (
                  <div key={sec} className="p-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 inline mr-1.5" />
                    {sec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ROLES MATRIX */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Leads</th>
                      <th className="py-2.5 px-3">Customers</th>
                      <th className="py-2.5 px-3">Projects</th>
                      <th className="py-2.5 px-3">Documents</th>
                      <th className="py-2.5 px-3">KSEB</th>
                      <th className="py-2.5 px-3">Installation</th>
                      <th className="py-2.5 px-3">Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { role: "ADMIN", l: "Full", c: "Full", p: "Full", d: "Status Update", k: "Full", i: "Full", r: "Full" },
                      { role: "MANAGEMENT", l: "Read", c: "Read", p: "Read/Audit", d: "Read", k: "Read", i: "Read", r: "Executive" },
                      { role: "SALES_EXECUTIVE", l: "Create/Edit", c: "Convert", p: "Assigned", d: "Status Update", k: "View", i: "View", r: "Sales Only" },
                      { role: "SURVEY_TEAM", l: "Survey Task", c: "View", p: "Assigned", d: "Status Update", k: "View", i: "View", r: "None" },
                      { role: "KSEB_TEAM", l: "View", c: "View", p: "KSEB Update", d: "Status Update", k: "Full", i: "View", r: "KSEB Only" },
                      { role: "INSTALLATION_TEAM", l: "None", c: "View", p: "Assigned", d: "View", k: "View", i: "Checklist/Photos", r: "None" },
                    ].map((row) => (
                      <tr key={row.role} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.role}</td>
                        <td className="py-2.5 px-3">{row.l}</td>
                        <td className="py-2.5 px-3">{row.c}</td>
                        <td className="py-2.5 px-3">{row.p}</td>
                        <td className="py-2.5 px-3">{row.d}</td>
                        <td className="py-2.5 px-3">{row.k}</td>
                        <td className="py-2.5 px-3">{row.i}</td>
                        <td className="py-2.5 px-3">{row.r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
