import { ParsedFile } from "../models/ParsedFile.js";
import traverse, { NodePath } from "@babel/traverse";
import { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression } from "@babel/types";
import { ParsedSymbol, SymbolLocation } from "../models/ParsedSymbol.js";

export class SymbolExtractror {
    /*
    * Helper function to push symbol into the parsed file.
    */
    private addSymbol(parsedFile: ParsedFile, symbol: ParsedSymbol): void {
        parsedFile.symbols.push(symbol);
    }

    /* ===========================
    * Helper Functions for extracting symbols
    =========================== */
    
    // get function name from the path
    private getFunctionName(path: NodePath<FunctionDeclaration | ArrowFunctionExpression | FunctionExpression>): string | null {
        if (path.isFunctionDeclaration()) {
            return path.node.id?.name || "";
        } else if (path.parentPath?.isVariableDeclarator()) {
            const id = path.parentPath.node.id;

            if (id.type === "Identifier") {
                return id.name;
            }
        }
        return null;
    }

    // create location object from path
    private createLocation(path: NodePath): SymbolLocation {
        const loc = path.node.loc;
        if (!loc) return { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 };

        return {
            startLine: loc.start.line,
            startColumn: loc.start.column,
            endLine: loc.end.line,
            endColumn: loc.end.column
        }
    }

    // build function symbol
    private buildFunctionSymbol(name: string, path: NodePath): ParsedSymbol {
        return {
            name,
            symbolKind: "function",
            location: this.createLocation(path),
        }
    }

    // extract function symbol from the path
    private extractFunctionSymbol(path: NodePath<FunctionDeclaration | ArrowFunctionExpression | FunctionExpression>, parsedFile: ParsedFile): void {
        const name = this.getFunctionName(path);
        if(!name) return;
        
        this.addSymbol(
            parsedFile,
            this.buildFunctionSymbol(
                name,
                path
            )
        )
    }

    extract(parsedFile: ParsedFile): void {
        traverse.default(parsedFile.ast, {

            // FunctionDeclaration Extractor (using arrow-function to preserve `this` for SymbolConstructor)
            FunctionDeclaration: (path: NodePath<FunctionDeclaration>) => {
                this.extractFunctionSymbol(path, parsedFile);
            },

            // ArrowFunctionExpression Extractor
            ArrowFunctionExpression: (path: NodePath<ArrowFunctionExpression>) => {
                this.extractFunctionSymbol(path, parsedFile);
            },

            // FunctionExpression Extractor
            FunctionExpression: (path: NodePath<FunctionExpression>) => {
                this.extractFunctionSymbol(path, parsedFile);
            },
        })
    }
}