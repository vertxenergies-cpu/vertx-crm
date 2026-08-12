"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X, FolderKanban, Users, UserPlus, CheckSquare, Phone, ArrowRight } from "lucide-react";
import { Project, Customer, Lead, Task } from "@/types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    projects: Project[];
    customers: Customer[];
    leads: Lead[];
    tasks: Task[];
  }>({ projects: [], customers: [], leads: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Body Scroll Locking
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ projects: [], customers: [], leads: [], tasks: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], customers: [], leads: [], tasks: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!mounted || !isOpen) return null;

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasAnyResults =
    results.projects.length > 0 ||
    results.customers.length > 0 ||
    results.leads.length > 0 ||
    results.tasks.length > 0;

  const isBackdropMouseDownRef = useRef<boolean>(false);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    } else {
      isBackdropMouseDownRef.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && isBackdropMouseDownRef.current === true) {
      onClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] z-[110]"
        onMouseDown={(e) => {
          isBackdropMouseDownRef.current = false;
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          isBackdropMouseDownRef.current = false;
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer name, phone, project #, KSEB consumer #, loan app #..."
            className="w-full text-base outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-500 font-medium">Searching solar database...</div>
          )}

          {!loading && query && !hasAnyResults && (
            <div className="text-center py-8 text-sm text-slate-500">
              No matching customers, projects, or leads found for &ldquo;<strong>{query}</strong>&rdquo;.
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-xs text-slate-400">
              Type at least 2 letters or numbers to search across all leads, projects and customers.
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" /> Projects ({results.projects.length})
              </div>
              <div className="space-y-1.5">
                {results.projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleNavigate(`/projects/${p.id}`)}
                    className="p-3 rounded-lg hover:bg-blue-50/70 border border-transparent hover:border-blue-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                          {p.projectNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.customer?.name} ({p.systemSizeKw} kW)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Stage: <strong className="text-slate-700">{p.currentStage}</strong> | District: {p.customer?.district}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Customers ({results.customers.length})
              </div>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleNavigate(`/customers`)}
                    className="p-3 rounded-lg hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">
                          {c.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {c.customerNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phone: {c.phone} | KSEB Consumer #: {c.ksebConsumerNumber || "Not entered"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads Results */}
          {results.leads.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Leads ({results.leads.length})
              </div>
              <div className="space-y-1.5">
                {results.leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => handleNavigate(`/leads`)}
                    className="p-3 rounded-lg hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                          {l.customerName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {l.leadNumber} ({l.estimatedSystemSizeKw} kW)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Stage: {l.currentStage} | District: {l.district} | Source: {l.leadSource}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" /> Tasks ({results.tasks.length})
              </div>
              <div className="space-y-1.5">
                {results.tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleNavigate(`/tasks`)}
                    className="p-3 rounded-lg hover:bg-amber-50/70 border border-transparent hover:border-amber-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-amber-700">
                        {t.title}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: {t.status} | Priority: {t.priority}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Search solar leads, projects, KSEB details across Kerala</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
