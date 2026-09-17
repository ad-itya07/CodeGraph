import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

/* ─── Decorative graph SVG (hero visual) ─── */
function GraphVisual() {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-16 select-none pointer-events-none">
      {/* Glow behind the graph */}
      <div
        className="absolute inset-0 rounded-2xl blur-3xl opacity-20"
        style={{ background: "radial-gradient(ellipse at center, #06b6d4 0%, transparent 70%)" }}
      />

      {/* Graph card */}
      <div className="relative rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-6 overflow-hidden">

        {/* Top bar — fake window chrome */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-danger/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
          <div className="ml-3 flex-1 h-5 bg-surface-elevated rounded px-3 flex items-center">
            <span className="text-subtle text-xs font-mono">codegraph / explore</span>
          </div>
        </div>

        {/* SVG graph */}
        <svg
          viewBox="0 0 700 260"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#06b6d4" opacity="0.4" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {[
            [350,130, 180, 60],
            [350,130, 520, 60],
            [350,130, 150,200],
            [350,130, 550,200],
            [350,130,  80,130],
            [350,130, 620,130],
            [180, 60, 550,200],
            [520, 60, 150,200],
          ].map(([x1,y1,x2,y2], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#06b6d4" strokeWidth="1"
              opacity="0.18"
              markerEnd="url(#arrow)"
            />
          ))}

          {/* Satellite nodes — symbols */}
          {([
            [180, 60,  "UserService",  "#06b6d4", 5, "symbol"],
            [520, 60,  "AuthMiddleware","#06b6d4", 5, "symbol"],
            [150, 200, "validateToken", "#22d3ee", 4, "symbol"],
            [550, 200, "hashPassword",  "#22d3ee", 4, "symbol"],
          ] as const).map(([cx, cy, label, fill, r, kind]) => (
            <g key={label}>
              <circle cx={cx} cy={cy} r={Number(r) + 8} fill={fill as string} opacity="0.06" />
              <circle cx={cx} cy={cy} r={r} fill={fill as string} filter="url(#glow)" />
              <text x={cx} y={Number(cy) + 18} textAnchor="middle" fontSize="9" fill="#5b7fa3" fontFamily="monospace">
                {label}
              </text>
              <text x={cx} y={Number(cy) + 27} textAnchor="middle" fontSize="7" fill="#2d4a6b" fontFamily="monospace">
                {kind}
              </text>
            </g>
          ))}

          {/* Dependency nodes */}
          {([
            [80,  130, "express",  "#f59e0b"],
            [620, 130, "jsonwebtoken", "#f59e0b"],
          ] as const).map(([cx, cy, label, fill]) => (
            <g key={label}>
              <circle cx={cx} cy={cy} r={4} fill={fill as string} opacity="0.8" />
              <circle cx={cx} cy={cy} r={12} fill={fill as string} opacity="0.06" />
              <text x={cx} y={Number(cy) + 18} textAnchor="middle" fontSize="8" fill="#5b7fa3" fontFamily="monospace">
                {label}
              </text>
              <text x={cx} y={Number(cy) + 27} textAnchor="middle" fontSize="7" fill="#2d4a6b" fontFamily="monospace">
                dependency
              </text>
            </g>
          ))}

          {/* Central node — file */}
          <circle cx="350" cy="130" r="24" fill="#06b6d4" opacity="0.08" />
          <circle cx="350" cy="130" r="16" fill="#06b6d4" opacity="0.12" />
          <circle cx="350" cy="130" r="8"  fill="#06b6d4" filter="url(#glow)" />
          <text x="350" y="158" textAnchor="middle" fontSize="10" fill="#e2eeff" fontFamily="monospace" fontWeight="500">
            auth.service.ts
          </text>
          <text x="350" y="169" textAnchor="middle" fontSize="8" fill="#5b7fa3" fontFamily="monospace">
            file
          </text>
        </svg>

        {/* Bottom stats row */}
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-xs font-mono">
          <span className="text-muted">6 <span className="text-subtle">nodes</span></span>
          <span className="text-muted">8 <span className="text-subtle">edges</span></span>
          <span className="text-accent">2 <span className="text-muted">cycles detected</span></span>
          <span className="ml-auto text-subtle">health: <span className="text-success">87</span>/100</span>
        </div>
      </div>
    </div>
  );
}

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
              "radial-gradient(circle, #06b6d4 1px, transparent 1px)",
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
            style={{ backgroundImage: "linear-gradient(135deg, #06b6d4, #22d3ee)" }}>
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

        {/* Graph visual */}
        <GraphVisual />
      </div>
    </section>
  );
}
