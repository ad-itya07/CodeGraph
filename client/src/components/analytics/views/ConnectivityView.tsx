"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Play,
  ArrowDownLeft,
  ArrowUpRight,
  Gauge,
  Layers,
  Info,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Search,
  X,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Compass,
  FileCode,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/api/repositories";
import { AnalysisHeader } from "../shared/AnalysisHeader";
import { EntityPicker } from "../pickers/EntityPicker";
import { EntityCard } from "../shared/EntityCard";
import {
  AnalysisLoadingState,
  AnalysisErrorState,
} from "../shared/AnalysisStateDisplay";
import {
  resolveEntity,
  calculateInstability,
  calculateAbstractness,
  calculateDistanceMainSequence,
  calculateRepositoryCouplingStats,
  getArchitecturalRole,
} from "@/lib/analytics/entity-helpers";
import { getRelationshipBadgeColor } from "@/components/explorer/RelationshipsView";
import type { Repository, RelationshipKind } from "@/types";
import type { NormalizedExplorerData } from "@/types/explorer";

interface ConnectivityViewProps {
  repository: Repository;
  data: NormalizedExplorerData | null | undefined;
  initialNodeId?: string | null;
}

export function ConnectivityView({
  repository,
  data,
  initialNodeId = null,
}: ConnectivityViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [edgeSearch, setEdgeSearch] = useState("");

  // What-If Simulation State
  const [simDeltaCa, setSimDeltaCa] = useState<number>(0);
  const [simDeltaCe, setSimDeltaCe] = useState<number>(0);
  const [simOverrideAbstract, setSimOverrideAbstract] = useState<boolean | null>(null);

  const {
    data: connectivityResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analysis-connectivity", repository.id, selectedNodeId],
    queryFn: () => {
      if (!selectedNodeId) throw new Error("No entity selected");
      return analyticsApi.connectivity(repository.id, selectedNodeId);
    },
    enabled: hasTriggered && !!selectedNodeId,
    retry: false,
  });

  const isRunning = isLoading || isFetching;

  const handleRun = () => {
    if (!selectedNodeId) return;
    setHasTriggered(true);
    // Reset simulation on new run
    setSimDeltaCa(0);
    setSimDeltaCe(0);
    setSimOverrideAbstract(null);
    if (hasTriggered) {
      refetch();
    }
  };

  const selectedEntity = selectedNodeId
    ? resolveEntity(selectedNodeId, data, repository.id)
    : null;

  // Real Graph Metrics
  const fanIn = connectivityResult?.fanIn ?? 0;
  const fanOut = connectivityResult?.fanOut ?? 0;
  const total = fanIn + fanOut;
  const instability = calculateInstability(fanIn, fanOut);
  const roleInfo = getArchitecturalRole(fanIn, fanOut);

  // Clean Architecture Package Metrics
  const abstractnessInfo = useMemo(() => {
    if (!selectedNodeId) return { abstractness: 0, abstractCount: 0, totalCount: 1, isAbstract: false, abstractnessLabel: "Concrete" };
    return calculateAbstractness(selectedNodeId, data);
  }, [selectedNodeId, data]);

  const mainSequenceInfo = useMemo(() => {
    return calculateDistanceMainSequence(abstractnessInfo.abstractness, instability);
  }, [abstractnessInfo.abstractness, instability]);

  // Repository-wide comparative stats & 2-hop blast radius
  const repoStats = useMemo(() => {
    if (!selectedNodeId) {
      return {
        totalNodesCount: 1,
        fanInPercentile: 0,
        fanOutPercentile: 0,
        avgFanIn: 0,
        avgFanOut: 0,
        twoHopBlastRadius: 0,
        directCallerCount: 0,
        secondHopCallerCount: 0,
      };
    }
    return calculateRepositoryCouplingStats(selectedNodeId, data);
  }, [selectedNodeId, data]);

  // Simulation calculations
  const effectiveSimCa = Math.max(0, fanIn + simDeltaCa);
  const effectiveSimCe = Math.max(0, fanOut + simDeltaCe);
  const effectiveSimAbstractness =
    simOverrideAbstract !== null
      ? simOverrideAbstract
        ? 1.0
        : 0.0
      : abstractnessInfo.abstractness;
  const simulatedInstability = calculateInstability(effectiveSimCa, effectiveSimCe);
  const simulatedMainSequence = calculateDistanceMainSequence(
    effectiveSimAbstractness,
    simulatedInstability
  );
  const isSimulating = simDeltaCa !== 0 || simDeltaCe !== 0 || simOverrideAbstract !== null;

  // Extract actual incoming and outgoing connected entities from graph index
  const { incomingItems, outgoingItems } = useMemo(() => {
    if (!selectedNodeId || !data) return { incomingItems: [], outgoingItems: [] };

    const inEdges = data.incomingEdgesByNodeId.get(selectedNodeId) || [];
    const outEdges = data.outgoingEdgesByNodeId.get(selectedNodeId) || [];

    const incoming = inEdges.map((e) => ({
      edgeId: e.id,
      nodeId: e.sourceId,
      relationshipKind: e.relationshipKind,
    }));

    const outgoing = outEdges.map((e) => ({
      edgeId: e.id,
      nodeId: e.targetId,
      relationshipKind: e.relationshipKind,
    }));

    return { incomingItems: incoming, outgoingItems: outgoing };
  }, [selectedNodeId, data]);

  // Filtered edge items
  const activeItems = activeTab === "incoming" ? incomingItems : outgoingItems;
  const filteredActiveItems = useMemo(() => {
    if (!edgeSearch.trim()) return activeItems;
    const q = edgeSearch.toLowerCase().trim();
    return activeItems.filter((item) => {
      const resolved = resolveEntity(item.nodeId, data, repository.id);
      return (
        resolved.displayName.toLowerCase().includes(q) ||
        resolved.relativeFilePath.toLowerCase().includes(q) ||
        item.relationshipKind.toLowerCase().includes(q)
      );
    });
  }, [activeItems, edgeSearch, data, repository.id]);

  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="Connectivity & Coupling Analysis"
        question="How coupled is this entity, and what structural role does it play in the repository?"
        category="Entity Analysis"
        icon={Activity}
        iconColor="text-emerald-400"
        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      />

      {/* Input Selection */}
      <div className="p-5 rounded-2xl border border-border bg-surface/80 space-y-4">
        <EntityPicker
          label="Select Entity to Measure"
          placeholder="Search functions, classes, or files..."
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setHasTriggered(false);
          }}
          data={data}
          repositoryId={repository.id}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <Info size={13} className="text-subtle" />
            <span>
              Computes Martin Instability ($I$), Abstractness ($A$), Main Sequence Distance ($D$), and 2-Hop blast radius.
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedNodeId || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-background text-xs font-semibold font-mono transition-all duration-150 shadow-md shadow-accent/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Play size={14} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Measuring..." : "Measure Connectivity"}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isRunning && (
        <AnalysisLoadingState
          message={`Measuring Clean Architecture metrics for ${selectedEntity?.displayName || "entity"}...`}
          subMessage="Reading indexed edge sets and computing Martin instability and distance from main sequence"
        />
      )}

      {/* Error */}
      {!isRunning && isError && (
        <AnalysisErrorState
          title="Connectivity Analysis Failed"
          error={error}
          onRetry={handleRun}
        />
      )}

      {/* Results */}
      {!isRunning && !isError && connectivityResult && (
        <div className="space-y-6">
          {/* Selected Entity Card */}
          <EntityCard
            nodeId={connectivityResult.nodeId}
            data={data}
            repositoryId={repository.id}
            highlight
          />

          {/* Metric KPI Cards (4 Primary Coupling Dimensions) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Fan-In / Ca */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Afferent (Ca)
                </span>
                <ArrowDownLeft size={16} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
                {fanIn}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mt-1">
                <span>Top {100 - repoStats.fanInPercentile}% in repo</span>
                <span className="text-emerald-400/80">+{repoStats.secondHopCallerCount} ripple</span>
              </div>
            </div>

            {/* Fan-Out / Ce */}
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Efferent (Ce)
                </span>
                <ArrowUpRight size={16} className="text-indigo-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-indigo-400 mt-2">
                {fanOut}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted mt-1">
                <span>Dependencies</span>
                <span className="text-indigo-400/80">{roleInfo.volatilitySeverity} Fragility</span>
              </div>
            </div>

            {/* Abstractness (A) */}
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  Abstractness (A)
                </span>
                <FileCode size={16} className="text-cyan-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-cyan-400 mt-2">
                {abstractnessInfo.abstractness.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-muted mt-1 truncate" title={abstractnessInfo.abstractnessLabel}>
                {abstractnessInfo.isAbstract ? "Pure Contract" : "Concrete Type"}
              </div>
            </div>

            {/* Instability Index (I) */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-purple-400 font-semibold">
                  Instability (I)
                </span>
                <Gauge size={16} className="text-purple-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-purple-400 mt-2">
                {instability.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-muted mt-1">
                {roleInfo.stabilityPercentage}% Stable • {roleInfo.volatilityPercentage}% Volatile
              </div>
            </div>
          </div>

          {/* 2D Clean Architecture Main Sequence Plot & Distance Breakdown */}
          <div className="p-5 rounded-2xl border border-border bg-surface/90 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Compass size={14} className="text-accent" />
                  <span>Clean Architecture: Main Sequence & Zone Analysis</span>
                </h3>
                <p className="text-[11px] font-mono text-muted/80 mt-0.5">
                  Plots Abstractness ($A$) against Instability ($I$) to locate the entity on the Main Sequence ($A + I = 1$).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-mono font-bold border", mainSequenceInfo.zoneColor)}>
                  {mainSequenceInfo.zone}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-surface-elevated text-foreground border border-border">
                  Balance: {mainSequenceInfo.balanceScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* 2D Coordinate SVG Graph */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="relative w-full max-w-[340px] aspect-square bg-surface-elevated/80 rounded-2xl border border-border p-4 shadow-inner">
                  {/* Axis Labels */}
                  <div className="absolute left-2 top-2 text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Abstract (A = 1.0)
                  </div>
                  <div className="absolute left-2 bottom-2 text-[9px] font-mono text-muted">
                    Concrete (A = 0.0)
                  </div>
                  <div className="absolute right-2 bottom-2 text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    Volatile (I = 1.0)
                  </div>
                  <div className="absolute left-20 bottom-2 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Stable (I = 0.0)
                  </div>

                  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                    <defs>
                      {/* Gradients for Zones */}
                      <linearGradient id="zonePainGrad" x1="0%" y1="100%" x2="50%" y2="50%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="zoneUselessGrad" x1="100%" y1="0%" x2="50%" y2="50%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Zone of Pain Shading (Bottom Left: A=0, I=0) */}
                    <polygon points="20,180 20,110 90,180" fill="url(#zonePainGrad)" />
                    <text x="35" y="165" fill="#f59e0b" fontSize="7" fontFamily="monospace" opacity="0.8">
                      Zone of Pain
                    </text>

                    {/* Zone of Uselessness Shading (Top Right: A=1, I=1) */}
                    <polygon points="180,20 180,90 110,20" fill="url(#zoneUselessGrad)" />
                    <text x="110" y="45" fill="#f43f5e" fontSize="7" fontFamily="monospace" opacity="0.8">
                      Zone of Uselessness
                    </text>

                    {/* Main Sequence Healthy Band */}
                    <polygon points="20,50 50,20 180,150 150,180" fill="#10b981" fillOpacity="0.06" />

                    {/* Coordinate Grid Lines */}
                    <line x1="20" y1="20" x2="20" y2="180" stroke="#374151" strokeWidth="1" />
                    <line x1="20" y1="180" x2="180" y2="180" stroke="#374151" strokeWidth="1" />
                    <line x1="20" y1="100" x2="180" y2="100" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
                    <line x1="100" y1="20" x2="100" y2="180" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />

                    {/* Main Sequence Line: A + I = 1  => (0, 1) to (1, 0) => (20, 20) to (180, 180) */}
                    <line x1="20" y1="20" x2="180" y2="180" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="65" y="95" fill="#10b981" fontSize="7" fontFamily="monospace" transform="rotate(45, 100, 100)" opacity="0.9">
                      Main Sequence (A + I = 1)
                    </text>

                    {/* Dynamic Plotted Entity Dot */}
                    {(() => {
                      // Map I: [0, 1] to SVG X: [20, 180]
                      // Map A: [0, 1] to SVG Y: [180, 20] (SVG Y is inverted)
                      const activeI = isSimulating ? simulatedInstability : instability;
                      const activeA = isSimulating ? effectiveSimAbstractness : abstractnessInfo.abstractness;
                      const posX = 20 + activeI * 160;
                      const posY = 180 - activeA * 160;

                      // Nearest point on Main Sequence line: x_ms = (posX + posY - 200)/2
                      const msX = (posX + (200 - posY)) / 2;
                      const msY = 200 - msX;

                      return (
                        <g>
                          {/* Distance Vector to Main Sequence */}
                          <line
                            x1={posX}
                            y1={posY}
                            x2={msX}
                            y2={msY}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.7"
                          />
                          {/* Outer pulse */}
                          <circle cx={posX} cy={posY} r="8" fill="#38bdf8" fillOpacity="0.2" className="animate-pulse" />
                          {/* Core dot */}
                          <circle cx={posX} cy={posY} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                <div className="text-[10px] font-mono text-muted text-center mt-2">
                  Coordinates: <span className="text-purple-400 font-bold">I = {instability.toFixed(2)}</span>,{" "}
                  <span className="text-cyan-400 font-bold">A = {abstractnessInfo.abstractness.toFixed(2)}</span> •{" "}
                  <span className="text-foreground font-bold">D = {mainSequenceInfo.distance.toFixed(2)}</span>
                </div>
              </div>

              {/* Detailed Metrics Diagnostics */}
              <div className="lg:col-span-6 space-y-3">
                {/* Distance Card */}
                <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                      Distance from Main Sequence (D)
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      D = |A + I - 1| = {mainSequenceInfo.distance.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        mainSequenceInfo.distance <= 0.3
                          ? "bg-emerald-400"
                          : mainSequenceInfo.distance <= 0.6
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      )}
                      style={{ width: `${Math.min(100, mainSequenceInfo.distance * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-muted leading-relaxed">
                    {mainSequenceInfo.zoneDescription}
                  </p>
                </div>

                {/* Blast Radius & Susceptibility */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                      <Flame size={12} className="text-red-400" />
                      <span>2-Hop Blast Radius</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {repoStats.twoHopBlastRadius} <span className="text-xs font-normal text-muted">entities</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted">
                      {fanIn} direct + {repoStats.secondHopCallerCount} ripple
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                      <BarChart3 size={12} className="text-indigo-400" />
                      <span>Repo Percentile</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {repoStats.fanInPercentile}% <span className="text-xs font-normal text-muted">rank</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted">
                      Ca &gt; {repoStats.fanInPercentile}% of {repoStats.totalNodesCount} nodes
                    </p>
                  </div>
                </div>

                {/* Architectural Actionable Strategy */}
                <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold font-mono text-accent">
                      Refactoring Strategy & Coupling Remedy
                    </div>
                    <p className="text-[11px] font-mono text-muted mt-1 leading-relaxed">
                      {mainSequenceInfo.remedySuggestion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive What-If Architectural Coupling Simulator */}
          <div className="p-5 rounded-2xl border border-border bg-surface/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sliders size={14} />
                  <span>Coupling & Refactoring Simulator (What-If Analysis)</span>
                </h3>
                <p className="text-[11px] font-mono text-muted/80 mt-0.5">
                  Simulate adding callers, decoupling dependencies, or converting to abstract interfaces to observe metric shifts.
                </p>
              </div>

              {isSimulating && (
                <button
                  onClick={() => {
                    setSimDeltaCa(0);
                    setSimDeltaCe(0);
                    setSimOverrideAbstract(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-surface border border-border text-muted hover:text-foreground transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset to Actuals</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Simulate Inbound Callers (Ca) */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Simulate Callers (Ca):</span>
                  <span className="font-bold text-emerald-400">{effectiveSimCa} ({simDeltaCa >= 0 ? `+${simDeltaCa}` : simDeltaCa})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimDeltaCa((prev) => Math.max(-fanIn, prev - 1))}
                    className="w-7 h-7 rounded bg-surface border border-border text-xs font-mono font-bold hover:bg-surface-elevated cursor-pointer"
                  >
                    -1
                  </button>
                  <input
                    type="range"
                    min={-fanIn}
                    max={20}
                    value={simDeltaCa}
                    onChange={(e) => setSimDeltaCa(Number(e.target.value))}
                    className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-surface rounded-lg"
                  />
                  <button
                    onClick={() => setSimDeltaCa((prev) => prev + 1)}
                    className="w-7 h-7 rounded bg-surface border border-border text-xs font-mono font-bold hover:bg-surface-elevated cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Simulate Outbound Dependencies (Ce) */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Simulate Dependencies (Ce):</span>
                  <span className="font-bold text-indigo-400">{effectiveSimCe} ({simDeltaCe >= 0 ? `+${simDeltaCe}` : simDeltaCe})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimDeltaCe((prev) => Math.max(-fanOut, prev - 1))}
                    className="w-7 h-7 rounded bg-surface border border-border text-xs font-mono font-bold hover:bg-surface-elevated cursor-pointer"
                  >
                    -1
                  </button>
                  <input
                    type="range"
                    min={-fanOut}
                    max={20}
                    value={simDeltaCe}
                    onChange={(e) => setSimDeltaCe(Number(e.target.value))}
                    className="flex-1 accent-indigo-400 cursor-pointer h-1.5 bg-surface rounded-lg"
                  />
                  <button
                    onClick={() => setSimDeltaCe((prev) => prev + 1)}
                    className="w-7 h-7 rounded bg-surface border border-border text-xs font-mono font-bold hover:bg-surface-elevated cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Abstract Contract Toggle */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Abstract Contract (A):</span>
                  <span className="font-bold text-cyan-400">{effectiveSimAbstractness.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimOverrideAbstract(false)}
                    className={cn(
                      "flex-1 py-1 rounded text-xs font-mono border transition-all cursor-pointer",
                      effectiveSimAbstractness === 0
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "text-muted hover:text-foreground border-border"
                    )}
                  >
                    Concrete (0.0)
                  </button>
                  <button
                    onClick={() => setSimOverrideAbstract(true)}
                    className={cn(
                      "flex-1 py-1 rounded text-xs font-mono border transition-all cursor-pointer",
                      effectiveSimAbstractness === 1
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "text-muted hover:text-foreground border-border"
                    )}
                  >
                    Interface (1.0)
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Impact Banner */}
            {isSimulating && (
              <div className="p-3 rounded-xl bg-surface-elevated border border-accent/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-accent font-bold">Simulated Outcome:</span>
                  <span>
                    Instability: <strong className="text-purple-400">{simulatedInstability.toFixed(2)}</strong>{" "}
                    (was {instability.toFixed(2)})
                  </span>
                  <span>
                    Distance D: <strong className="text-cyan-400">{simulatedMainSequence.distance.toFixed(2)}</strong>{" "}
                    (was {mainSequenceInfo.distance.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold border", simulatedMainSequence.zoneColor)}>
                    {simulatedMainSequence.zone}
                  </span>
                  <span className="text-muted text-[11px]">
                    Balance: {simulatedMainSequence.balanceScore}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mathematical Derivation Proof */}
          <div className="p-5 rounded-2xl border border-border bg-surface/90 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
              <TrendingUp size={14} className="text-muted" />
              <span>Step-by-Step Mathematical Derivation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border space-y-1">
                <div className="text-muted text-[10px]">1. Instability (I) Calculation</div>
                <div className="text-purple-400 font-bold">
                  I = Ce / (Ca + Ce)
                </div>
                <div className="text-muted text-[11px]">
                  = {fanOut} / ({fanIn} + {fanOut}) = <strong className="text-foreground">{instability.toFixed(2)}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border space-y-1">
                <div className="text-muted text-[10px]">2. Abstractness (A) Calculation</div>
                <div className="text-cyan-400 font-bold">
                  A = Na / Nc
                </div>
                <div className="text-muted text-[11px]">
                  = {abstractnessInfo.abstractCount} / {abstractnessInfo.totalCount} = <strong className="text-foreground">{abstractnessInfo.abstractness.toFixed(2)}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border space-y-1">
                <div className="text-muted text-[10px]">3. Main Sequence Distance (D)</div>
                <div className="text-accent font-bold">
                  D = |A + I - 1|
                </div>
                <div className="text-muted text-[11px]">
                  = |{abstractnessInfo.abstractness.toFixed(2)} + {instability.toFixed(2)} - 1| = <strong className="text-foreground">{mainSequenceInfo.distance.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Entities Breakdown (Incoming Callers vs Outgoing Dependencies) */}
          <div className="p-5 rounded-2xl border border-border bg-surface/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              {/* Tab Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("incoming");
                    setEdgeSearch("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === "incoming"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated"
                  )}
                >
                  <ArrowDownLeft size={13} />
                  <span>Incoming Callers / Consumers ({incomingItems.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("outgoing");
                    setEdgeSearch("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === "outgoing"
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated"
                  )}
                >
                  <ArrowUpRight size={13} />
                  <span>Outgoing Dependencies ({outgoingItems.length})</span>
                </button>
              </div>

              {/* Edge Search Input */}
              {activeItems.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={12} />
                  <input
                    type="text"
                    placeholder={`Filter ${activeTab} items...`}
                    value={edgeSearch}
                    onChange={(e) => setEdgeSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent font-mono"
                  />
                  {edgeSearch && (
                    <button
                      onClick={() => setEdgeSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Entity List */}
            {filteredActiveItems.length > 0 ? (
              <div className="space-y-2">
                {filteredActiveItems.map((item) => {
                  const badgeClass = getRelationshipBadgeColor(item.relationshipKind as RelationshipKind);
                  return (
                    <EntityCard
                      key={item.edgeId}
                      nodeId={item.nodeId}
                      data={data}
                      repositoryId={repository.id}
                      action={
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono capitalize border shrink-0",
                            badgeClass
                          )}
                        >
                          {item.relationshipKind}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted font-mono text-xs">
                {activeItems.length === 0
                  ? activeTab === "incoming"
                    ? "No incoming callers or importers connect to this entity."
                    : "This entity has zero outgoing dependencies."
                  : `No ${activeTab} items matched "${edgeSearch}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

