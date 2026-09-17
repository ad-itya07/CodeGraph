"use client";

import { FolderSymlink, FileCode2 } from "lucide-react";
import type { ModuleNode } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface ModuleInspectorProps {
  module: ModuleNode;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
}

export function ModuleInspector({
  module,
  data,
  onSelectEntity,
}: ModuleInspectorProps) {
  const incoming = data.incomingEdgesByNodeId.get(module.id) || [];

  return (
    <div className="p-4 space-y-5 text-xs font-mono select-none">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
          <FolderSymlink size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-foreground truncate font-heading">
            {module.name}
          </h3>
          <span className="text-[10px] text-subtle block">Module Target</span>
        </div>
      </div>

      {/* Referencing Nodes */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-subtle font-semibold flex items-center justify-between">
          <span>Referenced By</span>
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
          <p className="text-[11px] text-subtle italic">No referencing entities found.</p>
        )}
      </div>
    </div>
  );
}
