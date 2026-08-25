import { RelationshipKind } from "@/parser/models/ParsedRelationship.js";

export interface GraphEdge {
    id: string;

    sourceId: string;
    targetId: string;

    relationshipKind: RelationshipKind;
}