import React from "react";
import Link from "next/link";
import { CompanyLogoMark } from "@/components/ui/CompanyLogo";
import { LogIn, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <CompanyLogoMark size={36} className="bg-white/95 shadow-sm" />
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                KERALA<span className="text-blue-400">SOLAR</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                CRM + OPERATIONS • VERTX ENERGIES
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#lifecycle" className="hover:text-white transition">Solar Lifecycle</a>
            <a href="#my-work" className="hover:text-white transition">My Work</a>
            <a href="#security" className="hover:text-white transition">Security & Roles</a>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
              Employee Login <LogIn className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Kerala Solar CRM • Vertx Energies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.vertxenergies.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition flex items-center gap-1"
            >
              www.vertxenergies.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
