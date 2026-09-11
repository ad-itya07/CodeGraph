import { AppError } from "./AppError.js";

export class GraphNotFoundError extends AppError {
    constructor(message: string = "Graph not found") {
        super(message, 404);
    }
}
    
    