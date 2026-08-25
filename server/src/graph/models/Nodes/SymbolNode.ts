import { SymbolKind } from "@/parser/models/ParsedSymbol.js";

export interface SymbolNode {
    id: string;
    kind: "symbol";

    name: string;
    symbolKind: SymbolKind;

    fileId: string;
}