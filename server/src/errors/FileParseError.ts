import { AppError } from "./AppError.js";

export class FileParseError extends AppError {
    constructor(filePath: string, cause: unknown) {
        super(`Failed to parse file ${filePath}`, 500);
        this.cause = cause;
    }
}