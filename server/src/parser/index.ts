import path from "path";
import { getSupportedRepositoryFiles } from "./walker/repositoryWalker.js";
import { NoSupportedFileError } from "@/errors/NoSupportedFileError.js";
import { parseFile } from "./babel/parseFile.js";
import { ParsedFile } from "./models/ParsedFile.js";
import { ParseFailure } from "./models/ParseFailure.js";
import { ParsedRepository } from "./models/ParsedRepository.js";
import { SymbolExtractror } from "./extractors/SymbolExtractor.js";

/*
* TODO: later call this parse function inside the worker
* const parser = new Parser();
* await parser.parse(repositoryPath);
*/
export class Parser {
    async parse(repositoryPath: string): Promise<ParsedRepository> {
        // --- 1. Filtering out Supported Files ---
        const supportedFiles = getSupportedRepositoryFiles(repositoryPath);

        if (supportedFiles.length === 0) {
            throw new NoSupportedFileError();
        }

        // --- 2. Parsing files and making ASTs ---
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

        const symbolExtractor = new SymbolExtractror();

        for (const parsedFile of parsedFiles) {
            symbolExtractor.extract(parsedFile);
        }

        return { repositoryPath, files: parsedFiles, failures: failedFiles, relationships: [] };
    }
}

const parser = new Parser();
const result = await parser.parse(path.join(process.cwd(), "uploads", "demo"));
console.log(result);