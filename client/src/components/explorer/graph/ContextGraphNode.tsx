"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  FileCode2,
  Boxes,
  FunctionSquare,
  Layers,
  Variable,
  Package,
  FolderSymlink,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";
import type { GraphNode } from "@/types";

function getNodeIcon(node: GraphNode) {
  switch (node.kind) {
    case "file":
      return <FileCode2 size={13} className="text-blue-400 shrink-0" />;
    case "dependency":
      return <Package size={13} className="text-amber-400 shrink-0" />;
    case "module":
      return <FolderSymlink size={13} className="text-emerald-400 shrink-0" />;
    case "symbol": {
      switch (node.symbolKind) {
        case "function":
          return <FunctionSquare size={13} className="text-purple-400 shrink-0" />;
        case "class":
          return <Boxes size={13} className="text-amber-400 shrink-0" />;
        case "interface":
          return <Layers size={13} className="text-teal-400 shrink-0" />;
        case "variable":
          return <Variable size={13} className="text-blue-400 shrink-0" />;
        default:
          return <Code2 size={13} className="text-indigo-400 shrink-0" />;
      }
    }
  }
}

function getNodeLabel(node: GraphNode): string {
  switch (node.kind) {
    case "file": {
      const rel = getRepositoryRelativePath(node.filePath);
      return rel.split("/").pop() || rel;
    }
    case "symbol":
      return node.name;
    case "dependency":
      return node.name;
    case "module":
      return node.name;
  }
}

function getNodeSubLabel(node: GraphNode): string | null {
  switch (node.kind) {
    case "file": {
      return getRepositoryRelativePath(node.filePath);
    }
    case "symbol": {
      const fileRel = getRepositoryRelativePath(node.fileId.replace(/^file:/, ""));
      return fileRel ? `${fileRel.split("/").pop()}:${node.location.startLine}` : `Line ${node.location.startLine}`;
    }
    case "dependency":
      return node.version ? `v${node.version}` : "External package";
    case "module":
      return "Module target";
  }
}

function ContextGraphNodeComponent({ data, selected }: { data: { node: GraphNode; isRoot: boolean }; selected?: boolean }) {
  const { node, isRoot } = data;
  const label = getNodeLabel(node);
  const subLabel = getNodeSubLabel(node);

  return (
    <div
      className={cn(
        "px-3 py-2 rounded-xl bg-surface border font-mono text-xs shadow-md transition-all select-none min-w-[140px] max-w-[220px]",
        isRoot
          ? "border-accent ring-2 ring-accent/30 bg-surface-elevated text-foreground"
          : selected
          ? "border-accent-light ring-1 ring-accent-light/50 bg-surface-elevated text-foreground"
          : "border-border text-muted hover:border-border-highlight hover:text-foreground hover:bg-surface-elevated/60"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-accent !border-background !w-2 !h-2"
      />

      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-surface-elevated flex items-center justify-center shrink-0 border border-border/80">
          {getNodeIcon(node)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-foreground truncate text-[11px]">
              {label}
            </span>
            {node.kind === "symbol" && (
              <span className="text-[9px] text-subtle uppercase">
                {node.symbolKind.slice(0, 3)}
              </span>
            )}
          </div>
          {subLabel && (
            <span className="text-[9px] text-subtle block truncate mt-0.5" title={subLabel}>
              {subLabel}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-accent !border-background !w-2 !h-2"
      />
    </div>
  );
}

export const ContextGraphNode = memo(ContextGraphNodeComponent);
