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
    parentSymbolId?: string;
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
    private extractSymbol({ path, parsedFile, symbolKind, methodKind, parentSymbolId }: ExtractSymbolParams): void {
        const name = this.getSymbolName(path);
        if (!name) return;

        this.addSymbol(
            parsedFile,
            this.buildSymbol({
                name,
                symbolKind,
                path,
                parsedFile,
                parentSymbolId,
                methodKind,
            })
        )
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

    /* ===========================
    * HELPER FUNCTION FOR FINDING SYMBOL
    =========================== */
    private findSymbol(parsedFile: ParsedFile, name: string | undefined, symbolKind: SymbolKind): ParsedSymbol | undefined {
        if (!name) return undefined;

        return parsedFile.symbols.find(
            symbol =>
                symbol.name === name &&
                symbol.symbolKind === symbolKind
        );
    }

    /* ===========================
    * HELPER FUNCTION FOR FINDING PARENT CLASS FOR METHOD
    =========================== */
    private getParentClassSymbol(path: NodePath<ClassMethod | ClassPrivateMethod>, parsedFile: ParsedFile): ParsedSymbol | undefined {
        const classPath = path.parentPath?.parentPath;

        // check if the parent is a class declaration
        if (classPath?.isClassDeclaration()) {
            const className = classPath.node.id?.name;

            // find the parent-class symbol
            return this.findSymbol(parsedFile, className, "class");
        }

        // check if parent is class expression
        else if (classPath?.isClassExpression()) {
            const variableDeclaratorPath = classPath.parentPath;

            if (variableDeclaratorPath?.isVariableDeclarator()) {
                const id = variableDeclaratorPath.node.id;

                if (id.type === "Identifier") {
                    const className = id.name;

                    // find the parent-class symbol
                    return this.findSymbol(parsedFile, className, "class");
                }
            }
        }

        return undefined;
    }

    /* ===========================
    * HELPER FUNCTION FOR FINDING PARENT OBJECT FOR METHOD
    =========================== */
    private getParentObjectSymbol(path: NodePath<ObjectMethod>, parsedFile: ParsedFile): ParsedSymbol | undefined {
        const objectPath = path.parentPath?.parentPath;

        // check if the parent is an object
        if (!objectPath?.isVariableDeclarator()) return undefined;

        const id = objectPath.node.id;
        if (id.type !== "Identifier") return undefined;

        const objectName = id.name;

        // find the parent-object symbol
        return this.findSymbol(parsedFile, objectName, "variable");
    }

    extract(parsedFile: ParsedFile): void {
        traverse.default(parsedFile.ast, {

            // FunctionDeclaration Extractor (using arrow-function to preserve `this` for SymbolConstructor)
            FunctionDeclaration: (path: NodePath<FunctionDeclaration>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "function" });
            },

            // ArrowFunctionExpression Extractor
            ArrowFunctionExpression: (path: NodePath<ArrowFunctionExpression>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "function" });
            },

            // FunctionExpression Extractor
            FunctionExpression: (path: NodePath<FunctionExpression>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "function" });
            },

            // ClassDeclaration Extractor
            ClassDeclaration: (path: NodePath<ClassDeclaration>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "class" });
            },

            // ClassExpression Extractor
            ClassExpression: (path: NodePath<ClassExpression>) => {
                this.extractSymbol({ path, parsedFile, symbolKind: "class" });
            },

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

                for (const name of names) {
                    this.addSymbol(
                        parsedFile,
                        this.buildSymbol({
                            name,
                            symbolKind: "variable",
                            path,
                            parsedFile
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
            ClassMethod: (path: NodePath<ClassMethod>) => {
                const classSymbol: ParsedSymbol | undefined = this.getParentClassSymbol(path, parsedFile);
                const methodKind: MethodKind = this.getMethodKind(path);

                if (classSymbol) {
                    const name = this.getSymbolName(path);
                    if (!name) return;

                    this.addSymbol(
                        parsedFile,
                        this.buildSymbol({
                            name,
                            symbolKind: "method",
                            path,
                            parsedFile,
                            parentSymbolId: classSymbol.id,
                            methodKind
                        })
                    );
                    return;
                }

                this.extractSymbol({ path, parsedFile, symbolKind: "method", methodKind });
            },

            // Class private method class A { #user() {} };
            ClassPrivateMethod: (path: NodePath<ClassPrivateMethod>) => {
                const classSymbol: ParsedSymbol | undefined = this.getParentClassSymbol(path, parsedFile);
                const methodKind: MethodKind = this.getMethodKind(path);

                if (classSymbol) {
                    const name = this.getSymbolName(path);
                    if (!name) return;

                    this.addSymbol(
                        parsedFile,
                        this.buildSymbol({
                            name,
                            symbolKind: "method",
                            path,
                            parsedFile,
                            parentSymbolId: classSymbol.id,
                            methodKind
                        })
                    );
                    return;
                }

                this.extractSymbol({ path, parsedFile, symbolKind: "method", methodKind });
            },

            // ObjectMethod Extractor `const user = { userName() {}, getUser() {} }`
            ObjectMethod: (path: NodePath<ObjectMethod>) => {
                const parentSymbol = this.getParentObjectSymbol(path, parsedFile);
                const methodKind = this.getMethodKind(path);

                if (parentSymbol) {
                    const name = this.getSymbolName(path);
                    if (!name) return;

                    this.addSymbol(
                        parsedFile,
                        this.buildSymbol({
                            name,
                            symbolKind: "method",
                            path,
                            parsedFile,
                            parentSymbolId: parentSymbol.id,
                            methodKind
                        })
                    );
                    return;
                }

                this.extractSymbol({ path, parsedFile, symbolKind: "method", methodKind });
            },
        })
    }
}