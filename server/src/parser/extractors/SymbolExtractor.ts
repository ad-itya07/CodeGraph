import { ParsedFile } from "../models/ParsedFile.js";
import traverse, { NodePath } from "@babel/traverse";
import { ArrowFunctionExpression, ClassDeclaration, ClassExpression, ClassMethod, ClassPrivateMethod, FunctionDeclaration, FunctionExpression, ObjectMethod, TSEnumDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration, VariableDeclarator } from "@babel/types";
import { MethodKind, ParsedSymbol, SymbolKind, SymbolLocation } from "../models/ParsedSymbol.js";

type SupportedSymbolNode =
    | FunctionDeclaration
    | ArrowFunctionExpression
    | FunctionExpression
    | ClassDeclaration
    | ClassExpression
    | TSInterfaceDeclaration
    | VariableDeclarator
    | TSEnumDeclaration
    | TSTypeAliasDeclaration
    | ClassMethod
    | ObjectMethod
    | ClassPrivateMethod;

interface BuildSymbolParams {
    name: string;
    symbolKind: SymbolKind;
    path: NodePath;
    parsedFile: ParsedFile;
    parentSymbolId?: string;
    methodKind?: MethodKind;
}

interface ExtractSymbolParams {
    path: NodePath<SupportedSymbolNode>;
    parsedFile: ParsedFile;
    symbolKind: SymbolKind;
    methodKind?: MethodKind;
}

interface SymbolExtraParams {
    methodKind?: MethodKind;
}

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

        if (path.isTSEnumDeclaration()) {
            return path.node.id.name;
        }

        if (path.isTSTypeAliasDeclaration()) {
            return path.node.id.name;
        }

        if (path.isClassMethod()) {
            const key = path.node.key;
            if (key.type === "Identifier") return key.name;

            if (key.type === "StringLiteral") return key.value;
        }

        if (path.isClassPrivateMethod()) {
            const key = path.node.key;
            if (key.type === "PrivateName") return key.id.name;
        }

        if (path.isObjectMethod()) {
            const key = path.node.key;
            if (key.type === "Identifier") return key.name;
        }

        return null;
    }

    // get method kind from path
    private getMethodKind(path: NodePath<ClassMethod | ClassPrivateMethod | ObjectMethod>): MethodKind {
        if (path.isClassPrivateMethod()) return "private";

        return path.node.kind === "get" || path.node.kind === "set"
            ? path.node.kind
            : "method";
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

    // build symbol Id
    private buildSymbolId(parsedFile: ParsedFile, name: string, location: SymbolLocation): string {
        return `${parsedFile.filePath}:${location.startLine}:${location.startColumn}:${name}`
    }

    // build symbol
    private buildSymbol({ name, symbolKind, path, parsedFile, parentSymbolId, methodKind }: BuildSymbolParams): ParsedSymbol {
        const location = this.buildSymbolLocation(path);
        return {
            id: this.buildSymbolId(parsedFile, name, location),
            name,
            symbolKind,
            location,
            parentSymbolId,
            methodKind
        }
    }

    // extract symbol from the path
    private extractSymbol({ path, parsedFile, symbolKind, methodKind }: ExtractSymbolParams): ParsedSymbol | undefined {
        const name = this.getSymbolName(path);
        if (!name) return undefined;

        const parentSymbol = this.symbolStack.at(-1);

        const symbol = this.buildSymbol({
            name,
            symbolKind,
            path,
            parsedFile,
            parentSymbolId: parentSymbol?.id,
            methodKind,
        });
        this.addSymbol(parsedFile, symbol);

        return symbol;
    }

    /* ===========================
    * HELPER FUNCTION FOR GETTING VARIABLE NAMES

    * because variables doesn't always has `id.type` as Identifier
    * we can also have 
    *   1. ObjectPattern: `const {dob, name} = user`
    *   2. ArrayPattern: `const [dob, name] = user`
    *   3. Aliases: const `{ name: userName } = user`
    *       - Incase of aliases, the symbol name is actually "userName"
    *   4. Nested Patterns: `const { address: {city} } = user`
    *       - Nested Patterns are UNSUPPORTED for now
    * NOTE: you can see that the above patterns have mulitple variable, 
    *       so we need a seperarte helper function
    =========================== */
    private getVariableName(path: NodePath<VariableDeclarator>): string[] {
        const id = path.node.id;

        if (id.type === "Identifier") {
            return [id.name];
        }

        if (id.type === "ObjectPattern") {
            return id.properties
                .filter(property => property.type === "ObjectProperty")
                .map(property => {
                    if (property.value.type === "Identifier") {
                        return property.value.name;
                    }

                    return null;
                })
                .filter((name): name is string => name !== null);

        }

        if (id.type === "ArrayPattern") {
            return id.elements
                .filter(element => element?.type === "Identifier")
                .map(element => element?.name)
        }

        return [];
    }

    // Stack to store active symbol containers while babel-traversing to get immediate parent
    private symbolStack: ParsedSymbol[] = [];

    /* ===========================
    * Helper function to handle visit of container-symbols
    =========================== */
    private createContainerVisitor<T extends SupportedSymbolNode>(
        parsedFile: ParsedFile,
        symbolKind: SymbolKind,
        getExtraParams?: (path: NodePath<T>) => SymbolExtraParams
    ) {
        return {
            enter: (path: NodePath<T>) => {
                const extraParams = getExtraParams?.(path);

                const symbol = this.extractSymbol({
                    path,
                    parsedFile,
                    symbolKind,
                    ...extraParams
                });

                if (symbol) {
                    this.symbolStack.push(symbol);
                    path.setData("symbolPushed", true);
                }
            },

            exit: (path: NodePath<T>) => {
                if (path.getData("symbolPushed")) {
                    this.symbolStack.pop();
                }
            }
        };
    }

    extract(parsedFile: ParsedFile): void {
        this.symbolStack = [];

        traverse.default(parsedFile.ast, {

            // FunctionDeclaration Extractor
            FunctionDeclaration: this.createContainerVisitor(parsedFile, "function"),

            // ArrowFunctionExpression Extractor
            ArrowFunctionExpression: this.createContainerVisitor(parsedFile, "function"),

            // FunctionExpression Extractor
            FunctionExpression: this.createContainerVisitor(parsedFile, "function"),

            // ClassDeclaration Extractor
            ClassDeclaration: this.createContainerVisitor(parsedFile, "class"),

            // ClassExpression Extractor
            ClassExpression: this.createContainerVisitor(parsedFile, "class"),

            // Interface Extractor
            TSInterfaceDeclaration: (path: NodePath<TSInterfaceDeclaration>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "interface" });
            },

            // Variable Extractor
            VariableDeclarator: (path: NodePath<VariableDeclarator>) => {
                if (
                    path.node.init?.type === "ArrowFunctionExpression" ||
                    path.node.init?.type === "FunctionExpression" ||
                    path.node.init?.type === "ClassExpression"
                ) return;

                const names = this.getVariableName(path);
                const parentSymbol = this.symbolStack.at(-1);

                for (const name of names) {
                    this.addSymbol(
                        parsedFile,
                        this.buildSymbol({
                            name,
                            symbolKind: "variable",
                            path,
                            parsedFile,
                            parentSymbolId: parentSymbol?.id
                        })
                    );
                }
            },

            // TSEnumDeclaration Extractor
            TSEnumDeclaration: (path: NodePath<TSEnumDeclaration>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "enum" });
            },

            // TSTypeAliasDeclaration Extractor
            TSTypeAliasDeclaration: (path: NodePath<TSTypeAliasDeclaration>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "typeAlias" });
            },

            // ClassMethod Extractor
            ClassMethod: this.createContainerVisitor(
                parsedFile,
                "method",
                path => ({
                    methodKind: this.getMethodKind(path)
                })
            ),

            // Class private method class A { #user() {} };
            ClassPrivateMethod: this.createContainerVisitor(
                parsedFile,
                "method",
                path => ({
                    methodKind: this.getMethodKind(path)
                })
            ),

            // ObjectMethod Extractor `const user = { userName() {}, getUser() {} }`
            ObjectMethod: this.createContainerVisitor(
                parsedFile,
                "method",
                path => ({
                    methodKind: this.getMethodKind(path)
                })
            ),
        })
    }
}