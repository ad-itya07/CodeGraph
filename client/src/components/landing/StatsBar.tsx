const stats = [
  {
    value: "7",
    label: "Relationship Types",
    details: ["Calls", "Imports", "Exports", "Extends", "Implements", "Instantiates", "References"],
  },
  {
    value: "8",
    label: "Symbol Kinds",
    details: ["Function", "Method", "Class", "Interface", "Variable", "Enum", "TypeAlias", "ObjectProperty"],
  },
  {
    value: "5",
    label: "Graph Analyzers",
    details: ["Impact Analysis", "Dependencies", "Call Paths", "Cycle Detection", "Topological Ordering"],
  },
  {
    value: "6",
    label: "Health Metrics",
    details: ["Cycles", "Coupling", "Fan-Out", "Fan-In", "Dependencies", "Modularity"],
  },
  {
    value: "4",
    label: "Core Algorithms",
    details: ["Tarjan's SCC", "Kahn's Sort", "Bidirectional BFS", "Iterative DFS"],
  },
];

export default function StatsBar() {
  return (
    <div className="border-y border-border bg-surface/40 relative z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={stat.label} className="relative group">
              <div className="flex flex-col items-center justify-center min-w-[140px] px-4 py-4 rounded-2xl bg-surface/50 border border-border shadow-sm cursor-help transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:shadow-accent/10 group-hover:border-accent/30 group-hover:bg-surface">
                <div className="text-3xl font-bold text-accent font-mono">{stat.value}</div>
                <div className="text-xs text-muted mt-1 tracking-wide transition-colors duration-300 group-hover:text-foreground">
                  {stat.label}
                </div>
              </div>
              
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50">
                <div className="bg-surface-elevated border border-border rounded-xl shadow-xl p-3 flex flex-col gap-1.5 backdrop-blur-md">
                  {stat.details.map((detail) => (
                    <div key={detail} className="text-xs font-mono text-muted text-left flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent/50" />
                      {detail}
                    </div>
                  ))}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
