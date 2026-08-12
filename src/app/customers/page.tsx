"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  Building2,
  FolderKanban,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { Customer } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { KERALA_DISTRICTS } from "@/lib/constants";
import { HealthBadge, ProjectStageBadge } from "@/components/ui/badges";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { getIdToken } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    district: "Ernakulam",
    ksebConsumerNumber: "",
    ksebSection: "",
    ksebSubDivision: "",
    propertyType: "Residential Villa (RCC Flat Roof)",
    notes: "",
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`, { headers });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          whatsapp: "",
          email: "",
          address: "",
          district: "Kozhikode",
          ksebConsumerNumber: "",
          ksebSection: "",
          ksebSubDivision: "",
          propertyType: "Residential Villa (RCC Flat Roof)",
          notes: "",
        });
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered solar clients with active installations and KSEB section mappings across Kerala.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, KSEB consumer #, district..."
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Customers Found"
            description="No customers match your search criteria. Create a customer or convert a qualified lead."
            actionLabel="Add Customer"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">District / Location</th>
                  <th className="py-3.5 px-4">KSEB Consumer #</th>
                  <th className="py-3.5 px-4">KSEB Section</th>
                  <th className="py-3.5 px-4">Projects</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.customerNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{c.phone}</div>
                      {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {c.district}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {c.ksebConsumerNumber || <span className="text-slate-400 font-normal">Pending</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.ksebSection || <span className="text-slate-400">Unassigned</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        <FolderKanban className="w-3.5 h-3.5" /> {c.projects?.length || 0} Project(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100/60 rounded-lg transition"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CUSTOMER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Solar Customer"
        icon={<Users className="w-5 h-5 text-blue-600" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. K. P. Sukumaran Nair"
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
                placeholder="+91 94470 XXXXX"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+91 94470 XXXXX"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kerala District *</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white"
              >
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Property Type</label>
              <input
                type="text"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                placeholder="Residential Villa (RCC Flat Roof)"
                className="w-full text-xs px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">KSEB 13-digit Consumer #</label>
              <input
                type="text"
                value={formData.ksebConsumerNumber}
                onChange={(e) => setFormData({ ...formData, ksebConsumerNumber: e.target.value })}
                placeholder="1155420018942"
                className="w-full text-xs px-3 py-2 border rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">KSEB Section Office</label>
              <input
                type="text"
                value={formData.ksebSection}
                onChange={(e) => setFormData({ ...formData, ksebSection: e.target.value })}
                placeholder="e.g. Kozhikode Town"
                className="w-full text-xs px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Installation Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Building name, street, post office..."
                className="w-full text-xs px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER DETAILS MODAL / DRAWER */}
      <Drawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || "Customer Details"}
        subtitle={selectedCustomer?.customerNumber}
        maxWidth="xl"
      >
        {selectedCustomer && (
          <div className="p-5 space-y-5 text-xs">
            {/* Profile Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">District</span>
                  <span className="font-semibold text-slate-800">{selectedCustomer.district}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">KSEB Consumer #</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedCustomer.ksebConsumerNumber || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">KSEB Section</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomer.ksebSection || "Not assigned"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block mb-0.5">Address</span>
                <span className="text-slate-700">{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Linked Projects */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-blue-600" /> Linked Solar Projects ({selectedCustomer.projects?.length || 0})
              </h4>

              {(!selectedCustomer.projects || selectedCustomer.projects.length === 0) ? (
                <div className="text-slate-400 italic p-4 bg-slate-50 rounded-lg text-center">
                  No active solar project created for this customer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.projects.map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                          {proj.projectNumber} ({proj.systemSizeKw} kW)
                        </span>
                        <HealthBadge health={proj.overallStatus} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div>
                          Stage: <ProjectStageBadge stage={proj.currentStage} />
                        </div>
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          Open Project <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
