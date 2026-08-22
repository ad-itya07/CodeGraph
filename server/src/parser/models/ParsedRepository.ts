import { ParsedFile } from "./ParsedFile.js";
import { ParsedRelationship } from "./ParsedRelationship.js";
import { ParseFailure } from "./ParseFailure.js";
import { RepositoryMetadata } from "./RepositoryMetadata.js";

export interface ParsedRepository {
    repositoryPath: string;
    files: ParsedFile[];
    metadata: RepositoryMetadata;
    relationships: ParsedRelationship[];
    failures: ParseFailure[];
}