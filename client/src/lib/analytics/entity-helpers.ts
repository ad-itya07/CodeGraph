import type {
  GraphNode,
  SymbolKind,
  MethodKind,
  SymbolLocation,
  CycleType,
} from "@/types";
import type {
  NormalizedExplorerData,
  CodeEntityExplorerItem,
} from "@/types/explorer";
import { getRepositoryRelativePath } from "@/lib/explorer/paths";

export interface ResolvedEntity {
  canonicalNodeId: string;
  displayName: string;
  kind: "file" | "symbol" | "dependency" | "module" | "unknown";
  symbolKind?: SymbolKind;
  methodKind?: MethodKind;
  relativeFilePath: string;
  rawFilePath?: string;
  location?: SymbolLocation;
  parentSymbolName?: string;
  containerName?: string;
  fileId?: string;
}

/**
 * Resolves any canonical backend node ID (e.g. `symbol:...` or `file:...`)
 * into a rich human-readable presentation entity with repository-relative paths.
 */
export function resolveEntity(
  nodeId: string,
  data: NormalizedExplorerData | null | undefined,
  repositoryId?: string | null
): ResolvedEntity {
  if (!data) {
    const rawName = nodeId.split(":").slice(1).join(":") || nodeId;
    return {
      canonicalNodeId: nodeId,
      displayName: rawName,
      kind: "unknown",
      relativeFilePath: "",
    };
  }

  // 1. Check if it is a symbol
  const symbolItem = data.allSymbolsById.get(nodeId);
  if (symbolItem) {
    const file = data.filesById.get(symbolItem.fileId);
    const relPath = getRepositoryRelativePath(file?.filePath || symbolItem.fileId, repositoryId);
    let parentSymbolName: string | undefined;
    if (symbolItem.parentId) {
      const parent = data.allSymbolsById.get(symbolItem.parentId);
      if (parent) {
        parentSymbolName = parent.name;
      }
    }

    return {
      canonicalNodeId: nodeId,
      displayName: symbolItem.name,
      kind: "symbol",
      symbolKind: symbolItem.symbolKind,
      methodKind: symbolItem.methodKind,
      relativeFilePath: relPath,
      rawFilePath: file?.filePath,
      location: symbolItem.location,
      parentSymbolName,
      containerName: parentSymbolName || (relPath.split("/").pop() ?? undefined),
      fileId: symbolItem.fileId,
    };
  }

  // 2. Check if it is a file
  const fileNode = data.filesById.get(nodeId);
  if (fileNode) {
    const relPath = getRepositoryRelativePath(fileNode.filePath, repositoryId);
    const fileName = relPath.split("/").pop() || relPath;
    return {
      canonicalNodeId: nodeId,
      displayName: fileName,
      kind: "file",
      relativeFilePath: relPath,
      rawFilePath: fileNode.filePath,
      fileId: fileNode.id,
    };
  }

  // 3. Check if it is a dependency
  const depNode = data.allDependenciesById.get(nodeId);
  if (depNode) {
    return {
      canonicalNodeId: nodeId,
      displayName: `${depNode.name}${depNode.version ? `@${depNode.version}` : ""}`,
      kind: "dependency",
      relativeFilePath: depNode.packageJsonPath
        ? getRepositoryRelativePath(depNode.packageJsonPath, repositoryId)
        : "",
    };
  }

  // 4. Check if it is a module
  const modNode = data.allModulesById.get(nodeId);
  if (modNode) {
    return {
      canonicalNodeId: nodeId,
      displayName: modNode.name,
      kind: "module",
      relativeFilePath: "",
    };
  }

  // 5. Fallback raw parse
  const parts = nodeId.split(":");
  const fallbackName = parts.length > 1 ? parts[parts.length - 1] : nodeId;
  return {
    canonicalNodeId: nodeId,
    displayName: fallbackName,
    kind: "unknown",
    relativeFilePath: "",
  };
}

/**
 * Calculates the Martin Instability Index: I = fanOut / (fanIn + fanOut)
 * Range: 0.0 (completely stable) to 1.0 (completely unstable/efferent).
 */
export function calculateInstability(fanIn: number, fanOut: number): number {
  const total = fanIn + fanOut;
  if (total === 0) return 0;
  return Math.round((fanOut / total) * 100) / 100;
}

export interface AbstractnessResult {
  abstractness: number; // 0.0 (concrete) to 1.0 (pure abstract)
  abstractCount: number;
  totalCount: number;
  isAbstract: boolean;
  abstractnessLabel: string;
}

/**
 * Calculates Abstractness (A) for an entity or file: A = Na / Nc
 * where Na is the number of abstract types/interfaces and Nc is total types/classes.
 */
export function calculateAbstractness(
  nodeId: string,
  data: NormalizedExplorerData | null | undefined
): AbstractnessResult {
  if (!data) {
    return {
      abstractness: 0,
      abstractCount: 0,
      totalCount: 1,
      isAbstract: false,
      abstractnessLabel: "Concrete Entity",
    };
  }

  // If it's a symbol
  const symbolItem = data.allSymbolsById.get(nodeId);
  if (symbolItem) {
    const isAbs = symbolItem.symbolKind === "interface" || symbolItem.symbolKind === "typeAlias";
    return {
      abstractness: isAbs ? 1 : 0,
      abstractCount: isAbs ? 1 : 0,
      totalCount: 1,
      isAbstract: isAbs,
      abstractnessLabel: isAbs ? "Pure Abstract Contract (Interface / Type)" : `Concrete ${symbolItem.symbolKind}`,
    };
  }

  // If it's a file
  const fileNode = data.filesById.get(nodeId);
  if (fileNode) {
    const symbols = data.symbolsByFileId.get(nodeId) || [];
    if (symbols.length === 0) {
      const isDef = fileNode.filePath.endsWith(".d.ts");
      return {
        abstractness: isDef ? 1 : 0,
        abstractCount: isDef ? 1 : 0,
        totalCount: 1,
        isAbstract: isDef,
        abstractnessLabel: isDef ? "Type Definition File (.d.ts)" : "Implementation File",
      };
    }

    const abstractCount = symbols.filter(
      (s) => s.symbolKind === "interface" || s.symbolKind === "typeAlias"
    ).length;
    const abstractness = Math.round((abstractCount / symbols.length) * 100) / 100;

    return {
      abstractness,
      abstractCount,
      totalCount: symbols.length,
      isAbstract: abstractness >= 0.5,
      abstractnessLabel:
        abstractness === 1
          ? "Pure Abstract Contract Module"
          : abstractness > 0
          ? `Hybrid (${abstractCount}/${symbols.length} abstract declarations)`
          : "Pure Concrete Implementation",
    };
  }

  return {
    abstractness: 0,
    abstractCount: 0,
    totalCount: 1,
    isAbstract: false,
    abstractnessLabel: "Concrete Entity",
  };
}

export type MainSequenceZone = "Zone of Pain" | "Main Sequence" | "Zone of Uselessness";

export interface MainSequenceResult {
  distance: number; // D = |A + I - 1|, range [0, 1]
  normalizedDistance: number; // distance relative to max sqrt(2) or 1
  zone: MainSequenceZone;
  zoneColor: string;
  zoneDescription: string;
  balanceScore: number; // 0% to 100% (100% = directly on Main Sequence line)
  remedySuggestion: string;
}

/**
 * Calculates Distance from Main Sequence: D = |A + I - 1|
 * Identifies Zone of Pain vs. Zone of Uselessness vs. Balanced Main Sequence.
 */
export function calculateDistanceMainSequence(
  abstractness: number,
  instability: number
): MainSequenceResult {
  const sum = abstractness + instability;
  const rawD = Math.abs(sum - 1);
  const distance = Math.round(rawD * 100) / 100;
  const balanceScore = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));

  if (sum < 0.7) {
    return {
      distance,
      normalizedDistance: distance,
      zone: "Zone of Pain",
      zoneColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      zoneDescription:
        "Highly concrete yet highly stable. Many components depend on this concrete implementation rather than abstract interfaces, making modifications rigid and risky.",
      balanceScore,
      remedySuggestion:
        "Extract interfaces or abstract contracts so dependent modules depend on abstractions rather than concrete classes.",
    };
  }

  if (sum > 1.3) {
    return {
      distance,
      normalizedDistance: distance,
      zone: "Zone of Uselessness",
      zoneColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      zoneDescription:
        "Highly abstract yet highly volatile. Abstract contracts with few callers that depend heavily on external entities. May indicate dead abstractions or over-engineering.",
      balanceScore,
      remedySuggestion:
        "Consolidate unused interfaces with concrete implementations or reduce external dependencies.",
    };
  }

  return {
    distance,
    normalizedDistance: distance,
    zone: "Main Sequence",
    zoneColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    zoneDescription:
      "Optimal architectural balance. Abstractness and stability are harmoniously aligned according to Clean Architecture package principles.",
    balanceScore,
    remedySuggestion:
      "Maintain current architectural boundary. Keep public interfaces stable and decouple volatile helpers.",
  };
}

export interface RepositoryCouplingStats {
  totalNodesCount: number;
  fanInPercentile: number; // 0 to 100 (e.g. 95 = higher than 95% of entities)
  fanOutPercentile: number;
  avgFanIn: number;
  avgFanOut: number;
  twoHopBlastRadius: number;
  directCallerCount: number;
  secondHopCallerCount: number;
}

/**
 * Computes repository-wide comparative percentiles and 2-degree transitive blast radius.
 */
export function calculateRepositoryCouplingStats(
  nodeId: string,
  data: NormalizedExplorerData | null | undefined
): RepositoryCouplingStats {
  if (!data) {
    return {
      totalNodesCount: 1,
      fanInPercentile: 50,
      fanOutPercentile: 50,
      avgFanIn: 0,
      avgFanOut: 0,
      twoHopBlastRadius: 0,
      directCallerCount: 0,
      secondHopCallerCount: 0,
    };
  }

  const allNodeIds = Array.from(data.nodesById.keys());
  const totalNodesCount = Math.max(1, allNodeIds.length);

  const fanInList: number[] = [];
  const fanOutList: number[] = [];
  let sumFanIn = 0;
  let sumFanOut = 0;

  for (const id of allNodeIds) {
    const inCount = data.incomingEdgesByNodeId.get(id)?.length || 0;
    const outCount = data.outgoingEdgesByNodeId.get(id)?.length || 0;
    fanInList.push(inCount);
    fanOutList.push(outCount);
    sumFanIn += inCount;
    sumFanOut += outCount;
  }

  const targetIn = data.incomingEdgesByNodeId.get(nodeId)?.length || 0;
  const targetOut = data.outgoingEdgesByNodeId.get(nodeId)?.length || 0;

  const lowerInCount = fanInList.filter((c) => c < targetIn).length;
  const lowerOutCount = fanOutList.filter((c) => c < targetOut).length;

  const fanInPercentile = Math.round((lowerInCount / totalNodesCount) * 100);
  const fanOutPercentile = Math.round((lowerOutCount / totalNodesCount) * 100);
  const avgFanIn = Math.round((sumFanIn / totalNodesCount) * 10) / 10;
  const avgFanOut = Math.round((sumFanOut / totalNodesCount) * 10) / 10;

  // 2-Hop blast radius calculation
  const directCallers = new Set<string>();
  const directEdges = data.incomingEdgesByNodeId.get(nodeId) || [];
  for (const e of directEdges) {
    if (e.sourceId !== nodeId) {
      directCallers.add(e.sourceId);
    }
  }

  const secondHopCallers = new Set<string>();
  for (const callerId of directCallers) {
    const secondEdges = data.incomingEdgesByNodeId.get(callerId) || [];
    for (const e of secondEdges) {
      if (e.sourceId !== nodeId && !directCallers.has(e.sourceId)) {
        secondHopCallers.add(e.sourceId);
      }
    }
  }

  return {
    totalNodesCount,
    fanInPercentile,
    fanOutPercentile,
    avgFanIn,
    avgFanOut,
    twoHopBlastRadius: directCallers.size + secondHopCallers.size,
    directCallerCount: directCallers.size,
    secondHopCallerCount: secondHopCallers.size,
  };
}

export interface ArchitecturalRoleInfo {
  role: string;
  badgeClass: string;
  description: string;
  stabilityLabel: "High Stability" | "Moderate Stability" | "High Instability" | "Isolated";
  blastRadiusSeverity: "Low" | "Moderate" | "High" | "Critical";
  volatilitySeverity: "Low" | "Moderate" | "High";
  refactoringAdvice: string;
  stabilityPercentage: number;
  volatilityPercentage: number;
}

/**
 * Derives architectural interpretation based on fan-in and fan-out counts.
 */
export function getArchitecturalRole(
  fanIn: number,
  fanOut: number
): ArchitecturalRoleInfo {
  const total = fanIn + fanOut;
  const instability = calculateInstability(fanIn, fanOut);
  const volatilityPercentage = Math.round(instability * 100);
  const stabilityPercentage = 100 - volatilityPercentage;

  if (total === 0) {
    return {
      role: "Isolated Entity",
      badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      description: "No incoming or outgoing connections detected across the repository.",
      stabilityLabel: "Isolated",
      blastRadiusSeverity: "Low",
      volatilitySeverity: "Low",
      refactoringAdvice: "Potential dead code candidate or standalone entrypoint. Safe to refactor without affecting other modules.",
      stabilityPercentage: 100,
      volatilityPercentage: 0,
    };
  }

  if (fanIn >= 10 && fanOut <= 2) {
    return {
      role: "Foundational Utility / Core Contract",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: `Widely consumed across ${fanIn} callers with minimal external dependencies (${fanOut}). Highly stable anchor.`,
      stabilityLabel: "High Stability",
      blastRadiusSeverity: "Critical",
      volatilitySeverity: "Low",
      refactoringAdvice: `Extremely critical contract. Internal implementation changes are safe, but any breaking API signature changes will ripple to ${fanIn} consumers. Comprehensive regression tests required.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  if (fanIn >= 5 && fanOut <= 2) {
    return {
      role: "Foundational Utility / Leaf",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: `Consistently reused by ${fanIn} callers with low outbound coupling (${fanOut}). High stability.`,
      stabilityLabel: "High Stability",
      blastRadiusSeverity: "High",
      volatilitySeverity: "Low",
      refactoringAdvice: `Stable component. Modifying internal logic is safe, but public exports must remain backward-compatible to avoid breaking ${fanIn} callers.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  if (fanIn <= 2 && fanOut >= 6) {
    return {
      role: "Application Entry Point / Bootstrap",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description: `Orchestrates ${fanOut} downstream dependencies with few callers. High efferent volatility.`,
      stabilityLabel: "High Instability",
      blastRadiusSeverity: "Low",
      volatilitySeverity: "High",
      refactoringAdvice: `Volatile orchestrator. Susceptible to breaking whenever any of its ${fanOut} dependencies change, but changing this component will have minimal blast radius on the rest of the codebase.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  if (fanIn >= 5 && fanOut >= 5) {
    return {
      role: "Central Hub / God Component",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: `Heavily coupled both upstream (${fanIn} callers) and downstream (${fanOut} dependencies). High architectural risk.`,
      stabilityLabel: "Moderate Stability",
      blastRadiusSeverity: "Critical",
      volatilitySeverity: "High",
      refactoringAdvice: `Architectural bottleneck. High risk because it is both fragile to dependency changes (${fanOut}) AND has a massive blast radius on consumers (${fanIn}). Consider decomposing into smaller, focused single-responsibility services.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  if (fanIn === 0 && fanOut > 0) {
    return {
      role: "Top-Level Consumer / Root",
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: `Consumes ${fanOut} dependencies but is not imported or called elsewhere.`,
      stabilityLabel: "High Instability",
      blastRadiusSeverity: "Low",
      volatilitySeverity: fanOut >= 5 ? "High" : "Moderate",
      refactoringAdvice: `Safe from breaking callers (0 blast radius), but relies heavily on ${fanOut} external modules.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  if (fanIn > 0 && fanOut === 0) {
    return {
      role: "Pure Dependency / Terminal Leaf",
      badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      description: `Pure terminal dependency. Relies on 0 internal modules while serving ${fanIn} callers.`,
      stabilityLabel: "High Stability",
      blastRadiusSeverity: fanIn >= 5 ? "High" : "Moderate",
      volatilitySeverity: "Low",
      refactoringAdvice: `Zero volatility. Will never break due to internal downstream changes. Protect API consistency for ${fanIn} callers.`,
      stabilityPercentage,
      volatilityPercentage,
    };
  }

  const blastRadiusSeverity = fanIn >= 5 ? "High" : fanIn >= 2 ? "Moderate" : "Low";
  const volatilitySeverity = fanOut >= 5 ? "High" : fanOut >= 2 ? "Moderate" : "Low";

  return {
    role: "Balanced Component",
    badgeClass: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    description: `Moderate coupling balance (${fanIn} incoming callers, ${fanOut} outgoing dependencies).`,
    stabilityLabel: instability < 0.3 ? "High Stability" : instability > 0.7 ? "High Instability" : "Moderate Stability",
    blastRadiusSeverity,
    volatilitySeverity,
    refactoringAdvice: `Balanced architectural node. ${fanIn} consumers and ${fanOut} dependencies. Keep unit test coverage around its integration boundaries.`,
    stabilityPercentage,
    volatilityPercentage,
  };
}

export interface CycleTypeMeta {
  label: string;
  shortLabel: string;
  description: string;
  colorClass: string;
  badgeClass: string;
  dotClass: string;
}

export const CYCLE_TYPE_CONFIG: Record<CycleType, CycleTypeMeta> = {
  "file-import": {
    label: "File Import Cycle",
    shortLabel: "File Imports",
    description: "Circular module dependencies via import statements",
    colorClass: "text-blue-400",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-400",
  },
  "symbol-call": {
    label: "Symbol Call Recursion Cycle",
    shortLabel: "Function/Method Calls",
    description: "Mutually recursive function/method call chains",
    colorClass: "text-purple-400",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-400",
  },
  "symbol-inheritance": {
    label: "Class Inheritance Cycle",
    shortLabel: "Inheritance",
    description: "Circular class inheritance hierarchies (extends)",
    colorClass: "text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-400",
  },
  "symbol-implementation": {
    label: "Interface Implementation Cycle",
    shortLabel: "Implementation",
    description: "Circular interface implementations (implements)",
    colorClass: "text-teal-400",
    badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    dotClass: "bg-teal-400",
  },
  "symbol-instantiation": {
    label: "Symbol Instantiation Cycle",
    shortLabel: "Instantiation",
    description: "Mutually instantiating constructor cycles (new)",
    colorClass: "text-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-400",
  },
};

/**
 * Formats any API or network error into a clear, user-understandable message.
 * Handles backend error JSON `{ success: false, message: "..." }`, HTTP status codes,
 * and network connection refused/server down scenarios.
 */
export function formatApiError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const err = error as any;

    // 1. Backend error JSON response message
    if (err.response?.data?.message && typeof err.response.data.message === "string") {
      return err.response.data.message;
    }
    if (err.response?.data?.error && typeof err.response.data.error === "string") {
      return err.response.data.error;
    }

    // 2. HTTP status code classifications
    if (err.response?.status === 500) {
      return "Internal Server Error (500). The CodeGraph server encountered an issue processing this request.";
    }
    if (err.response?.status === 502 || err.response?.status === 503 || err.response?.status === 504) {
      return "Backend service is unreachable (502/503/504). Please ensure the CodeGraph server is running.";
    }
    if (err.response?.status === 404) {
      return "The requested repository or entity was not found (404).";
    }
    if (err.response?.status === 403) {
      return "Access denied (403). You do not have permission for this repository.";
    }
    if (err.response?.status === 400) {
      return "Invalid request parameters (400). Please check your selected entity.";
    }

    // 3. Network error / Server down / Connection refused
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Cannot connect to CodeGraph API server. The backend server appears to be offline or unreachable on port 8000.";
    }
    if (err.code === "ECONNREFUSED") {
      return "Connection refused. Please start the backend server with 'npm run dev' on port 8000.";
    }
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return "Request timed out. The server took too long to complete this analysis.";
    }

    if (err.message && typeof err.message === "string") {
      return err.message;
    }
  }

  return "An unexpected error occurred while communicating with the server.";
}
