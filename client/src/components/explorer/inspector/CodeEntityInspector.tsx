"use client";

import {
  ExternalLink,
  FolderTree,
  ArrowRight,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { formatGitHubUrl } from "@/lib/explorer/github";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";
import {
  getSymbolKindIcon,
  getSymbolKindBadgeClass,
} from "../SymbolsView";
import { getRelationshipBadgeColor } from "../RelationshipsView";
import type { Repository } from "@/types";
import type { NormalizedExplorerData, CodeEntityExplorerItem } from "@/types/explorer";

interface CodeEntityInspectorProps {
  repository: Repository | null | undefined;
  entity: CodeEntityExplorerItem;
  currentFileId: string | null;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onOpenInExplorer: (entityId: string) => void;
}

export function CodeEntityInspector({
  repository,
  entity,
  currentFileId,
  data,
  onSelectEntity,
  onSelectRelationship,
  onOpenInExplorer,
}: CodeEntityInspectorProps) {
  const file = data.filesById.get(entity.fileId);
  const isFromCurrentFile = currentFileId === entity.fileId;
  const relativeFilePath = getRepositoryRelativePath(file?.filePath || entity.fileId, repository?.id);

  const githubUrl = file
    ? formatGitHubUrl(
        repository?.url,
        repository?.commitSha,
        file.filePath,
        entity.location,
        repository?.id
      )
    : null;

  // Parent entity
  const parentEntity = entity.parentId ? data.allSymbolsById.get(entity.parentId) : null;

  // Children entities
  const children = entity.children;

  // Incoming and Outgoing relationships
  const outgoing = data.outgoingEdgesByNodeId.get(entity.id) || [];
  const incoming = data.incomingEdgesByNodeId.get(entity.id) || [];

  return (
    <div className="p-4 space-y-5 text-xs font-mono select-none">
      {/* Entity Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center shrink-0">
              {getSymbolKindIcon(entity.symbolKind, entity.methodKind)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground truncate font-heading">
                {entity.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border capitalize ${getSymbolKindBadgeClass(
                    entity.symbolKind
                  )}`}
                >
                  {entity.symbolKind}
                </span>
                {entity.methodKind && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-subtle">
                    {entity.methodKind}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action: Open In Explorer */}
        <button
          onClick={() => onOpenInExplorer(entity.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent text-background font-semibold hover:bg-accent-light transition-colors text-xs shadow-sm cursor-pointer mt-2"
        >
          <FolderTree size={14} />
          <span>{isFromCurrentFile ? "Focus in Explorer" : "Open in Explorer"}</span>
        </button>
      </div>

      {/* Source Location Card */}
      <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
        <div className="text-muted truncate" title={relativeFilePath}>
          <span className="text-subtle">File: </span>
          <span className="text-foreground">{relativeFilePath}</span>
        </div>
        {entity.location && (
          <div className="text-muted">
            <span className="text-subtle">Lines: </span>
            <span className="text-foreground">
              {entity.location.startLine}:{entity.location.startColumn} – {entity.location.endLine}:{entity.location.endColumn}
            </span>
          </div>
        )}
        {githubUrl && (
          <div className="pt-1">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline text-[11px]"
            >
              <span>View source on GitHub</span>
              <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>

      {/* Structural Hierarchy (Parent & Children) */}
      {(parentEntity || children.length > 0) && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-subtle font-semibold flex items-center gap-1.5">
            <Layers size={11} />
            <span>Structural Hierarchy</span>
          </div>

          <div className="p-2 rounded-lg bg-surface-elevated/40 border border-border space-y-2">
            {/* Parent */}
            {parentEntity && (
              <div>
                <span className="text-[10px] text-subtle block mb-1">Parent Entity:</span>
                <button
                  onClick={() => onSelectEntity(parentEntity.id)}
                  className="w-full flex items-center justify-between p-1.5 rounded bg-surface hover:bg-surface-elevated border border-border/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getSymbolKindIcon(parentEntity.symbolKind, parentEntity.methodKind)}
                    <span className="text-foreground truncate text-[11px] group-hover:text-accent font-medium">
                      {parentEntity.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-subtle capitalize">
                    {parentEntity.symbolKind}
                  </span>
                </button>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div>
                <span className="text-[10px] text-subtle block mb-1">
                  Child Entities ({children.length}):
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSelectEntity(child.id)}
                      className="w-full flex items-center justify-between p-1.5 rounded bg-surface hover:bg-surface-elevated border border-border/60 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getSymbolKindIcon(child.symbolKind, child.methodKind)}
                        <span className="text-foreground truncate text-[11px] group-hover:text-accent font-medium">
                          {child.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-subtle capitalize">
                        {child.symbolKind}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relationships */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-subtle font-semibold">
          Connections ({outgoing.length + incoming.length})
        </div>

        {/* Outgoing */}
        {outgoing.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted flex items-center gap-1">
              <ArrowRight size={10} className="text-accent" />
              <span>Outgoing Relationships ({outgoing.length})</span>
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {outgoing.map((edge) => {
                const targetNode = data.nodesById.get(edge.targetId);
                const targetLabel = targetNode
                  ? targetNode.kind === "symbol"
                    ? targetNode.name
                    : targetNode.kind === "file"
                    ? getRepositoryRelativePath(targetNode.filePath, repository?.id).split("/").pop() || targetNode.filePath
                    : targetNode.name
                  : edge.targetId;

                return (
                  <div
                    key={edge.id}
                    onClick={() => onSelectRelationship(edge.id)}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-elevated/40 hover:bg-surface-elevated border border-transparent hover:border-border cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity(edge.targetId);
                      }}
                      className="text-foreground hover:text-accent font-medium truncate text-[11px] text-left max-w-[150px]"
                    >
                      {targetLabel}
                    </button>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border capitalize ${getRelationshipBadgeColor(
                        edge.relationshipKind
                      )}`}
                    >
                      {edge.relationshipKind}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incoming */}
        {incoming.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted flex items-center gap-1">
              <ArrowLeft size={10} className="text-accent" />
              <span>Incoming Relationships ({incoming.length})</span>
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {incoming.map((edge) => {
                const sourceNode = data.nodesById.get(edge.sourceId);
                const sourceLabel = sourceNode
                  ? sourceNode.kind === "symbol"
                    ? sourceNode.name
                    : sourceNode.kind === "file"
                    ? getRepositoryRelativePath(sourceNode.filePath, repository?.id).split("/").pop() || sourceNode.filePath
                    : sourceNode.name
                  : edge.sourceId;

                return (
                  <div
                    key={edge.id}
                    onClick={() => onSelectRelationship(edge.id)}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-elevated/40 hover:bg-surface-elevated border border-transparent hover:border-border cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity(edge.sourceId);
                      }}
                      className="text-foreground hover:text-accent font-medium truncate text-[11px] text-left max-w-[150px]"
                    >
                      {sourceLabel}
                    </button>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border capitalize ${getRelationshipBadgeColor(
                        edge.relationshipKind
                      )}`}
                    >
                      {edge.relationshipKind}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {outgoing.length === 0 && incoming.length === 0 && (
          <p className="text-[11px] text-subtle italic">No direct graph connections found.</p>
        )}
      </div>
    </div>
  );
}
