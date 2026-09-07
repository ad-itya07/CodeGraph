import { AppError } from "./AppError.js"

export class CommitShaError extends AppError {
    constructor(message: string = "Failed to get commit SHA") {
        super(message, 500);
    }
}