import { ParsedPackageJson } from "./ParsedPackageJson.js";
import { ParsedPathConfig } from "./ParsedPathConfig.js";

export interface RepositoryMetadata {
    packageJsons: ParsedPackageJson[];
    pathConfigs: ParsedPathConfig[];
}