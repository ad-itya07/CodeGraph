import fs from "fs";
import { ParsedPathConfig } from "../models/ParsedPathConfig.js";
import { PathAlias } from "../models/PathAlias.js";
import { parse } from "jsonc-parser";

export class PathConfigExtractor {
    extract(filePath: string): ParsedPathConfig {
        const content = fs.readFileSync(filePath, "utf-8");

        const config = parse(content);

        const compilerOptions = config.compilerOptions ?? {};

        const baseUrl = compilerOptions.baseUrl;

        const pathAliases = this.extractPathAliases(compilerOptions.paths);

        return { filePath, baseUrl, pathAliases };
    }

    private extractPathAliases(paths: Record<string, string[]> | undefined): PathAlias[] {
        if (!paths) return [];

        return Object.entries(paths).map(([alias, aliasPaths]) => ({
            alias,
            paths: aliasPaths
        }));
    }
}