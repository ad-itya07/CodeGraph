import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "6.7 Module Isolation Health (7%) — CodeGraph Documentation",
  description: "Proportion of unresolved module nodes (built-ins) relative to total graph nodes.",
};

export default function ModuleHealthPage() {
  const nav = findDocItemByHref("/docs/health/module-health");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="6.7"
        title="Module Isolation Health (7%)"
        summary="Measuring the proportion of unresolved module nodes (Node.js built-ins) relative to total graph entities."
        sourceFile="server/src/analytics/health/modules/calculateModuleHealth.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          What Are Module Nodes?
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In CodeGraph, a <strong className="text-foreground">Module Node</strong> represents an entity in an <code>import</code> statement
          that the extraction pipeline <strong className="text-foreground">failed to resolve</strong> to either a local repository source file
          (via relative paths or path aliases) or a declared third-party dependency in <code>package.json</code>.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          When the Relationship Extractor encounters an import statement, it follows this resolution order:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Relative / Aliased File</strong>: Matches an internal file in the repository &rarr; creates a <code>FileNode</code> target.</li>
          <li><strong>Declared Dependency</strong>: Package name is found in <code>package.json</code> <code>dependencies</code> or <code>devDependencies</code> &rarr; creates a <code>DependencyNode</code> target.</li>
          <li><strong>Unresolved Fallback</strong>: Any import target that fails both lookups above &rarr; creates a <code>ModuleNode</code> target.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Why Module Nodes Occur & Why They Have Low Weight (7%)
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Module nodes typically appear in two common scenarios:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-2 pl-2">
          <li>
            <strong className="text-foreground">Node.js Built-in Modules</strong>: Imports like <code>import fs from &quot;fs&quot;</code>, <code>import path from &quot;node:path&quot;</code>, or <code>import crypto from &quot;crypto&quot;</code>. These are native platform APIs provided by the runtime environment and are intentionally omitted from <code>package.json</code>.
          </li>
          <li>
            <strong className="text-foreground">Unlisted or Implicit Dependencies</strong>: Imports of packages not explicitly declared in the nearest manifest (e.g., peer dependencies, workspace packages, or missing dependencies).
          </li>
        </ul>

        <DocsCallout type="note" title="Why 7% Weightage?">
          Because Module nodes frequently represent perfectly valid platform imports (like Node.js built-ins) rather than genuine codebase defects, Module Health is assigned the <strong className="text-foreground">lowest weight (7%)</strong> in the overall Health Index ($H$). A high proportion of module nodes indicates incomplete graph resolution rather than severe architectural degradation.
        </DocsCallout>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Module Ratio Calculation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The calculator measures the ratio of module nodes to the total node population in the canonical graph and scores it linearly:
        </p>

        <DocsCodeBlock
          filename="server/src/analytics/health/modules/calculateModuleHealth.ts"
          language="typescript"
          code={`export function calculateModuleHealth(graph: Graph): ModuleHealthResult {
    const moduleCount = graph.nodesByKind.get("module")?.size ?? 0;
    const totalNodeCount = graph.nodes.size;

    if (totalNodeCount === 0) {
        return {
            score: 100,
            moduleCount: 0,
            totalNodeCount: 0,
            moduleRatio: 0,
        };
    }

    const moduleRatio = moduleCount / totalNodeCount;

    // Linear health score: 100 * (1 - moduleRatio)
    const score = 100 * (1 - moduleRatio);

    return {
        score,
        moduleCount,
        totalNodeCount,
        moduleRatio,
    };
}`}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
