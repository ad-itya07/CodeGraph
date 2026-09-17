"use client";

import { useMemo, useState } from "react";
import {
  Code2,
  FunctionSquare,
  Boxes,
  Layers,
  Variable,
  Hash,
  Binary,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SymbolKind, MethodKind } from "@/types";
import type { CodeEntityExplorerItem } from "@/types/explorer";

interface SymbolsViewProps {
  symbols: CodeEntityExplorerItem[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  kindFilter: SymbolKind | "all";
  onKindFilterChange: (kind: SymbolKind | "all") => void;
  expandedSymbols: Set<string>;
  onToggleSymbol: (symbolId: string) => void;
}

export function getSymbolKindIcon(kind: SymbolKind, methodKind?: MethodKind) {
  switch (kind) {
    case "function":
      return <FunctionSquare size={14} className="text-purple-400 shrink-0" />;
    case "method":
      return <Code2 size={14} className="text-indigo-400 shrink-0" />;
    case "class":
      return <Boxes size={14} className="text-amber-400 shrink-0" />;
    case "interface":
      return <Layers size={14} className="text-teal-400 shrink-0" />;
    case "variable":
      return <Variable size={14} className="text-blue-400 shrink-0" />;
    case "enum":
      return <Hash size={14} className="text-orange-400 shrink-0" />;
    case "typeAlias":
      return <Binary size={14} className="text-emerald-400 shrink-0" />;
    case "objectProperty":
      return <Code2 size={14} className="text-rose-400 shrink-0" />;
    default:
      return <Code2 size={14} className="text-muted shrink-0" />;
  }
}

export function getSymbolKindBadgeClass(kind: SymbolKind) {
  switch (kind) {
    case "function":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "method":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "class":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "interface":
      return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    case "variable":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "enum":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "typeAlias":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "objectProperty":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default:
      return "bg-surface-elevated text-muted border-border";
  }
}

const SUPPORTED_KINDS: Array<{ value: SymbolKind | "all"; label: string }> = [
  { value: "all", label: "All Kinds" },
  { value: "function", label: "Function" },
  { value: "method", label: "Method" },
  { value: "class", label: "Class" },
  { value: "interface", label: "Interface" },
  { value: "variable", label: "Variable" },
  { value: "enum", label: "Enum" },
  { value: "typeAlias", label: "Type Alias" },
  { value: "objectProperty", label: "Object Property" },
];

export function SymbolsView({
  symbols,
  selectedEntityId,
  onSelectEntity,
  searchQuery,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  expandedSymbols,
  onToggleSymbol,
}: SymbolsViewProps) {
  // Filter hierarchy preserving parent context
  const filteredSymbols = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasKindFilter = kindFilter !== "all";

    if (!query && !hasKindFilter) return symbols;

    function matches(item: CodeEntityExplorerItem): boolean {
      const nameMatch = !query || item.name.toLowerCase().includes(query);
      const kindMatch = !hasKindFilter || item.symbolKind === kindFilter;
      return nameMatch && kindMatch;
    }

    function filterItem(item: CodeEntityExplorerItem): CodeEntityExplorerItem | null {
      const filteredChildren: CodeEntityExplorerItem[] = [];
      for (const child of item.children) {
        const filtered = filterItem(child);
        if (filtered) filteredChildren.push(filtered);
      }

      if (matches(item) || filteredChildren.length > 0) {
        return {
          ...item,
          children: filteredChildren,
        };
      }

      return null;
    }

    const result: CodeEntityExplorerItem[] = [];
    for (const sym of symbols) {
      const filtered = filterItem(sym);
      if (filtered) result.push(filtered);
    }
    return result;
  }, [symbols, searchQuery, kindFilter]);

  // Count total matching entities
  const totalCount = useMemo(() => {
    let count = 0;
    function countItems(items: CodeEntityExplorerItem[]) {
      for (const item of items) {
        count++;
        if (item.children.length > 0) countItems(item.children);
      }
    }
    countItems(filteredSymbols);
    return count;
  }, [filteredSymbols]);

  const renderSymbolRow = (item: CodeEntityExplorerItem, depth = 0) => {
    const isSelected = selectedEntityId === item.id;
    const hasChildren = item.children.length > 0;
    const isExpanded = expandedSymbols.has(item.id) || searchQuery.trim().length > 0;

    return (
      <div key={item.id} className="select-none">
        <div
          onClick={() => onSelectEntity(item.id)}
          className={cn(
            "flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-mono transition-all group cursor-pointer border",
            isSelected
              ? "bg-surface-elevated text-foreground border-border-highlight/90 shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-elevated/40 border-transparent"
          )}
          style={{ paddingLeft: `${Math.max(12, depth * 16 + 12)}px` }}
        >
          {/* Left: Expander, Icon, Name, MethodKind */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSymbol(item.id);
                }}
                className="p-0.5 -ml-1 text-subtle hover:text-foreground rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {getSymbolKindIcon(item.symbolKind, item.methodKind)}

            <span
              className={cn(
                "truncate text-[12px]",
                isSelected ? "font-semibold text-foreground" : "text-foreground/90 font-medium group-hover:text-foreground"
              )}
            >
              {item.name}
            </span>

            {item.methodKind && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-surface border border-border text-subtle font-mono">
                {item.methodKind}
              </span>
            )}
          </div>

          {/* Right: Kind Badge, Location */}
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize",
                getSymbolKindBadgeClass(item.symbolKind)
              )}
            >
              {item.symbolKind}
            </span>

            {item.location && (
              <span className="text-[10px] font-mono text-subtle hidden sm:inline-block">
                L{item.location.startLine}:{item.location.startColumn}
              </span>
            )}
          </div>
        </div>

        {/* Nested Children Tree */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Guide line */}
            <div
              className="absolute left-0 top-0 bottom-0 border-l border-border/40"
              style={{ left: `${depth * 16 + 18}px` }}
            />
            <div className="space-y-0.5 mt-0.5">
              {item.children.map((child) => renderSymbolRow(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search & Kind Filter Controls Bar */}
      <div className="p-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-surface/50">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input
            type="text"
            placeholder="Search code entities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-md bg-surface-elevated/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-border-highlight focus:ring-1 focus:ring-accent transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear entity search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Kind Dropdown Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={kindFilter}
              onChange={(e) => onKindFilterChange(e.target.value as SymbolKind | "all")}
              className="h-8 pl-3 pr-8 rounded-md bg-surface-elevated/80 border border-border text-xs text-foreground font-mono focus:outline-none focus:border-border-highlight cursor-pointer appearance-none"
            >
              {SUPPORTED_KINDS.map((k) => (
                <option key={k.value} value={k.value} className="bg-surface text-foreground">
                  {k.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          <span className="text-[11px] font-mono text-subtle px-2">
            {totalCount} {totalCount === 1 ? "entity" : "entities"}
          </span>
        </div>
      </div>

      {/* Code Entities Tree Viewport */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {filteredSymbols.length > 0 ? (
          filteredSymbols.map((item) => renderSymbolRow(item))
        ) : (
          <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
              <Code2 size={18} />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1">
              {searchQuery || kindFilter !== "all" ? "No matching code entities" : "No code entities"}
            </h4>
            <p className="text-subtle max-w-sm">
              {searchQuery || kindFilter !== "all"
                ? "Try adjusting your search query or kind filters."
                : "No code entities were extracted from this file."}
            </p>
            {(searchQuery || kindFilter !== "all") && (
              <button
                onClick={() => {
                  onSearchChange("");
                  onKindFilterChange("all");
                }}
                className="mt-3 text-accent text-[11px] font-mono hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
