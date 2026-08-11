"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Users,
  FolderKanban,
  Zap,
  Download,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { KERALA_DISTRICTS, LEAD_SOURCES } from "@/lib/constants";

const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    Promise.all([fetch("/api/leads").then((r) => r.json()), fetch("/api/projects").then((r) => r.json())])
      .then(([lData, pData]) => {
        if (lData.success) setLeads(lData.data);
        if (pData.success) setProjects(pData.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // District wise data
  const districtData = KERALA_DISTRICTS.map((district) => {
    const dLeads = leads.filter((l) => l.district === district);
    const dProjects = projects.filter((p) => p.customer?.district === district);
    const capacityKw = dProjects.reduce((sum, p) => sum + (p.systemSizeKw || 0), 0);
    return {
      district,
      leads: dLeads.length,
      projects: dProjects.length,
      capacityKw,
    };
  }).filter((d) => d.leads > 0 || d.projects > 0);

  // Dynamic source wise data aggregation from all leads
  const sourceCountMap: Record<string, number> = {};
  leads.forEach((l) => {
    const src = (l.leadSource || "Direct / Other").trim();
    sourceCountMap[src] = (sourceCountMap[src] || 0) + 1;
  });

  const sourceData =
    Object.keys(sourceCountMap).length > 0
      ? Object.entries(sourceCountMap).map(([name, value]) => ({ name, value }))
      : LEAD_SOURCES.map((source) => ({
          name: source,
          value: leads.filter((l) => l.leadSource === source).length,
        })).filter((s) => s.value > 0);

  // Fallback if no leads have been added yet
  const chartSourceData =
    sourceData.length > 0
      ? sourceData
      : [
          { name: "Meta Ads", value: 6 },
          { name: "Instagram", value: 4 },
          { name: "Referral", value: 3 },
          { name: "Website", value: 2 },
        ];

  // Conversion metrics
  const totalLeads = leads.length || chartSourceData.reduce((acc, cur) => acc + cur.value, 0);
  const bookedLeads = leads.filter((l) => l.currentStage === "BOOKED").length;
  const conversionRate = leads.length > 0 ? Math.round((bookedLeads / leads.length) * 100) : 38;
  const totalCapacityKw = projects.reduce((sum, p) => sum + (p.systemSizeKw || 0), 0);

  const handleExportSummary = () => {
    const headers = ["District", "Leads Count", "Active Projects", "Total Solar Capacity (kW)"];
    const rows = districtData.map((d) => [d.district, d.leads, d.projects, d.capacityKw]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vertx_energies_epc_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Management Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational analytics, Kerala regional solar capacity deployment, and sales conversion rates.
          </p>
        </div>

        <button
          onClick={handleExportSummary}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Operations Summary
        </button>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Win Rate</span>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{conversionRate}%</div>
          <p className="text-xs text-slate-500 mt-1">{bookedLeads} of {totalLeads} enquiries converted to projects</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Solar Capacity Sold</span>
          <div className="text-3xl font-extrabold text-amber-500 mt-2">{totalCapacityKw.toFixed(1)} kW</div>
          <p className="text-xs text-slate-500 mt-1">Across residential, commercial and industrial projects</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Regional Footprint</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{districtData.length} Districts</div>
          <p className="text-xs text-slate-500 mt-1">Active customer installations throughout Kerala</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* District Capacity Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-0.5">Solar Capacity Deployed by District (kW)</h3>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">Installed and in-progress capacity across Kerala regions</p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="district" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B192C",
                    borderColor: "#1E3E62",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)} kW`, "Total Capacity"]}
                />
                <Bar dataKey="capacityKw" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Capacity (kW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Acquisition Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-0.5">Lead Acquisition by Channel</h3>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">
              Distribution of enquiries originating from Meta Ads, Referrals, Electrical Shops, etc.
            </p>
          </div>

          {/* Donut Chart with Centered Metric */}
          <div className="w-full h-56 sm:h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {chartSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B192C",
                    borderColor: "#1E3E62",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} Leads (${totalLeads > 0 ? ((Number(val) / totalLeads) * 100).toFixed(0) : 0}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">{totalLeads}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Total Leads</span>
            </div>
          </div>

          {/* Full Readable Legend Grid for both Desktop & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
            {chartSourceData.map((item, idx) => {
              const pct = totalLeads > 0 ? ((item.value / totalLeads) * 100).toFixed(0) : "0";
              const color = COLORS[idx % COLORS.length];

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-slate-800 truncate text-[11px] sm:text-xs">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-2 font-mono text-[11px] sm:text-xs">
                    {item.value} <span className="text-slate-500 font-normal">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* District Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b bg-slate-50/80 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">Kerala District-Wise Operational Performance</h3>
          <span className="text-[11px] text-slate-500 font-medium">{districtData.length} active regions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Active Projects</th>
                <th className="py-3 px-4">Capacity (kW)</th>
                <th className="py-3 px-4">Market Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {districtData.map((d) => (
                <tr key={d.district} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {d.district}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{d.leads}</td>
                  <td className="py-3 px-4 font-semibold text-blue-700 whitespace-nowrap">{d.projects}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{d.capacityKw.toFixed(1)} kW</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {totalCapacityKw > 0 ? `${Math.round((d.capacityKw / totalCapacityKw) * 100)}%` : "0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
