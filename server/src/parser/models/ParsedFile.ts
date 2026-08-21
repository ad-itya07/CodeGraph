import { File } from "@babel/types";
import { ParsedSymbol } from "./ParsedSymbol.js";

export interface ParsedExport {
    exportedName: string;
    symbolId: string;
}

export interface ParsedFile {
    filePath: string;
    ast: File;

    symbols: ParsedSymbol[];
    exports: ParsedExport[];
}