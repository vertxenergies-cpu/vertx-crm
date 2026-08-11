"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompanyLogoMark } from "@/components/ui/CompanyLogo";
import { LogIn, Menu, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <CompanyLogoMark size={36} className="bg-white/95 shadow-sm group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              KERALA<span className="text-blue-400">SOLAR</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              CRM + OPERATIONS
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#lifecycle" className="hover:text-white transition-colors">
            Solar Lifecycle
          </a>
          <a href="#my-work" className="hover:text-white transition-colors">
            My Work
          </a>
          <a href="#visibility" className="hover:text-white transition-colors">
            Visibility
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Security & Roles
          </a>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login to CRM</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-5 space-y-4 animate-fadeIn">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-400 transition"
            >
              Features
            </a>
            <a
              href="#lifecycle"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-400 transition"
            >
              Solar Lifecycle
            </a>
            <a
              href="#my-work"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-400 transition"
            >
              My Work
            </a>
            <a
              href="#visibility"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-400 transition"
            >
              Visibility & Management
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-400 transition"
            >
              Security & Roles
            </a>
          </nav>

          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to CRM</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
