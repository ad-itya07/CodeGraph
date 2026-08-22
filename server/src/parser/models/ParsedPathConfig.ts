import { PathAlias } from "./PathAlias.js";

export interface ParsedPathConfig {
    filePath: string;

    baseUrl?: string;

    pathAliases: PathAlias[];
}