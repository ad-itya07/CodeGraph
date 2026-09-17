import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative rounded-3xl border border-accent/20 bg-surface overflow-hidden">

          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(6,182,212,0.08), transparent)",
            }}
          />

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #06b6d4 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 text-center py-20 px-6">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Ready to map your codebase?
            </h2>
            <p className="text-muted text-lg mb-10 max-w-xl mx-auto">
              Paste a GitHub URL. CodeGraph handles the rest — no setup, no config, no runtime required.
            </p>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-accent text-background font-bold text-base hover:bg-accent-light transition-all duration-200 shadow-xl shadow-accent/20 hover:shadow-accent/30"
            >
              Start Indexing
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
