"use client";

import { FileCode2, ExternalLink, Package, FolderTree } from "lucide-react";
import { formatGitHubUrl } from "@/lib/explorer/github";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";
import { getSymbolKindIcon, getSymbolKindBadgeClass } from "../SymbolsView";
import type { Repository, FileNode } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface FileInspectorProps {
  repository: Repository | null | undefined;
  file: FileNode;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onOpenInExplorer?: (fileId: string) => void;
}

export function FileInspector({
  repository,
  file,
  data,
  onSelectEntity,
  onOpenInExplorer,
}: FileInspectorProps) {
  const relativePath = getRepositoryRelativePath(file.filePath, repository?.id);
  const githubUrl = formatGitHubUrl(
    repository?.url,
    repository?.commitSha,
    file.filePath,
    undefined,
    repository?.id
  );
  const symbols = data.symbolsByFileId.get(file.id) || [];
  const dependencies = data.dependenciesByFileId.get(file.id) || [];

  const outgoing = data.outgoingEdgesByNodeId.get(file.id) || [];
  const incoming = data.incomingEdgesByNodeId.get(file.id) || [];

  const fileName = relativePath.split("/").pop() || file.filePath.split("/").pop() || file.filePath;

  return (
    <div className="p-4 space-y-6 text-xs font-mono select-none">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <FileCode2 size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-foreground truncate font-heading">
              {fileName}
            </h3>
            <span className="text-[10px] text-subtle block truncate">
              File Node
            </span>
          </div>
        </div>

        {/* Action: Open In Explorer */}
        {onOpenInExplorer && (
          <button
            onClick={() => onOpenInExplorer(file.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent text-background font-semibold hover:bg-accent-light transition-colors text-xs shadow-sm cursor-pointer mt-1"
          >
            <FolderTree size={14} />
            <span>Open in Explorer</span>
          </button>
        )}

        <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border text-[11px] space-y-1">
          <div className="text-muted truncate" title={relativePath}>
            <span className="text-subtle">Path: </span>
            <span className="text-foreground">{relativePath}</span>
          </div>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline text-[11px] pt-1"
            >
              <span>View file on GitHub</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Composition Stats */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-subtle font-semibold">
          Composition
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border text-center">
            <span className="block text-sm font-bold text-foreground">
              {symbols.length}
            </span>
            <span className="text-[10px] text-muted">Entities</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border text-center">
            <span className="block text-sm font-bold text-foreground">
              {outgoing.length + incoming.length}
            </span>
            <span className="text-[10px] text-muted">Edges</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border text-center">
            <span className="block text-sm font-bold text-foreground">
              {dependencies.length}
            </span>
            <span className="text-[10px] text-muted">Packages</span>
          </div>
        </div>
      </div>

      {/* Contained Top-Level Entities */}
      {symbols.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-subtle font-semibold">
            <span>Contained Entities</span>
            <span>{symbols.length}</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {symbols.map((sym) => (
              <button
                key={sym.id}
                onClick={() => onSelectEntity(sym.id)}
                className="w-full flex items-center justify-between p-2 rounded-md bg-surface-elevated/40 hover:bg-surface-elevated border border-transparent hover:border-border text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getSymbolKindIcon(sym.symbolKind, sym.methodKind)}
                  <span className="text-foreground truncate text-[11px] group-hover:text-accent font-medium">
                    {sym.name}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded border capitalize ${getSymbolKindBadgeClass(
                    sym.symbolKind
                  )}`}
                >
                  {sym.symbolKind}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-subtle font-semibold">
            <span>Dependencies</span>
            <span>{dependencies.length}</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {dependencies.map((dep) => (
              <button
                key={dep.id}
                onClick={() => onSelectEntity(dep.id)}
                className="w-full flex items-center justify-between p-2 rounded-md bg-surface-elevated/40 hover:bg-surface-elevated border border-transparent hover:border-border text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package size={12} className="text-amber-400 shrink-0" />
                  <span className="text-foreground truncate text-[11px] group-hover:text-accent font-medium">
                    {dep.name}
                  </span>
                </div>
                {dep.version && (
                  <span className="text-[10px] text-muted">
                    {dep.version}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
