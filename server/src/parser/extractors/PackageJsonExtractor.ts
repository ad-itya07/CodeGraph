import fs from "fs";
import { ParsedPackageJson } from "../models/ParsedPackageJson.js";
import { ParsedDependency } from "../models/ParsedDependency.js";

export class PackageJsonExtractor {
    extract(filePath: string): ParsedPackageJson {
        const content = fs.readFileSync(filePath, "utf-8");

        const packageJson = JSON.parse(content);

        const dependencies = this.extractDependencies(packageJson.dependencies, filePath);

        const devDependencies = this.extractDependencies(packageJson.devDependencies, filePath);

        return { filePath, name: packageJson.name, dependencies, devDependencies };
    }

    private extractDependencies(dependencies: Record<string, string> | undefined, packageJsonPath: string): ParsedDependency[] {
        if (!dependencies) return [];

        return Object.entries(dependencies).map(([name, version]) => ({
            id: `${packageJsonPath}:${name}`,
            name,
            version
        }));
    }
}