import { ParsedFile } from "./ParsedFile.js";
import { ParseFailure } from "./ParseFailure.js";

export interface ParseResult {
    parsedFiles: ParsedFile[];
    failedFiles: ParseFailure[];
}