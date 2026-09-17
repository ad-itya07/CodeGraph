"use client";

import { GitBranch, Database, FileCode2, Network } from "lucide-react";

interface EmptyStateProps {
  onAddRepository: () => void;
}

export function EmptyState({ onAddRepository }: EmptyStateProps) {
  return (
    <div className="p-12 rounded-2xl border border-border border-dashed bg-surface/30 flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto mt-6">
      <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <GitBranch size={24} className="text-accent" />
      </div>
      
      <h2 className="text-2xl font-bold font-heading text-foreground mb-3 tracking-tight">
        Your code graph starts here
      </h2>
      
      <p className="text-muted max-w-lg mx-auto mb-10 text-sm leading-relaxed">
        CodeGraph extracts a deep, queryable map of your repositories. 
        Submit a GitHub URL to start parsing its AST, discovering declarations, 
        mapping cross-file dependencies, and building a topological graph of your system.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left w-full max-w-2xl">
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface/50 border border-border/50">
          <Database size={18} className="text-muted mb-1" />
          <h3 className="text-sm font-semibold text-foreground">Entity Extraction</h3>
          <p className="text-xs text-subtle">
            Parses classes, functions, and symbols across your entire codebase.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface/50 border border-border/50">
          <Network size={18} className="text-muted mb-1" />
          <h3 className="text-sm font-semibold text-foreground">Relationship Mapping</h3>
          <p className="text-xs text-subtle">
            Connects imports, exports, inheritance, and direct function calls.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface/50 border border-border/50">
          <FileCode2 size={18} className="text-muted mb-1" />
          <h3 className="text-sm font-semibold text-foreground">Graph Analytics</h3>
          <p className="text-xs text-subtle">
            Computes coupling metrics, identifies cycles, and traces execution paths.
          </p>
        </div>
      </div>

      <button 
        onClick={onAddRepository}
        className="px-6 py-2.5 bg-accent text-background text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
      >
        Index Your First Repository
      </button>
    </div>
  );
}
