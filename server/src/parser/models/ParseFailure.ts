export interface ParseFailure {
    filePath: string;
    message: string;
    cause?: unknown;
}