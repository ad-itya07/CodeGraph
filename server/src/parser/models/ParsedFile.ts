import { File } from "@babel/types";
import { ParsedSymbol } from "./ParsedSymbol.js";

export interface ParsedFile {
    filePath: string;
    ast: File;

    symbols: ParsedSymbol[];
}