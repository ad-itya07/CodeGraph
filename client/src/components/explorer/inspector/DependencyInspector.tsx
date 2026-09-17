"use client";

import { Package, FileCode2 } from "lucide-react";
import type { DependencyNode } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface DependencyInspectorProps {
  dependency: DependencyNode;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
}

export function DependencyInspector({
  dependency,
  data,
  onSelectEntity,
}: DependencyInspectorProps) {
  // Find all files/entities that import this dependency
  const incoming = data.incomingEdgesByNodeId.get(dependency.id) || [];

  return (
    <div className="p-4 space-y-5 text-xs font-mono select-none">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
          <Package size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-foreground truncate font-heading">
            {dependency.name}
          </h3>
          <span className="text-[10px] text-subtle block">External Package</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-3 rounded-lg bg-surface-elevated/60 border border-border text-[11px] space-y-1.5">
        {dependency.version && (
          <div className="text-muted">
            <span className="text-subtle">Version: </span>
            <span className="text-foreground">{dependency.version}</span>
          </div>
        )}
        {dependency.packageJsonPath && (
          <div className="text-muted">
            <span className="text-subtle">Config: </span>
            <span className="text-foreground">{dependency.packageJsonPath}</span>
          </div>
        )}
      </div>

      {/* Importers */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-subtle font-semibold flex items-center justify-between">
          <span>Imported By</span>
          <span>{incoming.length}</span>
        </div>

        {incoming.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {incoming.map((edge) => {
              const sourceNode = data.nodesById.get(edge.sourceId);
              const label = sourceNode
                ? sourceNode.kind === "file"
                  ? sourceNode.filePath
                  : sourceNode.name
                : edge.sourceId;

              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectEntity(edge.sourceId)}
                  className="w-full flex items-center gap-2 p-2 rounded-md bg-surface-elevated/40 hover:bg-surface-elevated border border-transparent hover:border-border text-left transition-colors cursor-pointer group"
                >
                  <FileCode2 size={12} className="text-blue-400 shrink-0" />
                  <span className="text-foreground truncate text-[11px] group-hover:text-accent font-medium">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-subtle italic">No direct importers in current graph view.</p>
        )}
      </div>
    </div>
  );
}
