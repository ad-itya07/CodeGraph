import { ParsedExport, ParsedFile } from "../models/ParsedFile.js";
import traverse, { Binding, NodePath } from "@babel/traverse";
import { ArrowFunctionExpression, ClassDeclaration, ClassExpression, ClassMethod, ClassPrivateMethod, ExportDefaultDeclaration, ExportNamedDeclaration, FunctionDeclaration, FunctionExpression, Node, ObjectMethod, ObjectProperty, TSEnumDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration, VariableDeclarator } from "@babel/types";
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
    | ClassPrivateMethod
    | ObjectProperty;

const SYMBOL_INITIALIZER_TYPES = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
    "ClassExpression",
]);

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

        // Handling cases like: `const user = { fn: () => {}, a: class {}, getUser: function () {} }`
        if (path.parentPath?.isObjectProperty()) {
            const key = path.parentPath.node.key;

            if (key.type === "Identifier") {
                return key.name;
            }

            if (key.type === "StringLiteral") {
                return key.value;
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

        if (path.isObjectProperty()) {
            const key = path.node.key;

            if (key.type === "Identifier") return key.name;

            if (key.type === "StringLiteral") return key.value;
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

    /* =======================================================
    * Handling parsedFile.exports 
    ======================================================== */

    /* ===========================
    * Helper functions for target-symbol finding from bindings
    =========================== */

    // Finding symbol for a given node based on start-line and start-column
    private findSymbolForNode(parsedFile: ParsedFile, node: Node): ParsedSymbol | undefined {
        const location = node.loc;
        if (!location) return undefined;

        return parsedFile.symbols.find(
            symbol =>
                symbol.location.startLine === location.start.line &&
                symbol.location.startColumn === location.start.column
        );
    }
    private getSymbolNodeFromBinding(binding: Binding): Node | undefined {
        const node = binding.path.node;
        if (node.type === "FunctionDeclaration" ||
            node.type === "ClassMethod" ||
            node.type === "ClassDeclaration" ||
            node.type === "TSInterfaceDeclaration"
        ) {
            return node;
        }
        if (node.type === "VariableDeclarator") {
            if (node.init && SYMBOL_INITIALIZER_TYPES.has(node.init.type)) {
                return node.init;
            }
            return node;
        }
        return undefined;
    }

    private resolveBindingToSymbol(parsedFile: ParsedFile, binding: Binding): ParsedSymbol | undefined {
        const symbolNode = this.getSymbolNodeFromBinding(binding);

        if (!symbolNode) return undefined;

        return this.findSymbolForNode(parsedFile, symbolNode);
    }
    /* ========================
    * For Named Exports
    ======================== */

    // helper function to get symbol for export function, class, interface, type, enum
    private resolveNamedExportDeclarationSymbol(parsedFile: ParsedFile, declaration: Node): ParsedExport | undefined {
        if (
            declaration.type !== "FunctionDeclaration" &&
            declaration.type !== "ClassDeclaration" &&
            declaration.type !== "TSInterfaceDeclaration" &&
            declaration.type !== "TSTypeAliasDeclaration" &&
            declaration.type !== "TSEnumDeclaration"
        ) {
            return undefined;
        }

        const symbol = this.findSymbolForNode(parsedFile, declaration);

        if (!symbol) return undefined;

        return { exportedName: symbol.name, symbolId: symbol.id };
    }

    // helper function to get symbol for export var, let, const, arrow function, class expression, function expression
    private resolveNamedExportVariableSymbols(parsedFile: ParsedFile, declaration: Node): ParsedExport[] {
        if (declaration.type !== "VariableDeclaration") return [];

        const exportedSymbols: ParsedExport[] = [];

        for (const declarator of declaration.declarations) {
            if (!declarator.init) continue;

            const symbolNode =
                declarator.init.type === "ArrowFunctionExpression" ||
                    declarator.init.type === "FunctionExpression" ||
                    declarator.init.type === "ClassExpression"
                    ? declarator.init
                    : declarator;

            const symbol = this.findSymbolForNode(parsedFile, symbolNode);

            if (!symbol) continue;

            exportedSymbols.push({ exportedName: symbol.name, symbolId: symbol.id });
        }

        return exportedSymbols;
    }

    // helper function to get symbol for export specifier { foo }, { foo as bar }
    private resolveNamedExportSpecifierSymbols(parsedFile: ParsedFile, path: NodePath<ExportNamedDeclaration>): ParsedExport[] {
        const exportedSymbols: ParsedExport[] = [];

        for (const specifier of path.node.specifiers) {
            if (specifier.type !== "ExportSpecifier") continue;
            if (specifier.local.type !== "Identifier" || specifier.exported.type !== "Identifier") continue;

            const symbol = this.resolveExportSpecifierToSymbol(parsedFile, path, specifier.local.name);
            if (!symbol) continue;

            exportedSymbols.push({ exportedName: specifier.exported.name, symbolId: symbol.id });
        }

        return exportedSymbols;
    }

    // helper function to resolve export specifier to symbol from binding
    private resolveExportSpecifierToSymbol(parsedFile: ParsedFile, path: NodePath<ExportNamedDeclaration>, localName: string): ParsedSymbol | undefined {
        const binding = path.scope.getBinding(localName);

        if (!binding) return;

        return this.resolveBindingToSymbol(parsedFile, binding);
    }

    // Extract Named Export Symbols
    private extractNamedExportSymbols(parsedFile: ParsedFile, path: NodePath<ExportNamedDeclaration>): ParsedExport[] {
        const exportedSymbols: ParsedExport[] = [];

        const declaration = path.node.declaration;

        // For declared named-export
        if (declaration) {
            // For export function, class, interface, type, enum
            const declarationSymbol = this.resolveNamedExportDeclarationSymbol(parsedFile, declaration);
            if (declarationSymbol) exportedSymbols.push(declarationSymbol);

            // For export variable declaration const, let, var, arrowFun, FunExp, ClassExp
            exportedSymbols.push(...this.resolveNamedExportVariableSymbols(parsedFile, declaration));
        }

        // For specifiers like export { foo as bar }, export { foo }, export { * as bar }, export { }
        exportedSymbols.push(...this.resolveNamedExportSpecifierSymbols(parsedFile, path));

        return exportedSymbols;
    }

    /* ========================
    * For Default Export
    ======================== */

    // helper function resolve declared default-export to symbol
    private resolveDefaultExportDeclarationSymbol(parsedFile: ParsedFile, path: NodePath<ExportDefaultDeclaration>, declaration: Node): ParsedSymbol | undefined {
        if (
            declaration.type === "FunctionDeclaration" ||
            declaration.type === "ClassDeclaration" ||
            declaration.type === "TSInterfaceDeclaration" ||
            declaration.type === "TSTypeAliasDeclaration" ||
            declaration.type === "TSEnumDeclaration"
        ) {
            return this.findSymbolForNode(parsedFile, declaration);
        }

        if (declaration.type === "Identifier") {
            return this.resolveDefaultExportIdentifier(parsedFile, path, declaration.name);
        }

        return undefined;
    }

    // helper function resolve default-export identifier to symbol
    private resolveDefaultExportIdentifier(parsedFile: ParsedFile, path: NodePath<ExportDefaultDeclaration>, name: string): ParsedSymbol | undefined {
        const binding = path.scope.getBinding(name);

        if (binding) {
            const symbol = this.resolveBindingToSymbol(parsedFile, binding);

            if (symbol) return symbol;
        }

        return parsedFile.symbols.find(
            symbol =>
                symbol.name === name &&
                (
                    symbol.symbolKind === "interface" ||
                    symbol.symbolKind === "typeAlias" ||
                    symbol.symbolKind === "enum"
                )
        );
    }

    // extract default export symbol
    private extractDefaultExportSymbol(parsedFile: ParsedFile, path: NodePath<ExportDefaultDeclaration>): ParsedExport | undefined {
        const declaration = path.node.declaration;

        const symbol = this.resolveDefaultExportDeclarationSymbol(parsedFile, path, declaration);

        if (!symbol) return;
        return { exportedName: "default", symbolId: symbol.id };
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
        if (!parsedFile.exports) parsedFile.exports = [];
        if (!parsedFile.symbols) parsedFile.symbols = [];

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
            VariableDeclarator: {
                enter: (path: NodePath<VariableDeclarator>) => {
                    if (
                        path.node.init?.type === "ArrowFunctionExpression" ||
                        path.node.init?.type === "FunctionExpression" ||
                        path.node.init?.type === "ClassExpression"
                    ) return;

                    const names = this.getVariableName(path);
                    const parentSymbol = this.symbolStack.at(-1);

                    const symbols: ParsedSymbol[] = [];

                    for (const name of names) {
                        const symbol = this.buildSymbol({
                            name,
                            symbolKind: "variable",
                            path,
                            parsedFile,
                            parentSymbolId: parentSymbol?.id
                        });

                        this.addSymbol(parsedFile, symbol);
                        symbols.push(symbol);
                    }

                    if (
                        path.node.init?.type === "ObjectExpression" &&
                        path.node.id.type === "Identifier"
                    ) {
                        const symbol = symbols[0];

                        if (symbol) {
                            this.symbolStack.push(symbol);
                            path.setData("symbolPushed", true);
                        }
                    }
                },
                exit: (path: NodePath<VariableDeclarator>) => {
                    if (path.getData("symbolPushed")) {
                        this.symbolStack.pop();
                    }
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

            // ObjectProperty Extractor `const user = { name: "Aditya" }`
            ObjectProperty: {
                enter: (path: NodePath<ObjectProperty>) => {
                    if (path.parentPath?.isObjectPattern()) return;

                    if (
                        path.node.value.type === "ArrowFunctionExpression" ||
                        path.node.value.type === "ClassExpression" ||
                        path.node.value.type === "FunctionExpression"
                    ) return;

                    const symbol = this.extractSymbol({ path, parsedFile, symbolKind: "objectProperty" });

                    if (symbol && path.node.value.type === "ObjectExpression") {
                        this.symbolStack.push(symbol);
                        path.setData("symbolPushed", true);
                    }
                },
                exit: (path: NodePath<ObjectProperty>) => {
                    if (path.getData("symbolPushed")) {
                        this.symbolStack.pop();
                    }
                }
            },

            // Handle Named-Exports for parsedFile.exports array
            ExportNamedDeclaration: {
                exit: (path: NodePath<ExportNamedDeclaration>) => {
                    const exportedSymbols = this.extractNamedExportSymbols(parsedFile, path);
                    parsedFile.exports.push(...exportedSymbols);
                }
            },

            ExportDefaultDeclaration: {
                exit: (path: NodePath<ExportDefaultDeclaration>) => {
                    const exportedSymbol = this.extractDefaultExportSymbol(parsedFile, path);
                    if (exportedSymbol) parsedFile.exports.push(exportedSymbol);
                }
            }
        })
    }
}