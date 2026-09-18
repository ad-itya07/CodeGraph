"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveEntity } from "@/lib/analytics/entity-helpers";
import {
  getSymbolKindIcon,
  getSymbolKindBadgeClass,
} from "@/components/explorer/SymbolsView";
import type { SymbolKind } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

const SUPPORTED_SYMBOL_KINDS: Array<{ value: SymbolKind | "all"; label: string }> = [
  { value: "all", label: "All Symbol Kinds" },
  { value: "function", label: "Function" },
  { value: "method", label: "Method" },
  { value: "class", label: "Class" },
  { value: "interface", label: "Interface" },
  { value: "variable", label: "Variable" },
  { value: "enum", label: "Enum" },
  { value: "typeAlias", label: "Type Alias" },
  { value: "objectProperty", label: "Object Property" },
];

export interface SymbolPickerProps {
  label?: string;
  placeholder?: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  data: NormalizedExplorerData | null | undefined;
  repositoryId?: string | null;
  disabled?: boolean;
}

export function SymbolPicker({
  label = "Select symbol",
  placeholder = "Search functions, methods, classes...",
  selectedNodeId,
  onSelectNode,
  data,
  repositoryId,
  disabled = false,
}: SymbolPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<SymbolKind | "all">("all");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard escape
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

  // Build searchable symbol index
  const allSymbols = useMemo(() => {
    if (!data) return [];
    const list: Array<{
      id: string;
      displayName: string;
      symbolKind: SymbolKind;
      relativeFilePath: string;
      parentName?: string;
    }> = [];

    for (const [id, sym] of data.allSymbolsById.entries()) {
      const relPath = resolveEntity(id, data, repositoryId).relativeFilePath;
      let parentName: string | undefined;
      if (sym.parentId) {
        parentName = data.allSymbolsById.get(sym.parentId)?.name;
      }
      list.push({
        id,
        displayName: sym.name,
        symbolKind: sym.symbolKind,
        relativeFilePath: relPath,
        parentName,
      });
    }

    return list;
  }, [data, repositoryId]);

  // Filtered symbols
  const filteredSymbols = useMemo(() => {
    let result = allSymbols;

    if (kindFilter !== "all") {
      result = result.filter((sym) => sym.symbolKind === kindFilter);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (sym) =>
          sym.displayName.toLowerCase().includes(q) ||
          sym.relativeFilePath.toLowerCase().includes(q) ||
          (sym.parentName && sym.parentName.toLowerCase().includes(q))
      );
    }

    return result.slice(0, 100);
  }, [allSymbols, kindFilter, searchQuery]);

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
        {selectedEntity && selectedEntity.symbolKind ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
              {getSymbolKindIcon(
                selectedEntity.symbolKind,
                selectedEntity.methodKind
              )}
            </div>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono capitalize border shrink-0",
                getSymbolKindBadgeClass(selectedEntity.symbolKind)
              )}
            >
              {selectedEntity.symbolKind}
            </span>

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

      {/* Modal Dialog for Symbol Search & Selection */}
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
                    placeholder="Search symbols by name, class, file..."
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

                {/* Symbol Kind Filter */}
                <select
                  value={kindFilter}
                  onChange={(e) =>
                    setKindFilter(e.target.value as SymbolKind | "all")
                  }
                  className="h-9 px-3 rounded-xl bg-surface border border-border text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                >
                  {SUPPORTED_SYMBOL_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Symbol List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map((item) => {
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
                        <div className="w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
                          {getSymbolKindIcon(item.symbolKind)}
                        </div>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-mono capitalize border shrink-0",
                            getSymbolKindBadgeClass(item.symbolKind)
                          )}
                        >
                          {item.symbolKind}
                        </span>

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
                  No symbols found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-surface-elevated/40 flex items-center justify-between text-[11px] font-mono text-muted shrink-0">
              <span>Showing up to {filteredSymbols.length} symbols</span>
              <span className="text-subtle">Click to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
