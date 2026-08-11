import React from "react";
import Link from "next/link";
import { LogIn, ArrowRight, Zap, CheckCircle2, ShieldCheck } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Industry Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 font-bold">KSEB & Soura EPC Lifecycle</span>
          <span className="text-slate-500">•</span>
          <span>Purpose-Built for Kerala Solar Operations</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Run Your Solar Business{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300">
            From One Place.
          </span>
        </h1>

        {/* Concise Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          From the first lead to installation, KSEB, subsidy and project completion — manage your entire solar operation in one system.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer group"
          >
            <LogIn className="w-4 h-4" />
            <span>Login to CRM</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm transition-all"
          >
            <span>Explore Platform</span>
          </a>
        </div>

        {/* Core Value Pillars Badge Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-5xl mx-auto text-xs font-semibold text-slate-300">
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Solar Sales</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Customer KYC</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Project Operations</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>KSEB Tracking</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Team Accountability</span>
          </div>
        </div>
      </div>
    </section>
  );
}
