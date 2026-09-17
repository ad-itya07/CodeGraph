"use client";

import { useMemo } from "react";
import {
  Network,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  X,
  Code2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";
import type { RelationshipKind, GraphNode, GraphEdge } from "@/types";
import type { NormalizedExplorerData, RelationshipExplorerItem } from "@/types/explorer";

interface RelationshipsViewProps {
  currentFileId: string;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  kindFilter: RelationshipKind | "all";
  onKindFilterChange: (kind: RelationshipKind | "all") => void;
  directionFilter: "all" | "incoming" | "outgoing";
  onDirectionFilterChange: (direction: "all" | "incoming" | "outgoing") => void;
}

export function getRelationshipBadgeColor(kind: RelationshipKind) {
  switch (kind) {
    case "calls":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "imports":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "exports":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "extends":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "implements":
      return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    case "instantiates":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "references":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    default:
      return "bg-surface-elevated text-muted border-border";
  }
}

function getNodeDisplayName(node: GraphNode | undefined, nodeId: string): string {
  if (!node) {
    return nodeId.split(":").slice(1).join(":") || nodeId;
  }
  switch (node.kind) {
    case "file":
      return node.filePath.split("/").pop() || node.filePath;
    case "symbol":
      return node.name;
    case "dependency":
      return node.name;
    case "module":
      return node.name;
  }
}

function getNodeDisplayLocation(node: GraphNode | undefined): string | null {
  if (!node) return null;
  if (node.kind === "symbol") {
    const rawFilePath = node.fileId.replace(/^file:/, "");
    const filePath = getRepositoryRelativePath(rawFilePath);
    return `${filePath}:${node.location.startLine}`;
  }
  if (node.kind === "file") {
    return getRepositoryRelativePath(node.filePath);
  }
  if (node.kind === "dependency") {
    return node.version ? `v${node.version}` : null;
  }
  return null;
}

const ALL_KINDS: Array<{ value: RelationshipKind | "all"; label: string }> = [
  { value: "all", label: "All Relationships" },
  { value: "calls", label: "Calls" },
  { value: "imports", label: "Imports" },
  { value: "exports", label: "Exports" },
  { value: "extends", label: "Extends" },
  { value: "implements", label: "Implements" },
  { value: "instantiates", label: "Instantiates" },
  { value: "references", label: "References" },
];

export function RelationshipsView({
  currentFileId,
  selectedEntityId,
  selectedRelationshipId,
  data,
  onSelectEntity,
  onSelectRelationship,
  searchQuery,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  directionFilter,
  onDirectionFilterChange,
}: RelationshipsViewProps) {
  // Collect all relationships relevant to the current scope:
  // If an entity is selected, focus on entity relationships; otherwise all relationships for this file and its symbols
  const allRelationships = useMemo(() => {
    const targetNodeIds = new Set<string>();

    if (selectedEntityId) {
      targetNodeIds.add(selectedEntityId);
    } else {
      targetNodeIds.add(currentFileId);
      const fileSymbols = data.symbolsByFileId.get(currentFileId) || [];
      function addSymIds(items: typeof fileSymbols) {
        for (const it of items) {
          targetNodeIds.add(it.id);
          if (it.children.length > 0) addSymIds(it.children);
        }
      }
      addSymIds(fileSymbols);
    }

    const items: RelationshipExplorerItem[] = [];
    const seenEdges = new Set<string>();

    for (const nodeId of targetNodeIds) {
      // Outgoing
      const outgoing = data.outgoingEdgesByNodeId.get(nodeId) || [];
      for (const edge of outgoing) {
        if (!seenEdges.has(edge.id)) {
          seenEdges.add(edge.id);
          const relatedNode = data.nodesById.get(edge.targetId);
          items.push({
            id: edge.id,
            relationshipKind: edge.relationshipKind,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            isOutgoing: true,
            relatedNodeId: edge.targetId,
            relatedNode,
          });
        }
      }

      // Incoming
      const incoming = data.incomingEdgesByNodeId.get(nodeId) || [];
      for (const edge of incoming) {
        if (!seenEdges.has(edge.id)) {
          seenEdges.add(edge.id);
          const relatedNode = data.nodesById.get(edge.sourceId);
          items.push({
            id: edge.id,
            relationshipKind: edge.relationshipKind,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            isOutgoing: false,
            relatedNodeId: edge.sourceId,
            relatedNode,
          });
        }
      }
    }

    return items;
  }, [currentFileId, selectedEntityId, data]);

  // Filter items by search, kind, and direction
  const filteredRelationships = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRelationships.filter((item) => {
      // Kind filter
      if (kindFilter !== "all" && item.relationshipKind !== kindFilter) {
        return false;
      }

      // Direction filter
      if (directionFilter === "outgoing" && !item.isOutgoing) return false;
      if (directionFilter === "incoming" && item.isOutgoing) return false;

      // Search query
      if (query) {
        const sourceName = getNodeDisplayName(data.nodesById.get(item.sourceId), item.sourceId).toLowerCase();
        const targetName = getNodeDisplayName(data.nodesById.get(item.targetId), item.targetId).toLowerCase();
        const kindName = item.relationshipKind.toLowerCase();
        return (
          sourceName.includes(query) ||
          targetName.includes(query) ||
          kindName.includes(query)
        );
      }

      return true;
    });
  }, [allRelationships, searchQuery, kindFilter, directionFilter, data]);

  // Group by relationship kind
  const groupedByKind = useMemo(() => {
    const groups = new Map<RelationshipKind, RelationshipExplorerItem[]>();
    for (const item of filteredRelationships) {
      if (!groups.has(item.relationshipKind)) {
        groups.set(item.relationshipKind, []);
      }
      groups.get(item.relationshipKind)!.push(item);
    }
    return groups;
  }, [filteredRelationships]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Controls Bar */}
      <div className="p-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-surface/50">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input
            type="text"
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-md bg-surface-elevated/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-border-highlight focus:ring-1 focus:ring-accent transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear relationship search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Direction & Kind Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Direction Filter */}
          <div className="flex rounded-md bg-surface-elevated/80 border border-border p-0.5 text-[11px] font-mono">
            <button
              onClick={() => onDirectionFilterChange("all")}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                directionFilter === "all" ? "bg-surface text-foreground font-semibold" : "text-muted hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => onDirectionFilterChange("outgoing")}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                directionFilter === "outgoing" ? "bg-surface text-foreground font-semibold" : "text-muted hover:text-foreground"
              )}
            >
              Outgoing
            </button>
            <button
              onClick={() => onDirectionFilterChange("incoming")}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                directionFilter === "incoming" ? "bg-surface text-foreground font-semibold" : "text-muted hover:text-foreground"
              )}
            >
              Incoming
            </button>
          </div>

          {/* Kind Select */}
          <div className="relative">
            <select
              value={kindFilter}
              onChange={(e) => onKindFilterChange(e.target.value as RelationshipKind | "all")}
              className="h-8 pl-3 pr-8 rounded-md bg-surface-elevated/80 border border-border text-xs text-foreground font-mono focus:outline-none focus:border-border-highlight cursor-pointer appearance-none"
            >
              {ALL_KINDS.map((k) => (
                <option key={k.value} value={k.value} className="bg-surface text-foreground">
                  {k.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Scope Banner if focused on a specific entity */}
      {selectedEntityId && (
        <div className="px-4 py-2 bg-surface-elevated/40 border-b border-border/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted">Filtered by entity:</span>
            <span className="text-accent font-semibold">
              {getNodeDisplayName(data.nodesById.get(selectedEntityId), selectedEntityId)}
            </span>
          </div>
          <button
            onClick={() => onSelectEntity(currentFileId)}
            className="text-[11px] text-muted hover:text-foreground hover:underline"
          >
            Show all file relationships
          </button>
        </div>
      )}

      {/* Relationships List Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupedByKind.size > 0 ? (
          Array.from(groupedByKind.entries()).map(([kind, items]) => (
            <div key={kind} className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold",
                      getRelationshipBadgeColor(kind)
                    )}
                  >
                    {kind}
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    ({items.length})
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  const isSelected = selectedRelationshipId === item.id;
                  const sourceNode = data.nodesById.get(item.sourceId);
                  const targetNode = data.nodesById.get(item.targetId);

                  const sourceName = getNodeDisplayName(sourceNode, item.sourceId);
                  const targetName = getNodeDisplayName(targetNode, item.targetId);

                  const sourceLoc = getNodeDisplayLocation(sourceNode);
                  const targetLoc = getNodeDisplayLocation(targetNode);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectRelationship(item.id)}
                      className={cn(
                        "p-3 rounded-lg border font-mono text-xs transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                        isSelected
                          ? "bg-surface-elevated border-border-highlight shadow-xs"
                          : "bg-surface/60 border-border hover:border-border-highlight/60 hover:bg-surface-elevated/40"
                      )}
                    >
                      {/* Relationship Flow: Source -> Target */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Source Entity Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEntity(item.sourceId);
                          }}
                          className="text-left font-medium text-foreground hover:text-accent hover:underline truncate max-w-[200px]"
                          title={item.sourceId}
                        >
                          {sourceName}
                          {sourceLoc && (
                            <span className="block text-[10px] text-subtle font-normal truncate">
                              {sourceLoc}
                            </span>
                          )}
                        </button>

                        {/* Direction Arrow */}
                        <div className="flex items-center px-1 text-muted shrink-0">
                          {item.isOutgoing ? (
                            <ArrowRight size={13} className="text-accent" />
                          ) : (
                            <ArrowLeft size={13} className="text-accent" />
                          )}
                        </div>

                        {/* Target Entity Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEntity(item.targetId);
                          }}
                          className="text-left font-medium text-foreground hover:text-accent hover:underline truncate max-w-[200px]"
                          title={item.targetId}
                        >
                          {targetName}
                          {targetLoc && (
                            <span className="block text-[10px] text-subtle font-normal truncate">
                              {targetLoc}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Direction Tag */}
                      <span className="text-[10px] text-subtle font-mono uppercase shrink-0">
                        {item.isOutgoing ? "Outgoing" : "Incoming"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
              <Network size={18} />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1">
              No relationships found
            </h4>
            <p className="text-subtle max-w-sm">
              {searchQuery || kindFilter !== "all" || directionFilter !== "all"
                ? "No relationships match your active filters."
                : "This file does not have any resolved graph relationships."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
