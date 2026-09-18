import path from "path";
import { getRepositoryFiles } from "./walker/repositoryWalker.js";
import { NoSupportedFileError } from "@/errors/NoSupportedFileError.js";
import { parseFile } from "./babel/parseFile.js";
import { ParsedFile } from "./models/ParsedFile.js";
import { ParseFailure } from "./models/ParseFailure.js";
import { ParsedRepository } from "./models/ParsedRepository.js";
import { SymbolExtractor } from "./extractors/SymbolExtractor.js";
import { RelationshipExtractor } from "./extractors/RelationshipExtractor.js";
import { PackageJsonExtractor } from "./extractors/PackageJsonExtractor.js";
import { PathConfigExtractor } from "./extractors/PathConfigExtractor.js";
import { RepositoryMetadata } from "./models/RepositoryMetadata.js";

export type ParserStage = 
  | "PARSING_METADATA"
  | "PARSING_PATH_CONFIG"
  | "PARSING_SYMBOLS"
  | "PARSING_RELATIONSHIPS";

export class Parser {
    async parse(
        repositoryPath: string,
        onStageChange?: (stage: ParserStage) => Promise<void> | void
    ): Promise<ParsedRepository> {
        repositoryPath = path.resolve(repositoryPath);

        // --- 1. Getting repository files ---
        const repositoryFiles = getRepositoryFiles(repositoryPath);

        const supportedFiles = repositoryFiles.sourceFiles;
        if (supportedFiles.length === 0) {
            throw new NoSupportedFileError();
        }

        // --- 2. Extracting metadata from package.json ---
        if (onStageChange) {
            await onStageChange("PARSING_METADATA");
        }
        const packageJsonExtractor = new PackageJsonExtractor();
        const packageJsons = repositoryFiles.packageJsonFiles.map(
            (filePath) => packageJsonExtractor.extract(filePath)
        );

        // --- 3. Extracting path configurations from tsconfig.json / jsconfig.json ---
        if (onStageChange) {
            await onStageChange("PARSING_PATH_CONFIG");
        }
        const pathConfigExtractor = new PathConfigExtractor();
        const pathConfigs = [
            ...repositoryFiles.tsconfigJsonFiles,
            ...repositoryFiles.jsconfigJsonFiles
        ].map((filePath) => pathConfigExtractor.extract(filePath));

        const metadata: RepositoryMetadata = {
            packageJsons,
            pathConfigs
        };

        // --- 4. Parsing files, making ASTs, and extracting symbols ---
        if (onStageChange) {
            await onStageChange("PARSING_SYMBOLS");
        }
        const parsedFiles: ParsedFile[] = [];
        const failedFiles: ParseFailure[] = [];
        for (const file of supportedFiles) {
            try {
                parsedFiles.push(parseFile(file));
            } catch (err: unknown) {
                if (err instanceof Error) {
                    failedFiles.push({ filePath: file, message: err.message, cause: err });
                } else {
                    failedFiles.push({ filePath: file, message: "Unknown parsing error", cause: err });
                }
            }
        }

        const symbolExtractor = new SymbolExtractor();
        for (const parsedFile of parsedFiles) {
            symbolExtractor.extract(parsedFile);
        }

        // --- 5. Extracting relationships between symbols and files ---
        if (onStageChange) {
            await onStageChange("PARSING_RELATIONSHIPS");
        }
        const relationshipExtractor = new RelationshipExtractor();
        const relationships = relationshipExtractor.extract(parsedFiles, metadata);

        // --- Returning the Parsed Repository ---
        return { repositoryPath, files: parsedFiles, metadata, failures: failedFiles, relationships };
    }
}

