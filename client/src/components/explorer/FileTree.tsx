"use client";

import { useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileType,
  FileText,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ExplorerFolderNode,
  ExplorerFileNode,
  FileTreeNode,
} from "@/types/explorer";

interface FileTreeProps {
  rootFolder: ExplorerFolderNode;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folderPath: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalFiles: number;
}

function getFileIcon(extension: string) {
  switch (extension.toLowerCase()) {
    case "ts":
    case "tsx":
      return <FileCode2 size={15} className="text-blue-400 shrink-0" />;
    case "js":
    case "jsx":
      return <FileCode2 size={15} className="text-amber-400 shrink-0" />;
    case "json":
      return <FileJson size={15} className="text-yellow-400 shrink-0" />;
    case "css":
    case "scss":
      return <FileType size={15} className="text-sky-400 shrink-0" />;
    case "md":
    case "markdown":
      return <FileText size={15} className="text-emerald-400 shrink-0" />;
    default:
      return <File size={15} className="text-muted shrink-0" />;
  }
}

export function FileTree({
  rootFolder,
  selectedFileId,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
  onExpandAll,
  onCollapseAll,
  searchQuery,
  onSearchChange,
  totalFiles,
}: FileTreeProps) {
  // Filter tree recursively based on search query
  const filteredRoot = useMemo(() => {
    if (!searchQuery.trim()) return rootFolder;

    const query = searchQuery.toLowerCase().trim();

    function filterNode(node: FileTreeNode): FileTreeNode | null {
      if (!node.isFolder) {
        if (node.name.toLowerCase().includes(query) || node.fullPath.toLowerCase().includes(query)) {
          return node;
        }
        return null;
      }

      const matchingChildren: FileTreeNode[] = [];
      for (const child of node.children) {
        const filtered = filterNode(child);
        if (filtered) matchingChildren.push(filtered);
      }

      if (matchingChildren.length > 0 || node.name.toLowerCase().includes(query)) {
        return {
          ...node,
          children: matchingChildren,
        };
      }

      return null;
    }

    const res = filterNode(rootFolder);
    return (res as ExplorerFolderNode) || { isFolder: true, name: "root", fullPath: "", children: [] };
  }, [rootFolder, searchQuery]);

  // Count matches
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return totalFiles;
    let count = 0;
    function countFiles(node: FileTreeNode) {
      if (!node.isFolder) count++;
      else node.children.forEach(countFiles);
    }
    countFiles(filteredRoot);
    return count;
  }, [filteredRoot, searchQuery, totalFiles]);

  const renderTree = (node: FileTreeNode, depth = 0) => {
    if (node.isFolder) {
      // Root level folder container
      if (node.fullPath === "") {
        return (
          <div className="space-y-0.5">
            {node.children.map((child) => renderTree(child, depth))}
          </div>
        );
      }

      const isExpanded = expandedFolders.has(node.fullPath) || searchQuery.trim().length > 0;

      return (
        <div key={node.fullPath} className="select-none">
          <button
            onClick={() => onToggleFolder(node.fullPath)}
            className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface-elevated/50 transition-colors group text-left cursor-pointer"
            style={{ paddingLeft: `${Math.max(8, depth * 12 + 8)}px` }}
          >
            <span className="text-subtle group-hover:text-muted shrink-0">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-accent/80 shrink-0">
              {isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />}
            </span>
            <span className="font-medium truncate text-foreground/90 font-mono text-[12px]">
              {node.name}
            </span>
            <span className="text-[10px] text-subtle font-mono ml-auto pr-1">
              {node.children.length}
            </span>
          </button>

          {isExpanded && node.children.length > 0 && (
            <div className="relative">
              {/* Subtle indentation guideline */}
              <div
                className="absolute left-0 top-0 bottom-0 border-l border-border/40"
                style={{ left: `${depth * 12 + 14}px` }}
              />
              <div className="space-y-0.5">
                {node.children.map((child) => renderTree(child, depth + 1))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // File Node
    const isSelected = selectedFileId === node.fileId;

    return (
      <button
        key={node.fileId}
        onClick={() => onSelectFile(node.fileId)}
        className={cn(
          "w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-xs font-mono transition-all text-left group cursor-pointer",
          isSelected
            ? "bg-surface-elevated text-foreground border border-border-highlight/80 shadow-xs font-medium"
            : "text-muted hover:text-foreground hover:bg-surface-elevated/40 border border-transparent"
        )}
        style={{ paddingLeft: `${Math.max(8, depth * 12 + 18)}px` }}
        title={node.fullPath}
      >
        {getFileIcon(node.extension)}
        <span className="truncate text-[12px]">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface select-none">
      {/* Search & Action Bar */}
      <div className="p-3 border-b border-border space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Files
            </span>
            <span className="px-1.5 py-0.2 rounded bg-surface-elevated border border-border text-[10px] font-mono text-subtle">
              {matchCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onExpandAll}
              className="p-1 rounded text-subtle hover:text-foreground hover:bg-surface-elevated transition-colors"
              title="Expand All Folders"
              aria-label="Expand All Folders"
            >
              <ChevronsUpDown size={13} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-md bg-surface-elevated/60 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-border-highlight focus:ring-1 focus:ring-accent transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear file search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* File Tree Viewport */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredRoot.children.length > 0 ? (
          renderTree(filteredRoot)
        ) : (
          <div className="p-6 text-center text-xs text-muted">
            <p>No files found</p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="mt-2 text-accent hover:underline font-mono text-[11px]"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
