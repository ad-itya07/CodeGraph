import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "7.4 REST API & Integration Schema — CodeGraph Documentation",
  description: "Complete HTTP endpoints for repository ingestion, graph serialization, and analysis queries.",
};

export default function ApiReferencePage() {
  const nav = findDocItemByHref("/docs/reference/api");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="7.4"
        title="REST API & Integration Schema"
        summary="Complete HTTP specification for repository ingestion, full graph serialization, and algorithmic analytics queries."
        sourceFile="server/src/routes/"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Repository Endpoints (`/api/repositories`)
        </h2>

        <DocsTable
          headers={["Method & Route", "Description", "Auth Required"]}
          rows={[
            ["POST /api/repositories", "Ingest repository URL and start background analysis pipeline.", "Yes"],
            ["GET /api/repositories", "List all ingested repositories for the authenticated user.", "Yes"],
            ["GET /api/repositories/:id", "Retrieve metadata and analysis status for a repository.", "Yes"],
            ["GET /api/repositories/:id/graph", "Retrieve the complete serialized PersistedGraph { nodes, edges }.", "Yes"],
            ["GET /api/repositories/:id/overview", "Retrieve high-level statistics and the 6 Health Index metrics.", "Yes"],
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Analytics Endpoints (`/api/analytics`)
        </h2>

        <DocsTable
          headers={["Method & Route", "Query Parameters", "Algorithm / Response"]}
          rows={[
            ["GET /api/analytics/:id/analysis/impact", "sourceNodeId (string), maxDepth (opt)", "ImpactAnalysisResult { impactedNodeIds, depthByNode }"],
            ["GET /api/analytics/:id/analysis/dependencies", "sourceNodeId (string), maxDepth (opt)", "DependencyAnalysisResult { dependencyNodeIds, depthByNode }"],
            ["GET /api/analytics/:id/analysis/cycles", "types (opt)", "CycleAnalysisResult { cycles: Cycle[] }"],
            ["GET /api/analytics/:id/analysis/ordering", "sourceNodeId (string)", "DependencyOrderingResult { orderedNodeIds, isOrderable }"],
            ["GET /api/analytics/:id/analysis/paths", "sourceNodeId, targetNodeId", "CallPathResult { path: string[] | null }"],
          ]}
        />
      </section>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
