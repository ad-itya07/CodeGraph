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
    private buildSymbol(name: string, symbolKind: SymbolKind, path: NodePath, parsedFile: ParsedFile, parentSymbolId?: string, methodKind?: MethodKind): ParsedSymbol {
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
    private extractSymbol(path: NodePath<SupportedSymbolNode>, parsedFile: ParsedFile, kind: SymbolKind, methodKind?: string): void {
        const name = this.getSymbolName(path);
        if (!name) return;

        this.addSymbol(
            parsedFile,
            this.buildSymbol(
                name,
                kind,
                path,
                parsedFile
            )
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
    * HELPER FUNCTION FOR FINDING PARENT CLASS FOR METHOD
    =========================== */
    private getParentClassSymbol(path: NodePath<ClassMethod | ClassPrivateMethod>, parsedFile: ParsedFile): ParsedSymbol | undefined {
        const classPath = path.parentPath?.parentPath;

        let classSymbol: ParsedSymbol | undefined;

        // check if the parent is a class declaration
        if (classPath?.isClassDeclaration()) {
            const className = classPath.node.id?.name;

            // find the parent-class symbol
            classSymbol = parsedFile.symbols.find(
                symbol =>
                    symbol.name === className &&
                    symbol.symbolKind === "class"
            );
        }

        // check if parent is class expression
        else if (classPath?.isClassExpression()) {
            const variableDeclaratorPath = classPath.parentPath;

            if (variableDeclaratorPath?.isVariableDeclarator()) {
                const id = variableDeclaratorPath.node.id;

                if (id.type === "Identifier") {
                    const className = id.name;

                    // find the parent-class symbol
                    classSymbol = parsedFile.symbols.find(
                        symbol =>
                            symbol.name === className &&
                            symbol.symbolKind === "class"
                    );
                }
            }
        }

        return classSymbol;
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
                        this.buildSymbol(
                            name,
                            "variable",
                            path,
                            parsedFile
                        )
                    );
                }
            },

            // TSEnumDeclaration Extractor
            TSEnumDeclaration: (path: NodePath<TSEnumDeclaration>) => {
                this.extractSymbol(path, parsedFile, "enum");
            },

            // TSTypeAliasDeclaration Extractor
            TSTypeAliasDeclaration: (path: NodePath<TSTypeAliasDeclaration>) => {
                this.extractSymbol(path, parsedFile, "typeAlias");
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
                        this.buildSymbol(
                            name,
                            "method",
                            path,
                            parsedFile,
                            classSymbol.id,
                            methodKind
                        )
                    );
                    return;
                }

                this.extractSymbol(path, parsedFile, "method", methodKind);
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
                        this.buildSymbol(
                            name,
                            "method",
                            path,
                            parsedFile,
                            classSymbol.id,
                            methodKind
                        )
                    );
                    return;
                }

                this.extractSymbol(path, parsedFile, "method", methodKind);
            },

            // ObjectMethod Extractor `const user = { userName() {}, getUser() {} }`
            ObjectMethod: (path: NodePath<ObjectMethod>) => {
                const methodKind = this.getMethodKind(path);
                this.extractSymbol(path, parsedFile, "method", methodKind);
            },
        })
    }
}