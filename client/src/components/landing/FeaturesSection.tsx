import {
  Zap, RefreshCw, Route, Activity, ListOrdered, Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  hook: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Impact Analysis",
    hook: "Change one function. Know exactly what breaks.",
    description:
      "BFS backward-traversal from any symbol surfaces every affected node, at every depth across the entire repository — before you touch a line.",
  },
  {
    icon: RefreshCw,
    title: "Cycle Detection",
    hook: "Find circular dependencies before they find you.",
    description:
      "Tarjan's SCC algorithm identifies every circular group — across file imports, call chains, inheritance, implementation, and instantiation.",
  },
  {
    icon: Route,
    title: "Call Path Explorer",
    hook: "Trace any execution path in your codebase.",
    description:
      "DFS with backtracking finds the exact call chain between any two symbols, or confirms definitively that no path exists.",
  },
  {
    icon: Activity,
    title: "Structural Health Index",
    hook: "A score that shows its work.",
    description:
      "Six independently weighted structural metrics produce a 0–100 health index. Every sub-score is exposed — not a black box.",
  },
  {
    icon: ListOrdered,
    title: "Dependency Ordering",
    hook: "Know what initializes before what.",
    description:
      "Kahn's topological sort produces a valid initialization order for any symbol's dependency subgraph — and detects when cycles make it impossible.",
  },
  {
    icon: Network,
    title: "Full Symbol Graph",
    hook: "Every relationship, mapped.",
    description:
      "8 symbol kinds, 7 relationship types, cross-file resolution with tsconfig path alias support. The graph reflects what your code actually does.",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="group relative rounded-2xl border border-border bg-surface p-6 hover:border-accent/30 hover:bg-surface-elevated transition-all duration-300">
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 0 40px rgba(6,182,212,0.04)" }} />

      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
          <Icon size={18} className="text-accent" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold mb-1">{feature.title}</h3>
          <p className="text-accent text-sm font-medium mb-2">{feature.hook}</p>
          <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-muted text-xs font-medium tracking-wider uppercase mb-4">
            Capabilities
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
            Everything your codebase{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #06b6d4, #22d3ee)" }}>
              wants to tell you
            </span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Six distinct analytical lenses on the same underlying graph. Each one answers a question your IDE can&apos;t.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
