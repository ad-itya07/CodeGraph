import { AppError } from "./AppError.js";

export class DatabaseError extends AppError {
    constructor(message:string) {
        super(message, 500);
    }
}