import { AppError } from "./AppError.js";

export class GraphValidationError extends AppError {
    public readonly edgeId: string;
    public readonly sourceNodeId: string;
    public readonly targetNodeId: string;

    constructor(
        edgeId: string,
        sourceNodeId: string,
        targetNodeId: string,
    ) {
        const message =
            `Edge "${edgeId}" references a non-existent node. ` +
            `Source: "${sourceNodeId}", Target: "${targetNodeId}"`;

        super(message, 500);

        this.edgeId = edgeId;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
    }
}