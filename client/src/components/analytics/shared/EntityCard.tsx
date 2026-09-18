"use client";

import Link from "next/link";
import {
  FileCode2,
  FolderTree,
  ExternalLink,
  ChevronRight,
  Package,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveEntity } from "@/lib/analytics/entity-helpers";
import {
  getSymbolKindIcon,
  getSymbolKindBadgeClass,
} from "@/components/explorer/SymbolsView";
import { DepthBadge } from "./DepthBadge";
import type { NormalizedExplorerData } from "@/types/explorer";

interface EntityCardProps {
  nodeId: string;
  data: NormalizedExplorerData | null | undefined;
  repositoryId?: string | null;
  depth?: number;
  stepNumber?: number;
  highlight?: boolean;
  onSelect?: () => void;
  action?: React.ReactNode;
}

export function EntityCard({
  nodeId,
  data,
  repositoryId,
  depth,
  stepNumber,
  highlight = false,
  onSelect,
  action,
}: EntityCardProps) {
  const entity = resolveEntity(nodeId, data, repositoryId);

  // Determine icon & kind badge
  const renderIconAndBadge = () => {
    if (entity.kind === "symbol" && entity.symbolKind) {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center">
            {getSymbolKindIcon(entity.symbolKind, entity.methodKind)}
          </div>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono capitalize border",
              getSymbolKindBadgeClass(entity.symbolKind)
            )}
          >
            {entity.symbolKind}
          </span>
        </div>
      );
    }

    if (entity.kind === "file") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-blue-400">
            <FileCode2 size={13} />
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            File
          </span>
        </div>
      );
    }

    if (entity.kind === "dependency") {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-amber-400">
            <Package size={13} />
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Dependency
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-teal-400">
          <Layers size={13} />
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Module
        </span>
      </div>
    );
  };

  // Build link to Explorer
  const explorerHref = (() => {
    if (!repositoryId) return "#";
    if (entity.kind === "symbol" && entity.fileId) {
      return `/repository/${repositoryId}/explorer?file=${encodeURIComponent(
        entity.fileId
      )}&entity=${encodeURIComponent(entity.canonicalNodeId)}`;
    }
    if (entity.kind === "file" && entity.fileId) {
      return `/repository/${repositoryId}/explorer?file=${encodeURIComponent(
        entity.fileId
      )}`;
    }
    return `/repository/${repositoryId}/explorer`;
  })();

  return (
    <div
      className={cn(
        "group p-3 rounded-xl border bg-surface/80 hover:bg-surface-elevated/70 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        highlight
          ? "border-accent/40 shadow-sm shadow-accent/5"
          : "border-border hover:border-border-highlight"
      )}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {typeof stepNumber === "number" && (
          <span className="w-6 h-6 rounded-full bg-surface-elevated border border-border text-[11px] font-mono font-semibold flex items-center justify-center text-muted shrink-0">
            {stepNumber}
          </span>
        )}

        {renderIconAndBadge()}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold font-mono text-foreground truncate max-w-full">
              {entity.displayName}
            </span>

            {entity.parentSymbolName && (
              <span className="text-[11px] font-mono text-muted/70 truncate">
                in {entity.parentSymbolName}
              </span>
            )}

            {depth !== undefined && <DepthBadge depth={depth} />}
          </div>

          {entity.relativeFilePath && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted mt-0.5 truncate">
              <span className="truncate">{entity.relativeFilePath}</span>
              {entity.location && (
                <span className="text-subtle shrink-0">
                  :L{entity.location.startLine}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {action}

        {repositoryId && (
          <Link
            href={explorerHref}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-muted hover:text-foreground bg-surface-elevated/80 hover:bg-surface-elevated border border-border hover:border-border-highlight transition-all"
            title="Inspect in Explorer"
          >
            <FolderTree size={12} />
            <span>Open in Explorer</span>
            <ArrowUpRight size={11} className="opacity-70" />
          </Link>
        )}
      </div>
    </div>
  );
}
