import { RelationshipKind } from "@/parser/models/ParsedRelationship.js";

export interface TraversalOptions {
    direction: "outgoing" | "incoming";
    relationshipKinds?: RelationshipKind[];
    maxDepth?: number;
}