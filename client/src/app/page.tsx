import type { Metadata } from "next";
import Navbar           from "@/components/landing/Navbar";
import HeroSection      from "@/components/landing/HeroSection";
import StatsBar         from "@/components/landing/StatsBar";
import FeaturesSection  from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AlgorithmsSection from "@/components/landing/AlgorithmsSection";
import UseCasesSection  from "@/components/landing/UseCasesSection";
import CTASection       from "@/components/landing/CTASection";
import Footer           from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "CodeGraph — Static Code Intelligence for JS/TS",
  description:
    "CodeGraph parses JavaScript and TypeScript repositories into a queryable symbol graph. Impact analysis, cycle detection, call path exploration, and structural health — built on graph theory, not AI.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <AlgorithmsSection />
      <UseCasesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
