import React from "react";
import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/Navbar";
import { LandingHero } from "@/components/landing/Hero";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { LandingFeatures } from "@/components/landing/Features";
import { LandingSolarLifecycle } from "@/components/landing/SolarLifecycle";
import { LandingWhyThisCRM } from "@/components/landing/WhyThisCRM";
import { LandingMyWorkPreview } from "@/components/landing/MyWorkPreview";
import { LandingProjectVisibility } from "@/components/landing/ProjectVisibility";
import { LandingManagementSection } from "@/components/landing/ManagementSection";
import { LandingSecurityAndRoles } from "@/components/landing/SecurityAndRoles";
import { LandingFinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Kerala Solar CRM | Solar CRM & Project Operations",
  description: "Manage solar leads, customers, projects, KSEB processes, installation, duties and team operations from one platform.",
  openGraph: {
    title: "Kerala Solar CRM | Solar CRM & Project Operations",
    description: "Manage solar leads, customers, projects, KSEB processes, installation, duties and team operations from one platform.",
    url: "https://www.vertxenergies.com",
    siteName: "Kerala Solar CRM",
    locale: "en_IN",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Public Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <LandingHero />

      {/* Real Software Product Mockup */}
      <ProductPreview />

      {/* Everything Your Solar Team Needs (6 Feature Cards) */}
      <LandingFeatures />

      {/* From Lead to Solar Commissioning (10-Stage Milestone Pipeline) */}
      <LandingSolarLifecycle />

      {/* Built Around How Solar Projects Actually Move */}
      <LandingWhyThisCRM />

      {/* My Work Section (Employee Accountability) */}
      <LandingMyWorkPreview />

      {/* Project Health & Pipeline Visibility */}
      <LandingProjectVisibility />

      {/* Know What Needs Attention (Management Section) */}
      <LandingManagementSection />

      {/* Security & Role-Based Access Control */}
      <LandingSecurityAndRoles />

      {/* Final Action CTA */}
      <LandingFinalCTA />

      {/* Public Footer */}
      <LandingFooter />
    </div>
  );
}
