import { ParsedFile } from "./ParsedFile.js";
import { ParsedRelationship } from "./ParsedRelationship.js";
import { ParseFailure } from "./ParseFailure.js";

export interface ParsedRepository {
    repositoryPath: string;
    files: ParsedFile[];
    relationships: ParsedRelationship[];
    failures: ParseFailure[];
}