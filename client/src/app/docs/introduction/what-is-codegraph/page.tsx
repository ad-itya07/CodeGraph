import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "1.1 What is CodeGraph? — CodeGraph Documentation",
  description: "Introduction to CodeGraph, its core architectural purpose, inputs, outputs, and design invariants.",
};

export default function WhatIsCodeGraphPage() {
  const nav = findDocItemByHref("/docs/introduction/what-is-codegraph");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="1.1"
        title="What is CodeGraph?"
        summary="A high-performance, deterministic static analysis platform that converts JavaScript and TypeScript repositories into queryable, typed entity-relationship graphs."
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Problem: Codebase Invisibility
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Modern JavaScript and TypeScript applications grow quickly into interconnected webs of files,
          classes, functions, interfaces, and external npm packages. When engineers make changes or refactor
          code, they frequently encounter questions that standard language servers and text search cannot
          answer authoritatively:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong className="text-foreground">Upstream blast radius</strong>: <em>"If I change the signature of this utility function, which 14 files and 32 callers will be broken across the monorepo?"</em></li>
          <li><strong className="text-foreground">Downstream closure</strong>: <em>"What is the exact transitive dependency closure needed to run this module in isolation?"</em></li>
          <li><strong className="text-foreground">Architectural cycles</strong>: <em>"Where are the circular imports creating subtle runtime initialization bugs or bundling bloat?"</em></li>
          <li><strong className="text-foreground">Structural hotspots</strong>: <em>"Which classes act as bottleneck 'God objects' with excessive incoming and outgoing coupling?"</em></li>
        </ul>
      </section>

      {/* What CodeGraph Is */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          What CodeGraph Is
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph is a <strong className="text-foreground">structural fact graph</strong> generator and
          analytics engine. It scans your repository on disk, compiles modern JS/TS files into Abstract Syntax
          Trees (ASTs), extracts typed declarations, resolves import and call bindings, and builds an in-memory
          indexed directed graph.
        </p>

        <DocsTable
          headers={["Dimension", "How CodeGraph Treats It"]}
          rows={[
            ["Input", "A directory path to any JavaScript or TypeScript codebase."],
            ["Output", "A canonical 5-map in-memory Graph containing typed nodes and directed edges."],
            ["Determinism", "Given the exact same repository files, the pipeline produces identical node IDs, edge IDs, and metrics."],
            ["Execution Mode", "100% static analysis — no code is ever executed or evaluated at runtime."],
            ["Persistence", "Serializes into compact JSON node/edge lists that reconstruct the 5-index graph instantly."],
          ]}
        />
      </section>

      {/* What CodeGraph Is NOT */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          What CodeGraph Is Not
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          To maintain strict architectural boundaries and precision, CodeGraph establishes clear limits:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>Not a dynamic runtime profiler</strong>: CodeGraph does not execute your code or observe CPU/memory usage.</li>
          <li><strong>Not an LLM-based hallucination engine</strong>: Graph edges are mathematically proven from AST bindings, not guessed by AI models.</li>
          <li><strong>Not a generic text searcher</strong>: Queries follow semantic graph paths, not raw string matches.</li>
        </ul>
      </section>

      <DocsCallout type="tip" title="Canonical Architecture Transformation">
        The entire transformation flows strictly in one direction:
        <br />
        <code>Raw Repository → Discovery Walker → AST Generation → Metadata & Symbols → Relationship Linking → Canonical Graph → Analytics Engine → Health Index</code>
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
