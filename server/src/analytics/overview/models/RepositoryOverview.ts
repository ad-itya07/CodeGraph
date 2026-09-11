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
    mostConnectedSymbolId: string | null;
    highestFanInSymbolId: string | null;
    highestFanOutSymbolId: string | null;
    cycleCount: number;
}

export interface RepositoryOverview {
    statistics: RepositoryStatistics;

    health: RepositoryHealthResult;

    insights: RepositoryInsights;
}