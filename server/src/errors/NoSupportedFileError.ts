import { AppError } from "./AppError.js";

export class NoSupportedFileError extends AppError {
    constructor() {
        super("No supported files found in the repository", 400);
    }
}