export type RelationshipEntityKind =
    | "file"
    | "symbol"
    | "module";

export type RelationshipKind =
    | "calls"
    | "imports"
    | "exports"
    | "extends"
    | "implements"
    | "instantiates"
    | "references";

export interface ParsedRelationship {
    id: string;

    sourceId: string;
    sourceKind: RelationshipEntityKind;

    targetId: string;
    targetKind: RelationshipEntityKind;

    relationshipKind: RelationshipKind;
}