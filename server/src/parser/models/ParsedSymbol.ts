export type SymbolKind =
    | "function"
    | "method"
    | "class"
    | "interface"
    | "variable"
    | "enum"
    | "typeAlias"
    | "objectProperty";

export interface SymbolLocation {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export type MethodKind =
    | "get"
    | "set"
    | "method"
    | "private";

export interface ParsedSymbol {
    id: string;
    name: string;
    symbolKind: SymbolKind;
    methodKind?: MethodKind;
    location: SymbolLocation;
    parentSymbolId?: string;
}