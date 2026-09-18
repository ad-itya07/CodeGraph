"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  Code2,
  FileCode2,
  Package,
  Layers,
  Check,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveEntity } from "@/lib/analytics/entity-helpers";
import {
  getSymbolKindIcon,
  getSymbolKindBadgeClass,
} from "@/components/explorer/SymbolsView";
import type { GraphNodeKind, SymbolKind } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

export interface EntityPickerProps {
  label?: string;
  placeholder?: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  data: NormalizedExplorerData | null | undefined;
  repositoryId?: string | null;
  allowedKinds?: Array<GraphNodeKind | SymbolKind>;
  disabled?: boolean;
}

export function EntityPicker({
  label = "Select entity",
  placeholder = "Search files, functions, classes, interfaces...",
  selectedNodeId,
  onSelectNode,
  data,
  repositoryId,
  allowedKinds,
  disabled = false,
}: EntityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<string>("all");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape or outside click
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Selected resolved entity
  const selectedEntity = useMemo(() => {
    if (!selectedNodeId) return null;
    return resolveEntity(selectedNodeId, data, repositoryId);
  }, [selectedNodeId, data, repositoryId]);

  // Build searchable entity index from normalized data
  const allEntities = useMemo(() => {
    if (!data) return [];
    const list: Array<{
      id: string;
      displayName: string;
      kind: "file" | "symbol" | "dependency" | "module";
      symbolKind?: SymbolKind;
      relativeFilePath: string;
      parentName?: string;
    }> = [];

    // 1. Symbols
    for (const [id, sym] of data.allSymbolsById.entries()) {
      const file = data.filesById.get(sym.fileId);
      const relPath = resolveEntity(id, data, repositoryId).relativeFilePath;
      let parentName: string | undefined;
      if (sym.parentId) {
        parentName = data.allSymbolsById.get(sym.parentId)?.name;
      }
      list.push({
        id,
        displayName: sym.name,
        kind: "symbol",
        symbolKind: sym.symbolKind,
        relativeFilePath: relPath,
        parentName,
      });
    }

    // 2. Files
    for (const [id, file] of data.filesById.entries()) {
      const resolved = resolveEntity(id, data, repositoryId);
      list.push({
        id,
        displayName: resolved.displayName,
        kind: "file",
        relativeFilePath: resolved.relativeFilePath,
      });
    }

    // 3. Dependencies
    for (const [id, dep] of data.allDependenciesById.entries()) {
      list.push({
        id,
        displayName: dep.name,
        kind: "dependency",
        relativeFilePath: dep.packageJsonPath || "",
      });
    }

    // 4. Modules
    for (const [id, mod] of data.allModulesById.entries()) {
      list.push({
        id,
        displayName: mod.name,
        kind: "module",
        relativeFilePath: "",
      });
    }

    return list;
  }, [data, repositoryId]);

  // Available filter kinds based on allowedKinds & index contents
  const filterKinds = useMemo(() => {
    const kindsSet = new Set<string>();
    for (const item of allEntities) {
      if (item.symbolKind) {
        kindsSet.add(item.symbolKind);
      } else {
        kindsSet.add(item.kind);
      }
    }
    return Array.from(kindsSet).sort();
  }, [allEntities]);

  // Filtered list
  const filteredEntities = useMemo(() => {
    let result = allEntities;

    // Filter by allowedKinds if specified
    if (allowedKinds && allowedKinds.length > 0) {
      const allowedSet = new Set(allowedKinds as string[]);
      result = result.filter((item) => {
        if (allowedSet.has(item.kind)) return true;
        if (item.symbolKind && allowedSet.has(item.symbolKind)) return true;
        return false;
      });
    }

    // Filter by selected kind dropdown
    if (selectedKind !== "all") {
      result = result.filter(
        (item) => item.symbolKind === selectedKind || item.kind === selectedKind
      );
    }

    // Filter by search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (item) =>
          item.displayName.toLowerCase().includes(q) ||
          item.relativeFilePath.toLowerCase().includes(q) ||
          (item.parentName && item.parentName.toLowerCase().includes(q))
      );
    }

    // Limit to 100 results for rendering performance
    return result.slice(0, 100);
  }, [allEntities, allowedKinds, selectedKind, searchQuery]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold font-mono text-muted mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          "w-full min-h-[46px] px-3.5 py-2 rounded-xl border bg-surface/90 flex items-center justify-between gap-3 transition-all cursor-pointer group",
          isOpen
            ? "border-accent ring-1 ring-accent/30 shadow-md shadow-accent/5"
            : "border-border hover:border-border-highlight",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {selectedEntity ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {selectedEntity.kind === "symbol" && selectedEntity.symbolKind ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center">
                  {getSymbolKindIcon(
                    selectedEntity.symbolKind,
                    selectedEntity.methodKind
                  )}
                </div>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono capitalize border",
                    getSymbolKindBadgeClass(selectedEntity.symbolKind)
                  )}
                >
                  {selectedEntity.symbolKind}
                </span>
              </div>
            ) : selectedEntity.kind === "file" ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-blue-400">
                  <FileCode2 size={13} />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  File
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-amber-400">
                  <Package size={13} />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {selectedEntity.kind}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 truncate text-left">
              <div className="text-xs font-semibold font-mono text-foreground truncate">
                {selectedEntity.displayName}
                {selectedEntity.parentSymbolName && (
                  <span className="text-muted/70 ml-1.5 text-[11px]">
                    in {selectedEntity.parentSymbolName}
                  </span>
                )}
              </div>
              {selectedEntity.relativeFilePath && (
                <div className="text-[11px] font-mono text-muted truncate">
                  {selectedEntity.relativeFilePath}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted text-xs font-mono">
            <Search size={14} className="text-muted/70" />
            <span>{placeholder}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedEntity && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(null);
              }}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "text-muted transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Modal Dialog for Search & Selection */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh] animate-[slide-up_0.2s_ease-out]"
          >
            {/* Modal Header & Search */}
            <div className="p-4 border-b border-border flex flex-col gap-3 bg-surface-elevated/40 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-muted">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    size={14}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by name, file path, container..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Kind Filter */}
                <select
                  value={selectedKind}
                  onChange={(e) => setSelectedKind(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-surface border border-border text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="all">All Kinds ({allEntities.length})</option>
                  {filterKinds.map((k) => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entity List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((item) => {
                  const isSelected = selectedNodeId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectNode(item.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors text-left",
                        isSelected
                          ? "bg-accent/10 border border-accent/30"
                          : "hover:bg-surface-elevated/80 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.kind === "symbol" && item.symbolKind ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center">
                              {getSymbolKindIcon(item.symbolKind)}
                            </div>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-mono capitalize border",
                                getSymbolKindBadgeClass(item.symbolKind)
                              )}
                            >
                              {item.symbolKind}
                            </span>
                          </div>
                        ) : item.kind === "file" ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-blue-400">
                              <FileCode2 size={13} />
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              File
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center text-amber-400">
                              <Package size={13} />
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {item.kind}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1 truncate">
                          <div className="text-xs font-semibold font-mono text-foreground truncate">
                            {item.displayName}
                            {item.parentName && (
                              <span className="text-muted/70 ml-1.5 text-[11px]">
                                in {item.parentName}
                              </span>
                            )}
                          </div>
                          {item.relativeFilePath && (
                            <div className="text-[10px] font-mono text-muted truncate">
                              {item.relativeFilePath}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent text-background flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-muted font-mono text-xs">
                  No entities found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-surface-elevated/40 flex items-center justify-between text-[11px] font-mono text-muted shrink-0">
              <span>Showing up to {filteredEntities.length} matching entities</span>
              <span className="text-subtle">Click to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
