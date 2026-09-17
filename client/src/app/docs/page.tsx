import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Network, Activity, Cpu, FileCode } from "lucide-react";
import { DOCS_NAVIGATION } from "@/lib/docs-navigation";
import { DocsCallout } from "@/components/docs/DocsCallout";

export const metadata = {
  title: "CodeGraph Documentation — Architecture, Graph Engine & Metrics",
  description: "Comprehensive technical engineering documentation for the CodeGraph static analysis pipeline, canonical graph model, analytics suite, and health index.",
};

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "1": BookOpen,
  "2": Layers,
  "3": Network,
  "4": Activity,
  "5": Cpu,
  "6": Activity,
  "7": FileCode,
};

export default function DocsHomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="space-y-4 border-b border-border/80 pb-8">
        <div className="inline-flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface-elevated text-accent border border-border">
            Developer Documentation
          </span>
          <span className="text-[11px] font-mono text-muted">v0.1.0 Static Analysis Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
          CodeGraph Documentation
        </h1>
        <p className="text-base text-muted leading-relaxed max-w-3xl">
          CodeGraph transforms TypeScript and JavaScript repositories into a deterministic, queryable
          entity-relationship graph. This documentation details the end-to-end pipeline, AST extraction
          internals, graph query layer, traversal analytics, and structural health scoring models.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/docs/introduction/what-is-codegraph"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-medium text-xs sm:text-sm hover:bg-accent-light transition-colors"
          >
            <span>Start with Introduction</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/docs/architecture/system-overview"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-foreground font-medium text-xs sm:text-sm hover:border-border-highlight transition-colors"
          >
            <span>Explore Architecture</span>
          </Link>
        </div>
      </div>

      <DocsCallout type="note" title="Engineering System Documentation">
        This documentation is built directly from the source implementation in <code>server/src/</code>.
        It reflects the exact deterministic behavior of the AST parser, graph builder, analytics engine,
        and mathematical health scoring algorithms.
      </DocsCallout>

      {/* Grid of Sections */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground font-heading">
          Documentation Sections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCS_NAVIGATION.map((section) => {
            const Icon = SECTION_ICONS[section.number] || Layers;

            return (
              <div
                key={section.id}
                className="p-5 rounded-lg border border-border bg-surface-elevated/20 hover:bg-surface-elevated/40 hover:border-border-highlight transition-colors space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-accent">
                      Section {section.number}
                    </span>
                    <Icon size={16} className="text-muted group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground font-heading">
                    {section.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {section.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1">
                  {section.items.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center justify-between text-xs text-muted hover:text-foreground py-0.5 group/item"
                    >
                      <span className="truncate">
                        <span className="font-mono text-[10px] text-subtle mr-1.5">{item.number}</span>
                        {item.title}
                      </span>
                      <ArrowRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-2" />
                    </Link>
                  ))}
                  {section.items.length > 3 && (
                    <Link
                      href={section.items[0].href}
                      className="inline-block text-[11px] font-mono text-accent hover:underline pt-1"
                    >
                      + {section.items.length - 3} more subtopics...
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
