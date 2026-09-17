"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Layers,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  GitFork,
  Network,
  Maximize2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractBoundedSubgraph } from "@/lib/explorer/normalization";
import { ContextGraphNode } from "./ContextGraphNode";
import type { RelationshipKind, GraphNode, SymbolKind } from "@/types";
import type { GraphFilters, NormalizedExplorerData } from "@/types/explorer";
import { ALL_SYMBOL_KINDS, ALL_RELATIONSHIP_KINDS } from "@/types/explorer";

interface ContextGraphProps {
  currentFileId: string | null;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  data: NormalizedExplorerData;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onOpenInExplorer?: (entityId: string) => void;
  graphFilters: GraphFilters;
  onGraphFiltersChange: (filters: GraphFilters) => void;
}

const nodeTypes = {
  contextNode: ContextGraphNode,
};

const SYMBOL_CATEGORIES: Array<{
  kind: SymbolKind;
  label: string;
}> = [
  { kind: "function", label: "Functions" },
  { kind: "method", label: "Methods" },
  { kind: "class", label: "Classes" },
  { kind: "interface", label: "Interfaces" },
  { kind: "variable", label: "Variables" },
  { kind: "typeAlias", label: "Type Aliases" },
  { kind: "enum", label: "Enums" },
  { kind: "objectProperty", label: "Properties" },
];

const RELATIONSHIP_CATEGORIES: Array<{
  name: string;
  items: Array<{ kind: RelationshipKind; label: string }>;
}> = [
  {
    name: "Behavior",
    items: [{ kind: "calls", label: "Calls" }],
  },
  {
    name: "Dependencies",
    items: [{ kind: "imports", label: "Imports" }],
  },
  {
    name: "Inheritance",
    items: [
      { kind: "extends", label: "Extends" },
      { kind: "implements", label: "Implements" },
    ],
  },
  {
    name: "Other",
    items: [
      { kind: "exports", label: "Exports" },
      { kind: "instantiates", label: "Instantiates" },
      { kind: "references", label: "References" },
    ],
  },
];

export function ContextGraph({
  currentFileId,
  selectedEntityId,
  selectedRelationshipId,
  data,
  onSelectEntity,
  onSelectRelationship,
  onOpenInExplorer,
  graphFilters,
  onGraphFiltersChange,
}: ContextGraphProps) {
  // Determine root focus node: selected entity if any, else selected file
  const rootNodeId = selectedEntityId || currentFileId;

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSymbolFilterDropdownOpen, setIsSymbolFilterDropdownOpen] = useState(false);

  // Extract bounded subgraph
  const boundedSubgraph = useMemo(() => {
    if (!rootNodeId) return { nodes: [], edges: [] };

    return extractBoundedSubgraph({
      rootNodeId,
      depth: graphFilters.depth,
      relationshipKinds: graphFilters.relationshipKinds,
      showStructure: graphFilters.showStructure,
      symbolsOnly: graphFilters.symbolsOnly,
      symbolKinds: graphFilters.symbolKinds,
      data,
    });
  }, [rootNodeId, graphFilters, data]);

  // Compute Layout & Map to XYFlow Nodes & Edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const { nodes, edges } = boundedSubgraph;

    if (nodes.length === 0) {
      return { flowNodes: [], flowEdges: [] };
    }

    // Radial / Hierarchical distribution around root node
    const rootIndex = nodes.findIndex((n) => n.id === rootNodeId);
    const nonRootNodes = nodes.filter((n) => n.id !== rootNodeId);

    const centerX = 300;
    const centerY = 200;
    const radius = Math.min(220, Math.max(140, nonRootNodes.length * 30));

    const xyNodes: Node[] = [];

    // Place root node at center
    if (rootIndex !== -1) {
      const rootNode = nodes[rootIndex];
      xyNodes.push({
        id: rootNode.id,
        type: "contextNode",
        position: { x: centerX - 90, y: centerY - 30 },
        data: { node: rootNode, isRoot: true },
        selected: selectedEntityId === rootNode.id,
      });
    }

    // Place surrounding nodes in a clean circle/arc
    nonRootNodes.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / nonRootNodes.length;
      const x = centerX + radius * Math.cos(angle) - 90;
      const y = centerY + radius * Math.sin(angle) - 30;

      xyNodes.push({
        id: node.id,
        type: "contextNode",
        position: { x, y },
        data: { node, isRoot: false },
        selected: selectedEntityId === node.id,
      });
    });

    // Map edges
    const xyEdges: Edge[] = edges.map((edge) => {
      const isSelected = selectedRelationshipId === edge.id;
      const isStructural = (edge as any).isStructural;

      return {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        animated: isSelected,
        style: {
          stroke: isSelected
            ? "var(--accent)"
            : isStructural
            ? "var(--border-highlight)"
            : "rgba(161, 161, 170, 0.4)",
          strokeWidth: isSelected ? 2 : 1.2,
          strokeDasharray: isStructural ? "4 4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? "var(--accent)" : "rgba(161, 161, 170, 0.4)",
          width: 14,
          height: 14,
        },
        label: isSelected || !isStructural ? edge.relationshipKind : undefined,
        labelStyle: {
          fill: "var(--muted)",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
        },
        labelBgStyle: {
          fill: "var(--surface)",
          fillOpacity: 0.85,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };
    });

    return { flowNodes: xyNodes, flowEdges: xyEdges };
  }, [boundedSubgraph, rootNodeId, selectedEntityId, selectedRelationshipId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Click handlers
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectEntity(node.id);
    },
    [onSelectEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onOpenInExplorer?.(node.id);
    },
    [onOpenInExplorer]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onSelectRelationship(edge.id);
    },
    [onSelectRelationship]
  );

  // Filter modifiers
  const handleDepthChange = (depth: number) => {
    onGraphFiltersChange({ ...graphFilters, depth });
  };

  const handleToggleStructure = () => {
    onGraphFiltersChange({
      ...graphFilters,
      showStructure: !graphFilters.showStructure,
    });
  };

  const handleToggleKind = (kind: RelationshipKind) => {
    const nextKinds = new Set(graphFilters.relationshipKinds);
    if (nextKinds.has(kind)) {
      nextKinds.delete(kind);
    } else {
      nextKinds.add(kind);
    }
    onGraphFiltersChange({
      ...graphFilters,
      relationshipKinds: nextKinds,
    });
  };

  const handleToggleSymbolsOnly = () => {
    onGraphFiltersChange({
      ...graphFilters,
      symbolsOnly: !graphFilters.symbolsOnly,
    });
  };

  const handleToggleSymbolKind = (kind: SymbolKind) => {
    const nextKinds = new Set(graphFilters.symbolKinds);
    if (nextKinds.has(kind)) {
      nextKinds.delete(kind);
    } else {
      nextKinds.add(kind);
    }
    onGraphFiltersChange({
      ...graphFilters,
      symbolKinds: nextKinds,
    });
  };

  const handleSelectAllSymbolKinds = () => {
    onGraphFiltersChange({
      ...graphFilters,
      symbolKinds: new Set(ALL_SYMBOL_KINDS),
    });
  };

  const handleClearAllSymbolKinds = () => {
    onGraphFiltersChange({
      ...graphFilters,
      symbolKinds: new Set(),
    });
  };

  const handleResetFilters = () => {
    onGraphFiltersChange({
      depth: 1,
      relationshipKinds: new Set<RelationshipKind>(ALL_RELATIONSHIP_KINDS),
      showStructure: true,
      symbolsOnly: false,
      symbolKinds: new Set<SymbolKind>(ALL_SYMBOL_KINDS),
    });
  };

  const rootNode = rootNodeId ? data.nodesById.get(rootNodeId) : null;
  const rootLabel = rootNode
    ? rootNode.kind === "file"
      ? rootNode.filePath.split("/").pop()
      : rootNode.name
    : "None";

  const isSymbolFilterActive =
    graphFilters.symbolsOnly ||
    graphFilters.symbolKinds.size < ALL_SYMBOL_KINDS.length;

  return (
    <div className="h-full flex flex-col bg-surface relative select-none">
      {/* Top Controls Toolbar */}
      <div className="p-2.5 border-b border-border bg-surface-elevated/70 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 z-10">
        {/* Left: Focus info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-subtle text-[10px] uppercase">Focus:</span>
          <span className="font-semibold text-foreground truncate max-w-[130px] text-[11px]" title={rootNodeId || undefined}>
            {rootLabel}
          </span>
        </div>

        {/* Center/Right: Depth, Types, Symbols, Structure, Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Depth Selector */}
          <div className="flex items-center rounded-md bg-surface border border-border p-0.5 text-[10px]">
            <span className="px-1.5 text-subtle font-medium">Depth</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => handleDepthChange(d)}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors cursor-pointer",
                  graphFilters.depth === d
                    ? "bg-surface-elevated text-foreground font-bold shadow-xs"
                    : "text-muted hover:text-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Relationship Types Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterDropdownOpen((prev) => !prev);
                setIsSymbolFilterDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-border text-[11px] text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={11} />
              <span>Edges</span>
              <ChevronDown size={10} />
            </button>

            {isFilterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsFilterDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 p-2 rounded-xl bg-surface-elevated border border-border shadow-xl z-30 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-subtle px-1 font-semibold">
                    Filter Relationships
                  </div>

                  {RELATIONSHIP_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="text-[10px] text-muted px-1 font-medium">
                        {cat.name}
                      </div>
                      <div className="space-y-0.5">
                        {cat.items.map((item) => {
                          const isChecked = graphFilters.relationshipKinds.has(item.kind);
                          return (
                            <label
                              key={item.kind}
                              className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-surface text-xs text-foreground cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleKind(item.kind)}
                                className="rounded border-border bg-surface text-accent focus:ring-0 cursor-pointer"
                              />
                              <span className="capitalize">{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Symbols Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSymbolFilterDropdownOpen((prev) => !prev);
                setIsFilterDropdownOpen(false);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer",
                isSymbolFilterActive
                  ? "bg-accent/10 border-accent/30 text-accent font-medium"
                  : "bg-surface border-border text-muted hover:text-foreground"
              )}
            >
              <Code2 size={11} />
              <span>Symbols</span>
              <ChevronDown size={10} />
            </button>

            {isSymbolFilterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSymbolFilterDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-56 p-2 rounded-xl bg-surface-elevated border border-border shadow-xl z-30 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-subtle px-1 font-semibold">
                    <span>Symbol Filters</span>
                    <div className="flex items-center gap-1.5 text-[9px] lowercase font-normal">
                      <button
                        type="button"
                        onClick={handleSelectAllSymbolKinds}
                        className="text-accent hover:underline cursor-pointer"
                      >
                        All
                      </button>
                      <span className="text-border">|</span>
                      <button
                        type="button"
                        onClick={handleClearAllSymbolKinds}
                        className="text-subtle hover:text-foreground cursor-pointer"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Symbols Only Toggle */}
                  <div className="p-1.5 rounded-lg bg-surface border border-border/80">
                    <label className="flex items-center justify-between gap-2 text-xs text-foreground cursor-pointer">
                      <span className="text-[11px] font-medium">Symbols Only</span>
                      <input
                        type="checkbox"
                        checked={graphFilters.symbolsOnly}
                        onChange={handleToggleSymbolsOnly}
                        className="rounded border-border bg-surface text-accent focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Symbol Types Checkboxes */}
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {SYMBOL_CATEGORIES.map((cat) => {
                      const isChecked = graphFilters.symbolKinds.has(cat.kind);
                      return (
                        <label
                          key={cat.kind}
                          className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-md hover:bg-surface text-xs text-foreground cursor-pointer"
                        >
                          <span className="capitalize text-[11px] text-muted">{cat.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSymbolKind(cat.kind)}
                            className="rounded border-border bg-surface text-accent focus:ring-0 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Structure Toggle */}
          <button
            onClick={handleToggleStructure}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] border transition-colors cursor-pointer",
              graphFilters.showStructure
                ? "bg-accent/10 border-accent/30 text-accent font-medium"
                : "bg-surface border-border text-muted hover:text-foreground"
            )}
            title="Toggle parent-child structural hierarchy edges"
          >
            <Layers size={11} />
            <span>Structure</span>
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetFilters}
            className="p-1 rounded-md text-subtle hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Reset graph filters"
            aria-label="Reset graph filters"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Main XYFlow Canvas */}
      <div className="flex-1 w-full h-full relative">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="rgba(161, 161, 170, 0.15)"
            />
            <Controls
              showInteractive={false}
              className="!bg-surface-elevated !border-border !rounded-lg !shadow-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground"
            />
          </ReactFlow>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted">
            <Network size={24} className="mb-2 text-subtle" />
            <p className="font-medium text-foreground">No graph connections</p>
            <p className="text-subtle text-[11px] mt-1">
              No edges match the current filters for this node.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
