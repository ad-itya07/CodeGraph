import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";

/* ─── Hero Section ─── */
export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 overflow-hidden">

      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(6,182,212,0.15), transparent)",
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--accent) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 text-center">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium tracking-wider uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Static Code Intelligence
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading text-foreground leading-[1.08] tracking-tight mb-6">
          See the structure{" "}
          <br className="hidden sm:block" />
          your IDE{" "}
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}>
            doesn&apos;t show you.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          CodeGraph parses JavaScript and TypeScript repositories into a queryable
          symbol graph. Built on graph theory, not AI guesswork.{" "}
          <span className="text-foreground/70">Every relationship is real. Every result is deterministic.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-background font-semibold text-base hover:bg-accent-light transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30"
          >
            Start Indexing
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-medium text-base hover:border-accent/40 hover:bg-surface transition-all duration-200"
          >
            <BookOpen size={18} className="text-muted" />
            View Documentation
          </Link>
        </div>

        {/* Hero Slideshow */}
        <HeroSlideshow />
      </div>
    </section>
  );
}
