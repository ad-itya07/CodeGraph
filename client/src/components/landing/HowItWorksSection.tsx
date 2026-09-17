import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Submit a GitHub URL",
    description:
      "Paste any public JavaScript or TypeScript repository URL. CodeGraph clones it and captures the exact commit SHA for reproducible deep-linking.",
  },
  {
    number: "02",
    title: "Parse the AST",
    description:
      "Babel parses every source file into an abstract syntax tree. A two-pass traversal first extracts all named symbols, then maps every structural relationship between them.",
  },
  {
    number: "03",
    title: "Build the Graph",
    description:
      "Nodes and edges are indexed into five maps — by ID, by kind, by source, and by target — enabling O(1) lookup in every direction across the entire codebase.",
  },
  {
    number: "04",
    title: "Run the Analyzers",
    description:
      "Tarjan's SCC, Kahn's topological sort, BFS traversal, and DFS path-finding run on the complete in-memory graph. Structural health is computed across six independent metrics.",
  },
  {
    number: "05",
    title: "Explore",
    description:
      "The full symbol graph, health index, impact and dependency analysis, cycle reports, and dependency ordering are persisted and ready to query — instantly.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-surface/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-muted text-xs font-medium tracking-wider uppercase mb-4">
            The Pipeline
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
            How it works
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            From a GitHub URL to a queryable code graph — five deterministic steps, no runtime required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-accent/40 via-border to-transparent hidden md:block" />

          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-6">

                {/* Number bubble */}
                <div className="shrink-0 w-14 h-14 rounded-full border border-accent/30 bg-surface flex items-center justify-center z-10">
                  <span className="text-accent font-bold text-sm font-mono">{step.number}</span>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <h3 className="text-foreground font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Docs CTA */}
        <div className="text-center mt-14">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors group"
          >
            Want the full implementation details?
            <span className="text-accent group-hover:underline">Read the pipeline documentation</span>
            <ArrowRight size={14} className="text-accent group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
