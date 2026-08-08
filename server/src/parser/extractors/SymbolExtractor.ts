import { ParsedFile } from "../models/ParsedFile.js";
import traverse, { NodePath } from "@babel/traverse";
import { ArrowFunctionExpression, ClassDeclaration, ClassExpression, FunctionDeclaration, FunctionExpression, TSInterfaceDeclaration } from "@babel/types";
import { ParsedSymbol, SymbolKind, SymbolLocation } from "../models/ParsedSymbol.js";

type SupportedSymbolNode =
    | FunctionDeclaration
    | ArrowFunctionExpression
    | FunctionExpression
    | ClassDeclaration
    | ClassExpression
    | TSInterfaceDeclaration;

export class SymbolExtractor {
    /*
    * Helper function to push symbol into the parsed file.
    */
    private addSymbol(parsedFile: ParsedFile, symbol: ParsedSymbol): void {
        parsedFile.symbols.push(symbol);
    }

    /* ===========================
    * Helper Functions for extracting symbols
    =========================== */

    // get symbol name from the path
    private getSymbolName(path: NodePath<SupportedSymbolNode>): string | null {
        if (path.isFunctionDeclaration()) {
            return path.node.id?.name || "";
        }

        if (path.parentPath?.isVariableDeclarator()) {
            const id = path.parentPath.node.id;

            if (id.type === "Identifier") {
                return id.name;
            }
        }

        if (path.isClassDeclaration() || path.isClassExpression()) {
            return path.node.id?.name || "";
        }

        if (path.isTSInterfaceDeclaration()) {
            return path.node.id.name;
        }

        return null;
    }

    // create location object from path
    private buildSymbolLocation(path: NodePath): SymbolLocation {
        const loc = path.node.loc;
        if (!loc) return { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 };

        return {
            startLine: loc.start.line,
            startColumn: loc.start.column,
            endLine: loc.end.line,
            endColumn: loc.end.column
        }
    }

    // build symbol
    private buildSymbol(name: string, symbolKind: SymbolKind, path: NodePath): ParsedSymbol {
        return {
            name,
            symbolKind,
            location: this.buildSymbolLocation(path),
        }
    }

    // extract symbol from the path
    private extractSymbol(path: NodePath<SupportedSymbolNode>, parsedFile: ParsedFile, kind: SymbolKind): void {
        const name = this.getSymbolName(path);
        if (!name) return;

        this.addSymbol(
            parsedFile,
            this.buildSymbol(
                name,
                kind,
                path
            )
        )
    }

    extract(parsedFile: ParsedFile): void {
        traverse.default(parsedFile.ast, {

            // FunctionDeclaration Extractor (using arrow-function to preserve `this` for SymbolConstructor)
            FunctionDeclaration: (path: NodePath<FunctionDeclaration>) => {
                this.extractSymbol(path, parsedFile, "function");
            },

            // ArrowFunctionExpression Extractor
            ArrowFunctionExpression: (path: NodePath<ArrowFunctionExpression>) => {
                this.extractSymbol(path, parsedFile, "function");
            },

            // FunctionExpression Extractor
            FunctionExpression: (path: NodePath<FunctionExpression>) => {
                this.extractSymbol(path, parsedFile, "function");
            },

            // ClassDeclaration Extractor
            ClassDeclaration: (path: NodePath<ClassDeclaration>) => {
                this.extractSymbol(path, parsedFile, "class");
            },

            // ClassExpression Extractor
            ClassExpression: (path: NodePath<ClassExpression>) => {
                this.extractSymbol(path, parsedFile, "class");
            },

            // Interface Extractor
            TSInterfaceDeclaration: (path: NodePath<TSInterfaceDeclaration>) => {
                this.extractSymbol(path, parsedFile, "interface");
            },
        })
    }
}