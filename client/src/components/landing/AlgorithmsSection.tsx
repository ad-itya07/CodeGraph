import Link from "next/link";
import { ArrowRight } from "lucide-react";

const algorithms = [
  {
    name: "Tarjan's SCC",
    complexity: "O(V + E)",
    question: "Where are the cycles?",
    description:
      "Strongly connected components algorithm identifies every circular dependency group. Runs across 5 relationship projections — file imports, symbol calls, inheritance, implementation, and instantiation.",
    detail: "Runs 5× per repository",
  },
  {
    name: "Kahn's Algorithm",
    complexity: "O(V + E)",
    question: "What's the initialization order?",
    description:
      "Topological sort with cycle detection built in. Produces a dependency-first ordering for any symbol's subgraph, and when ordering is impossible, isOrderable: false tells you exactly why.",
    detail: "Topological ordering",
  },
  {
    name: "Bidirectional BFS",
    complexity: "O(V + E)",
    question: "What does this break?",
    description:
      "Forward BFS for dependency traversal, backward BFS for impact analysis. Both return every affected node with its exact depth from the source — not just a list, but a map.",
    detail: "Depth-tracked traversal",
  },
  {
    name: "Iterative DFS",
    complexity: "O(V + E)",
    question: "Is there a path?",
    description:
      "Depth-first search with explicit path reconstruction. Finds any call chain between two symbols, or confirms no path exists. No recursion — iterative stack to handle arbitrarily deep graphs.",
    detail: "Path reconstruction",
  },
];

export default function AlgorithmsSection() {
  return (
    <section id="algorithms" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-muted text-xs font-medium tracking-wider uppercase mb-4">
            Under the Hood
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
            Built on{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #06b6d4, #22d3ee)" }}>
              computer science
            </span>
            , not guesswork
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Every analysis in CodeGraph is backed by a classical graph algorithm. No inference, no approximation — just deterministic results.
          </p>
        </div>

        {/* Algorithm grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {algorithms.map((algo) => (
            <div
              key={algo.name}
              className="group rounded-2xl border border-border bg-surface p-6 hover:border-accent/30 transition-all duration-300"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-accent font-bold font-mono text-lg">{algo.name}</h3>
                  <p className="text-subtle text-xs font-mono mt-0.5">{algo.complexity}</p>
                </div>
                <span className="text-xs text-muted border border-border rounded-full px-2.5 py-1 font-mono">
                  {algo.detail}
                </span>
              </div>

              {/* Question */}
              <p className="text-foreground font-semibold text-sm mb-2 italic">
                &ldquo;{algo.question}&rdquo;
              </p>

              {/* Description */}
              <p className="text-muted text-sm leading-relaxed">{algo.description}</p>
            </div>
          ))}
        </div>

        {/* Link to docs */}
        <div className="text-center mt-12">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors group"
          >
            Read the full algorithm documentation
            <ArrowRight size={14} className="text-accent group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
