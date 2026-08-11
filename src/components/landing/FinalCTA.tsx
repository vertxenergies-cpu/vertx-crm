import React from "react";
import Link from "next/link";
import { LogIn, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function LandingFinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center relative overflow-hidden border-t border-slate-800">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Operations Command Center
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Ready to run your solar operations in one place?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          Sign in with your authorized employee credentials to access leads, customer installations, KSEB filings, and daily duties.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer group"
          >
            <LogIn className="w-4 h-4" />
            <span>Login to CRM</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
