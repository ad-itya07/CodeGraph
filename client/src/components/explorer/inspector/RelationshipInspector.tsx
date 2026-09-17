"use client";

import {
  Network,
  ArrowRight,
  ExternalLink,
  FileCode2,
} from "lucide-react";
import { formatGitHubUrl } from "@/lib/explorer/github";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";
import { getRelationshipBadgeColor } from "../RelationshipsView";
import { getSymbolKindIcon } from "../SymbolsView";
import { FolderTree } from "lucide-react";
import type { Repository, GraphEdge, GraphNode } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface RelationshipInspectorProps {
  repository: Repository | null | undefined;
  relationship: GraphEdge;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onOpenInExplorer?: (entityId: string) => void;
}

function renderEntityCard(
  node: GraphNode | undefined,
  nodeId: string,
  labelRole: string,
  data: NormalizedExplorerData,
  repository: Repository | null | undefined,
  onSelectEntity: (id: string) => void,
  onOpenInExplorer?: (id: string) => void
) {
  if (!node) {
    return (
      <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
        <span className="text-[10px] text-subtle uppercase block mb-1">{labelRole}</span>
        <span className="text-foreground font-semibold truncate block">{nodeId}</span>
      </div>
    );
  }

  let name = nodeId;
  let file: string | null = null;
  let locationText: string | null = null;
  let githubUrl: string | null = null;

  if (node.kind === "symbol") {
    name = node.name;
    const fileNode = data.filesById.get(node.fileId);
    const rawFilePath = fileNode?.filePath || node.fileId.replace(/^file:/, "");
    file = getRepositoryRelativePath(rawFilePath, repository?.id);
    locationText = `L${node.location.startLine}:${node.location.startColumn}`;
    githubUrl = fileNode
      ? formatGitHubUrl(
          repository?.url,
          repository?.commitSha,
          fileNode.filePath,
          node.location,
          repository?.id
        )
      : null;
  } else if (node.kind === "file") {
    const relPath = getRepositoryRelativePath(node.filePath, repository?.id);
    name = relPath.split("/").pop() || relPath;
    file = relPath;
    githubUrl = formatGitHubUrl(
      repository?.url,
      repository?.commitSha,
      node.filePath,
      undefined,
      repository?.id
    );
  } else if (node.kind === "dependency") {
    name = node.name;
    file = node.packageJsonPath ? getRepositoryRelativePath(node.packageJsonPath, repository?.id) : null;
  } else if (node.kind === "module") {
    name = node.name;
  }

  return (
    <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-subtle uppercase font-semibold">{labelRole}</span>
        <span className="text-[10px] text-muted capitalize">{node.kind}</span>
      </div>

      <div className="flex items-center justify-between gap-1">
        <button
          onClick={() => onSelectEntity(node.id)}
          className="text-left font-bold text-foreground hover:text-accent hover:underline truncate text-xs flex items-center gap-1.5 cursor-pointer min-w-0 flex-1"
        >
          {node.kind === "symbol" ? (
            getSymbolKindIcon(node.symbolKind, node.methodKind)
          ) : (
            <FileCode2 size={13} className="text-blue-400 shrink-0" />
          )}
          <span className="truncate">{name}</span>
        </button>

        {onOpenInExplorer && (node.kind === "symbol" || node.kind === "file") && (
          <button
            onClick={() => onOpenInExplorer(node.id)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface hover:bg-surface-elevated border border-border text-[10px] text-muted hover:text-foreground shrink-0 cursor-pointer transition-colors"
            title="Open in Explorer"
          >
            <FolderTree size={11} className="text-accent" />
            <span>Open</span>
          </button>
        )}
      </div>

      {file && (
        <div className="text-[10px] text-muted truncate" title={file}>
          <span className="text-subtle">In: </span>
          {file}
        </div>
      )}

      {locationText && (
        <div className="text-[10px] text-subtle">
          Location: {locationText}
        </div>
      )}

      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline pt-1"
        >
          <span>View code on GitHub</span>
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

export function RelationshipInspector({
  repository,
  relationship,
  data,
  onSelectEntity,
  onOpenInExplorer,
}: RelationshipInspectorProps) {
  const sourceNode = data.nodesById.get(relationship.sourceId);
  const targetNode = data.nodesById.get(relationship.targetId);

  return (
    <div className="p-4 space-y-5 text-xs font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Network size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground font-heading">
              Relationship Edge
            </h3>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded border capitalize inline-block mt-0.5 ${getRelationshipBadgeColor(
                relationship.relationshipKind
              )}`}
            >
              {relationship.relationshipKind}
            </span>
          </div>
        </div>
      </div>

      {/* Source Entity */}
      {renderEntityCard(
        sourceNode,
        relationship.sourceId,
        "Source Entity",
        data,
        repository,
        onSelectEntity,
        onOpenInExplorer
      )}

      {/* Direction Arrow */}
      <div className="flex items-center justify-center text-muted">
        <div className="w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
          <ArrowRight size={12} className="text-accent" />
        </div>
      </div>

      {/* Target Entity */}
      {renderEntityCard(
        targetNode,
        relationship.targetId,
        "Target Entity",
        data,
        repository,
        onSelectEntity,
        onOpenInExplorer
      )}
    </div>
  );
}
