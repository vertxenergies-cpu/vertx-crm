"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  CheckCircle,
  X,
  Clock,
  Download,
  Flame,
  FileText,
  UserCheck,
  Send,
} from "lucide-react";
import { Lead, User, LeadStage, LeadPriority } from "@/types";
import { LeadStageBadge, PriorityBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { KERALA_DISTRICTS, LEAD_SOURCES, LEAD_STAGES_CONFIG } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { clsx } from "clsx";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500 animate-pulse">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allUsers, currentUser } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>(searchParams.get("stage") || "ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>(searchParams.get("priority") || "ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(searchParams.get("action") === "create");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Synchronize modal open state with URL action param
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    if (searchParams.get("action") === "create") {
      router.replace("/leads", { scroll: false });
    }
  };

  // Form State for new lead
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    district: "Kozhikode",
    leadSource: "Meta Ads",
    assignedSalespersonId: "usr-super-admin",
    priority: "HOT" as LeadPriority,
    estimatedSystemSizeKw: "5.0",
    monthlyElectricityBill: "5000",
    requirementNotes: "",
  });

  // Conversion Form State
  const [conversionData, setConversionData] = useState({
    systemSizeKw: "5.0",
    projectValue: "285000",
    ksebConsumerNumber: "",
    ksebSection: "",
    projectManagerId: "usr-super-admin",
  });

  // Notes & Followups on Selected Lead
  const [leadNotes, setLeadNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [followUpAction, setFollowUpAction] = useState<any>("CALL");
  const [followUpNote, setFollowUpNote] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setFormData({
          customerName: "",
          phone: "",
          whatsapp: "",
          email: "",
          address: "",
          district: "Kozhikode",
          leadSource: "Meta Ads",
          assignedSalespersonId: "usr-super-admin",
          priority: "HOT",
          estimatedSystemSizeKw: "5.0",
          monthlyElectricityBill: "5000",
          requirementNotes: "",
        });
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStage, _userId: currentUser?.id || "usr-super-admin" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenLeadDetails = async (lead: Lead) => {
    setSelectedLead(lead);
    setConversionData({
      systemSizeKw: String(lead.estimatedSystemSizeKw || 5.0),
      projectValue: String((lead.estimatedSystemSizeKw || 5.0) * 57000),
      ksebConsumerNumber: "",
      ksebSection: `${lead.district} Town`,
      projectManagerId: "usr-super-admin",
    });

    // fetch notes
    try {
      const res = await fetch(`/api/notes?entityType=LEAD&entityId=${lead.id}`);
      const data = await res.json();
      if (data.success) setLeadNotes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNoteText.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "LEAD",
          entityId: selectedLead.id,
          authorId: currentUser?.id || "usr-super-admin",
          authorName: currentUser?.name || "Solar Specialist",
          content: newNoteText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeadNotes([data.data, ...leadNotes]);
        setNewNoteText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFollowUp = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          assignedUserId: selectedLead.assignedSalespersonId || currentUser?.id || "usr-super-admin",
          dueDate: new Date(followUpDate).toISOString(),
          actionType: followUpAction,
          notes: followUpNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Follow-up scheduled successfully!");
        setFollowUpNote("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemSizeKw: conversionData.systemSizeKw,
          projectValue: conversionData.projectValue,
          ksebConsumerNumber: conversionData.ksebConsumerNumber,
          ksebSection: conversionData.ksebSection,
          projectManagerId: conversionData.projectManagerId,
          _userId: currentUser?.id || "usr-super-admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConvertModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
        window.location.href = `/projects/${data.data.project.id}`;
      } else {
        alert(`Conversion error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Lead ID", "Customer Name", "Phone", "District", "Source", "System Size (kW)", "Stage", "Priority", "Created Date"];
    const rows = filteredLeads.map((l) => [
      l.leadNumber,
      `"${l.customerName}"`,
      l.phone,
      l.district,
      l.leadSource,
      l.estimatedSystemSizeKw,
      l.currentStage,
      l.priority,
      new Date(l.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solar_leads_kerala_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      !search ||
      l.customerName.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.leadNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.district.toLowerCase().includes(search.toLowerCase());

    const matchesStage = selectedStage === "ALL" || l.currentStage === selectedStage;
    const matchesPriority = selectedPriority === "ALL" || l.priority === selectedPriority;
    const matchesDistrict = selectedDistrict === "ALL" || l.district === selectedDistrict;
    const matchesSalesperson = selectedSalesperson === "ALL" || l.assignedSalespersonId === selectedSalesperson;
    const matchesSource = selectedSource === "ALL" || l.leadSource === selectedSource;

    return matchesSearch && matchesStage && matchesPriority && matchesDistrict && matchesSalesperson && matchesSource;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Solar Lead Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture, qualify and convert solar enquiries across 14 Kerala districts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setViewMode("table")}
              className={clsx(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
                viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <TableIcon className="w-4 h-4" /> Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={clsx(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Kanban className="w-4 h-4" /> Pipeline
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium shadow-sm transition flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Create Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, phone, lead #..."
              className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              {LEAD_STAGES_CONFIG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Districts</option>
              {KERALA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="HOT">🔥 Hot</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Salesperson Filter */}
          <div>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Sales Reps</option>
              {allUsers
                .filter((u) => u.role === "SALES_EXECUTIVE" || u.role === "ADMIN")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* View: Table View */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No Leads Found"
              description="No leads match your current search and filter criteria. Adjust your filters or add a new enquiry."
              actionLabel="Add Lead"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">District</th>
                    <th className="py-3.5 px-4">Capacity</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Salesperson</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleOpenLeadDetails(lead)}
                      className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {lead.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{lead.leadNumber}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{lead.phone}</div>
                        {lead.email && <div className="text-[11px] text-slate-400">{lead.email}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {lead.district}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {lead.estimatedSystemSizeKw} kW
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{lead.leadSource}</td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {lead.assignedSalesperson?.name || "Unassigned"}
                      </td>

                      <td className="py-3.5 px-4">
                        <LeadStageBadge stage={lead.currentStage} />
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLeadDetails(lead);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100/60 rounded-lg transition"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px]">
            {LEAD_STAGES_CONFIG.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.currentStage === stage.id);
              return (
                <div
                  key={stage.id}
                  className="w-72 shrink-0 bg-slate-100/80 rounded-xl p-3 border border-slate-200/80 flex flex-col max-h-[75vh]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleOpenLeadDetails(lead)}
                        className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-slate-400">{lead.leadNumber}</span>
                          <PriorityBadge priority={lead.priority} />
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {lead.customerName}
                        </h4>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                          <span>{lead.estimatedSystemSizeKw} kW</span>
                          <span className="text-slate-500">{lead.district}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{lead.assignedSalesperson?.name || "Sales"}</span>
                          <span>{lead.leadSource}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={handleCloseCreateModal}
        title="Create New Solar Lead"
        icon={<UserPlus className="w-5 h-5 text-blue-600" />}
        maxWidth="xl"
        footer={
          <>
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-lead-form"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              Save & Create Lead
            </button>
          </>
        }
      >
        <form id="create-lead-form" onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Muhammed Shihab"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98470 XXXXX"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+91 98470 XXXXX"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@gmail.com"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kerala District *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Source *</label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated System Size (kW) *</label>
              <input
                type="number"
                step="0.5"
                value={formData.estimatedSystemSizeKw}
                onChange={(e) => setFormData({ ...formData, estimatedSystemSizeKw: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Electricity Bill (₹)</label>
              <input
                type="number"
                value={formData.monthlyElectricityBill}
                onChange={(e) => setFormData({ ...formData, monthlyElectricityBill: e.target.value })}
                placeholder="e.g. 4500"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Level *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="HOT">🔥 Hot (Immediate Intent)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Sales Representative *</label>
              <select
                value={formData.assignedSalespersonId}
                onChange={(e) => setFormData({ ...formData, assignedSalespersonId: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Address / Landmark</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Near Post Office, Mavoor Road..."
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Requirement Notes</label>
            <textarea
              rows={2}
              value={formData.requirementNotes}
              onChange={(e) => setFormData({ ...formData, requirementNotes: e.target.value })}
              placeholder="Interested in PM Surya Ghar 78k subsidy scheme..."
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* LEAD DETAILS DRAWER */}
      {selectedLead && (
        <Drawer
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900">{selectedLead.customerName}</span>
              <PriorityBadge priority={selectedLead.priority} />
            </div>
          }
          subtitle={selectedLead.leadNumber}
          headerActions={
            selectedLead.currentStage !== "BOOKED" ? (
              <button
                type="button"
                onClick={() => setConvertModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Convert to Project
              </button>
            ) : null
          }
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Sales Stage Stepper */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <label className="block font-bold text-slate-700 mb-2">Update Pipeline Stage:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {LEAD_STAGES_CONFIG.map((s) => {
                  const isCurrent = selectedLead.currentStage === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleStageChange(selectedLead.id, s.id)}
                      className={clsx(
                        "py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition cursor-pointer",
                        isCurrent
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lead Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Contact Phone</span>
                <a href={`tel:${selectedLead.phone}`} className="font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {selectedLead.phone}
                </a>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">WhatsApp</span>
                {selectedLead.whatsapp ? (
                  <a
                    href={`https://wa.me/${selectedLead.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> {selectedLead.whatsapp}
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">District</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedLead.district}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Estimated System</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> {selectedLead.estimatedSystemSizeKw} kW
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lead Source</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedLead.leadSource}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Assigned Rep</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedLead.assignedSalesperson?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {selectedLead.address && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium text-[11px]">Site Address / Landmark</span>
                <p className="text-slate-800 font-medium mt-0.5">{selectedLead.address}</p>
              </div>
            )}

            {selectedLead.requirementNotes && (
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                <span className="text-blue-700 block font-bold text-[11px]">Customer Requirements</span>
                <p className="text-slate-800 mt-0.5">{selectedLead.requirementNotes}</p>
              </div>
            )}

            {/* Quick Follow-up Scheduler */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" /> Schedule Next Follow-up
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Action Type</label>
                  <select
                    value={followUpAction}
                    onChange={(e) => setFollowUpAction(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SITE_VISIT">Site Visit</option>
                    <option value="MEETING">Meeting</option>
                    <option value="SEND_QUOTATION">Send Quotation</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                placeholder="Follow-up notes (e.g. Discuss revised quote)..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white mb-2"
              />
              <button
                onClick={handleAddFollowUp}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Add Follow-up Reminder
              </button>
            </div>

            {/* Internal Progress Notes */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" /> Progress Notes
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add an internal progress note..."
                  className="flex-1 text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 mt-2">
                {leadNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                ) : (
                  leadNotes.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <strong className="text-slate-800">{n.authorName}</strong>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-700">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* CONVERT LEAD TO CUSTOMER & PROJECT MODAL */}
      {selectedLead && (
        <Modal
          isOpen={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          title="Convert Lead to Solar Project"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          headerBg="bg-emerald-50"
          maxWidth="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setConvertModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertLead}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                Confirm & Create Project
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              This will automatically create a <strong>Customer</strong> record and initiate a <strong>Solar Project</strong> with stage <em>Booking Confirmed</em>, KYC document checklist, and KSEB tracker.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">System Capacity (kW) *</label>
              <input
                type="number"
                step="0.5"
                value={conversionData.systemSizeKw}
                onChange={(e) => setConversionData({ ...conversionData, systemSizeKw: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Project Value (₹) *</label>
              <input
                type="number"
                value={conversionData.projectValue}
                onChange={(e) => setConversionData({ ...conversionData, projectValue: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">KSEB Consumer # (Optional)</label>
                <input
                  type="text"
                  value={conversionData.ksebConsumerNumber}
                  onChange={(e) => setConversionData({ ...conversionData, ksebConsumerNumber: e.target.value })}
                  placeholder="1155420018942"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">KSEB Section Office</label>
                <input
                  type="text"
                  value={conversionData.ksebSection}
                  onChange={(e) => setConversionData({ ...conversionData, ksebSection: e.target.value })}
                  placeholder="Kozhikode Town"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Manager *</label>
              <select
                value={conversionData.projectManagerId}
                onChange={(e) => setConversionData({ ...conversionData, projectManagerId: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                {allUsers
                  .filter((u) => u.role === "ADMIN" || u.role === "MANAGEMENT" || u.role === "PROJECT_MANAGER" || u.superAdmin || u.role === "SUPER_ADMIN")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role?.replace(/_/g, " ") || "Staff"})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
