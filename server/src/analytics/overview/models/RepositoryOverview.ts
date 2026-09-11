import { RepositoryHealthResult } from "@/analytics/health/CalculateHealthIndex.js";

export interface RepositoryStatistics {
    fileCount: number;
    symbolCount: number;
    relationshipCount: number;
    dependencyCount: number;
    moduleCount: number;
}

export interface RepositoryInsights {
    mostConnectedFileId: string | null;
    mostConnectedFileConnections: number;

    mostConnectedSymbolId: string | null;
    mostConnectedSymbolConnections: number;

    highestFanInSymbolId: string | null;
    highestFanIn: number;

    highestFanOutSymbolId: string | null;
    highestFanOut: number;

    cycleCount: number;
}

export interface RepositoryOverview {
    statistics: RepositoryStatistics;

    health: RepositoryHealthResult;

    insights: RepositoryInsights;
}