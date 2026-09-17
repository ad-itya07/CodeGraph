import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "1.2 Getting Started — CodeGraph Documentation",
  description: "How to ingest repositories, trigger static analysis, and query repository graph analytics.",
};

export default function GettingStartedPage() {
  const nav = findDocItemByHref("/docs/introduction/getting-started");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="1.2"
        title="Getting Started"
        summary="Learn how a codebase enters the CodeGraph pipeline, how the backend parses and indexes the graph, and how to query repository metrics."
        sourceFile="server/src/routes/repository.routes.ts"
      />

      {/* Ingestion Flow */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          1. Ingesting a Repository
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Repositories enter the CodeGraph platform via the REST API or Dashboard. When you submit a repository
          URL or directory path, the backend clones or resolves the repository and initiates the pipeline:
        </p>

        <DocsCodeBlock
          filename="POST /api/repositories"
          language="json"
          code={`// Request Body
{
  "url": "https://github.com/facebook/react"
}

// Response: 201 Created
{
  "success": true,
  "message": "Repository created successfully",
  "data": {
    "_id": "65fc9a1e0b12a84d",
    "name": "react",
    "status": "completed",
    "createdAt": "2026-09-17T12:00:00.000Z"
  }
}`}
        />
      </section>

      {/* Querying the Graph */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          2. Retrieving the Graph & Overview
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Once the status is <code>completed</code>, the entire canonical graph and high-level architectural
          statistics are available for querying:
        </p>

        <DocsCodeBlock
          filename="GET /api/repositories/:id/overview"
          language="json"
          code={`{
  "success": true,
  "data": {
    "statistics": {
      "fileCount": 142,
      "symbolCount": 864,
      "relationshipCount": 1892,
      "dependencyCount": 18,
      "moduleCount": 6
    },
    "health": {
      "index": 84.6,
      "metrics": {
        "cycles": { "score": 99.6, "cycleCount": 1 },
        "coupling": { "score": 90.9, "averageStructuralDegree": 1.88 },
        "fanOut": { "score": 66.8, "rootMeanSquareFanOut": 0.99 },
        "fanIn": { "score": 85.3, "rootMeanSquareFanIn": 0.34 },
        "dependency": { "score": 65.2, "averageDependenciesPerFile": 1.07 },
        "modules": { "score": 99.9, "moduleRatio": 0.00069 }
      }
    }
  }
}`}
        />
      </section>

      {/* Running Analytics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          3. Querying Graph Analytics
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          You can run granular algorithmic queries directly against any node ID in the graph:
        </p>

        <DocsTable
          headers={["Endpoint", "Algorithm / Query", "Purpose"]}
          rows={[
            ["GET /api/analytics/:id/analysis/impact?sourceNodeId=...", "Backward BFS Traversal", "Calculates all upstream files and symbols impacted by a change."],
            ["GET /api/analytics/:id/analysis/dependencies?sourceNodeId=...", "Forward BFS Traversal", "Discovers transitive downstream dependencies with hop depth."],
            ["GET /api/analytics/:id/analysis/cycles", "Tarjan's SCC Algorithm", "Detects circular imports and mutual function recursion across 5 projections."],
            ["GET /api/analytics/:id/analysis/ordering?sourceNodeId=...", "Kahn's Topological Sort", "Produces a safe linear initialization sequence for symbols."],
            ["GET /api/analytics/:id/analysis/paths?sourceNodeId=...&targetNodeId=...", "Iterative DFS with Backtracking", "Finds the exact point-to-point call chain between two functions."],
          ]}
        />
      </section>

      <DocsCallout type="note" title="Next Steps">
        To understand the internal pipeline stages that transform code on disk into this queryable graph,
        proceed to <Link href="/docs/architecture/system-overview" className="text-accent underline">Section 2.1: System Overview</Link>.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
