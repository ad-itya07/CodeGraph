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

/*
* TODO: later call this parse function inside the worker
* const parser = new Parser();
* await parser.parse(repositoryPath);
*/
export class Parser {
    async parse(repositoryPath: string): Promise<ParsedRepository> {
        // --- 1. Getting repository files ---
        const repositoryFiles = getRepositoryFiles(repositoryPath);

        const supportedFiles = repositoryFiles.sourceFiles;
        if (supportedFiles.length === 0) {
            throw new NoSupportedFileError();
        }

        // --- 2. Extracting metadata from package.json and tsconfig.json/jsconfig.json ---
        const packageJsonExtractor = new PackageJsonExtractor();
        const pathConfigExtractor = new PathConfigExtractor();

        const packageJsons = repositoryFiles.packageJsonFiles.map(
            (filePath) => packageJsonExtractor.extract(filePath)
        );

        const pathConfigs = [
            ...repositoryFiles.tsconfigJsonFiles,
            ...repositoryFiles.jsconfigJsonFiles
        ].map((filePath) => pathConfigExtractor.extract(filePath));

        const metadata: RepositoryMetadata = {
            packageJsons,
            pathConfigs
        };

        // --- 3. Parsing files and making ASTs ---
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

        // --- 4. Extracting symbols for each parsed File ---
        const symbolExtractor = new SymbolExtractor();

        for (const parsedFile of parsedFiles) {
            symbolExtractor.extract(parsedFile);
        }

        // --- 5. Extracting relationships between symbols and files ---
        const relationshipExtractor = new RelationshipExtractor();

        const relationships = relationshipExtractor.extract(parsedFiles, metadata);

        // --- Returning the Parsed Repository ---
        return { repositoryPath, files: parsedFiles, metadata, failures: failedFiles, relationships };
    }
}
