export type SymbolKind =
    | "function"
    | "method"
    | "class"
    | "interface"
    | "variable"
    | "enum"
    | "typeAlias";

export interface SymbolLocation {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface ParsedSymbol {
    name: string;
    symbolKind: SymbolKind;
    location: SymbolLocation;
}