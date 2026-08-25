import { AppError } from "./AppError.js";

export class GraphIndexError extends AppError {
    public readonly description: string;

    constructor(description: string) {
        super(description, 500);
        this.description = description;
    }
}