import { ParsedDependency } from "./ParsedDependency.js";

export interface ParsedPackageJson {
    filePath: string;

    name?: string;

    dependencies: ParsedDependency[];

    devDependencies: ParsedDependency[];
}