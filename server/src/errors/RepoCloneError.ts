import { AppError } from "./AppError.js";

export class RepoCloneError extends AppError {
    constructor(message: string = "Failed to clone repository") {
        super(message, 500);
    }
}