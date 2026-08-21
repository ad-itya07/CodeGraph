import traverse, { Binding, Node, NodePath } from "@babel/traverse";
import { ParsedFile } from "../models/ParsedFile.js";
import { ParsedRelationship, RelationshipEntityKind, RelationshipKind } from "../models/ParsedRelationship.js";
import { ParsedSymbol } from "../models/ParsedSymbol.js";
import { CallExpression, ClassDeclaration, ClassExpression, ImportDeclaration, NewExpression } from "@babel/types";
import path from "node:path";

const CALLABLE_EXPRESSION_TYPES = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
]);

interface RelationshipOptions {
    sourceId: string;
    sourceKind: RelationshipEntityKind;

    targetId: string;
    targetKind: RelationshipEntityKind;

    relationshipKind: RelationshipKind;
}

export class RelationshipExtractor {
    /* =======================================================
     * Generic Symbol & Relationship Helpers
     * ==================================================== */

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

    // building relationship
    private buildRelationship({ sourceId, sourceKind, targetId, targetKind, relationshipKind }: RelationshipOptions): ParsedRelationship {
        return {
            id: `${sourceId}:${relationshipKind}:${targetId}`,
            sourceId: sourceId,
            sourceKind: sourceKind,
            targetId: targetId,
            targetKind: targetKind,
            relationshipKind,
        }
    }

    // adding relationship to parsed-relationships array
    private addRelationship({ sourceId, sourceKind, targetId, targetKind, relationshipKind }: RelationshipOptions) {
        const relationship = this.buildRelationship({ sourceId, sourceKind, targetId, targetKind, relationshipKind });

        const exists = this.parsedRelationships.some(existing => existing.id === relationship.id);
        if (exists) return;

        this.parsedRelationships.push(relationship);
    }

    /* =======================================================
     * Symbol Scope and Stack Management
     * ==================================================== */

    /* ===========================
     * Helper functions for pushing and popping symbols from symbol stack
     * And generalized helper function for symbol visitor
    =========================== */
    private pushSymbolForNode(parsedFile: ParsedFile, node: Node) {
        const symbol = this.findSymbolForNode(parsedFile, node);
        if (symbol) this.symbolStack.push(symbol);
    }

    private popSymbolForNode(parsedFile: ParsedFile, node: Node) {
        const symbol = this.findSymbolForNode(parsedFile, node);
        if (symbol && this.symbolStack.at(-1)?.id === symbol.id) this.symbolStack.pop();
    }

    private createSymbolScopeVisitor(parsedFile: ParsedFile) {
        return {
            enter: (path: NodePath) => {
                this.pushSymbolForNode(parsedFile, path.node);
            },
            exit: (path: NodePath) => {
                this.popSymbolForNode(parsedFile, path.node);
            }
        };
    }

    /* =======================================================
     * Binding & Symbol Resolution
     * ==================================================== */

    /* ===========================
    * Helper functions for target-symbol finding from bindings
    =========================== */
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
            if (node.init && CALLABLE_EXPRESSION_TYPES.has(node.init.type)) {
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

    /* =======================================================
     * Calls Relationship Helper functions
     * ==================================================== */

    // Helper function to resolve the binding of the binding of NewExpression to its class symbol
    private resolveNewExpressionBindingToClassSymbol(parsedFile: ParsedFile, binding: Binding): ParsedSymbol | undefined {
        const node = binding.path.node;
        if (node.type !== "VariableDeclarator" || node.init?.type !== "NewExpression") return undefined;

        const callee = node.init.callee;
        if (callee.type !== "Identifier") return undefined;

        const classBinding = binding.path.scope.getBinding(callee.name);
        if (!classBinding) return undefined;

        return this.resolveBindingToSymbol(parsedFile, classBinding);
    }

    /* ===========================
    * Helper function to resolve call-targets from call expressions
    =========================== */
    private resolveCallTarget(parsedFile: ParsedFile, path: NodePath<CallExpression>): ParsedSymbol | undefined {
        const callee = path.node.callee;

        if (callee.type === "Identifier") {
            return this.resolveIdentifierCallToSymbol(parsedFile, path);
        }

        if (callee.type === "MemberExpression") {
            return this.resolveMemberExpressionCallToSymbol(parsedFile, path);
        }

        return undefined;
    }

    // Helper function for resolving target symbol for callee.type === "Identifier"
    private resolveIdentifierCallToSymbol(parsedFile: ParsedFile, path: NodePath<CallExpression>): ParsedSymbol | undefined {
        const callee = path.node.callee;
        if (callee.type !== "Identifier") return;

        const binding = path.scope.getBinding(callee.name);
        if (!binding) return;

        const targetSymbol = this.resolveBindingToSymbol(parsedFile, binding);
        return targetSymbol;
    }

    // Helper function to resolve the parent symbol for the object initialised in NewExpression
    private resolveIdentifierObjectToParentSymbol(parsedFile: ParsedFile, objectName: string, path: NodePath<CallExpression>): ParsedSymbol | undefined {
        const binding = path.scope.getBinding(objectName);
        if (!binding) return undefined;

        if (
            binding.path.node.type === "VariableDeclarator" &&
            binding.path.node.init?.type === "NewExpression"
        ) {
            return this.resolveNewExpressionBindingToClassSymbol(
                parsedFile,
                binding
            );
        }

        return this.resolveBindingToSymbol(parsedFile, binding);
    }

    // Helper function to find the enclosing class for the method called in ThisExpression
    private findEnclosingClassSymbol(parsedFile: ParsedFile, symbol: ParsedSymbol): ParsedSymbol | undefined {
        let currentSymbol: ParsedSymbol | undefined = symbol;

        while (currentSymbol) {
            if (currentSymbol.symbolKind === "class") {
                return currentSymbol;
            }

            if (!currentSymbol.parentSymbolId) {
                return undefined;
            }

            currentSymbol = parsedFile.symbols.find(
                candidate => candidate.id === currentSymbol!.parentSymbolId
            );
        }

        return undefined;
    }

    // Function to resolve the ThisExpression to its parent class symbol
    private resolveThisToParentSymbol(parsedFile: ParsedFile): ParsedSymbol | undefined {
        const currentSymbol = this.symbolStack.at(-1);
        if (!currentSymbol) return;

        return this.findEnclosingClassSymbol(parsedFile, currentSymbol);
    }

    // Helper function to resolve the parent symbol for the object in MemberExpression
    private resolveMemberExpressionObjectToParentSymbol(parsedFile: ParsedFile, path: NodePath<CallExpression>): ParsedSymbol | undefined {
        const callee = path.node.callee;
        if (callee.type !== "MemberExpression") return;

        const object = callee.object;

        if (object.type === "ThisExpression") {
            return this.resolveThisToParentSymbol(parsedFile);
        }

        if (object.type === "Identifier") {
            return this.resolveIdentifierObjectToParentSymbol(parsedFile, object.name, path);
        }
        return undefined;
    }

    // Helper function for resolving target symbol for callee.type === "MemberExpression"
    private resolveMemberExpressionCallToSymbol(parsedFile: ParsedFile, path: NodePath<CallExpression>): ParsedSymbol | undefined {
        const callee = path.node.callee;
        if (callee.type !== "MemberExpression") return;

        const property = callee.property;

        if (property.type !== "Identifier") return;

        const parentSymbol = this.resolveMemberExpressionObjectToParentSymbol(parsedFile, path);
        if (!parentSymbol) return;

        const targetSymbol = parsedFile.symbols.find((symbol) => {
            return symbol.name === property.name &&
                symbol.parentSymbolId === parentSymbol.id;
        });

        return targetSymbol;
    }

    /* ===========================
    * Helper function to extract CALLS realtionship
    =========================== */
    private extractCallRelationship(parsedFile: ParsedFile, path: NodePath<CallExpression>) {
        const targetSymbol = this.resolveCallTarget(parsedFile, path);
        if (!targetSymbol) return;

        const sourceSymbol = this.symbolStack.at(-1);
        if (!sourceSymbol) return;

        this.addRelationship({ sourceId: sourceSymbol.id, sourceKind: "symbol", targetId: targetSymbol.id, targetKind: "symbol", relationshipKind: "calls" });
    }

    /* =======================================================
    * EXTENDS Realtionship
    ======================================================== */
    private extractExtendsRelationship(parsedFile: ParsedFile, path: NodePath<ClassDeclaration | ClassExpression>) {
        const classSymbol = this.findSymbolForNode(parsedFile, path.node);
        if (!classSymbol) return;

        const superClass = path.node.superClass;
        if (!superClass) return;

        if (superClass.type !== "Identifier") return;

        const binding = path.scope.getBinding(superClass.name);
        if (!binding) return;

        const parentClassSymbol = this.resolveBindingToSymbol(parsedFile, binding);
        if (!parentClassSymbol) return;

        this.addRelationship({ sourceId: classSymbol.id, sourceKind: "symbol", targetId: parentClassSymbol.id, targetKind: "symbol", relationshipKind: "extends" });
    }

    /* =======================================================
    * IMPLEMENTS Realtionship
    ======================================================== */

    // Helper function to reslolve the type-interface-symbol for the implemented class using name-search
    private resolveImplementedSymbol(parsedFile: ParsedFile, expression: Node): ParsedSymbol | undefined {
        if (expression.type !== "Identifier") return;

        return parsedFile.symbols.find(
            symbol =>
                symbol.name === expression.name &&
                (
                    symbol.symbolKind === "interface" ||
                    symbol.symbolKind === "typeAlias"
                )
        );
    }

    // Helper function extract the IMPLEMENTS relationship
    private extractImplementsRelationship(parsedFile: ParsedFile, path: NodePath<ClassDeclaration | ClassExpression>) {
        const classSymbol = this.findSymbolForNode(parsedFile, path.node);
        if (!classSymbol) return;

        const implementedInterfaces = path.node.implements;
        if (!implementedInterfaces) return;

        for (const implementedInterface of implementedInterfaces) {
            if (implementedInterface.type !== "TSExpressionWithTypeArguments") continue;

            const expression = implementedInterface.expression;
            if (expression.type !== "Identifier") continue;

            const interfaceSymbol = this.resolveImplementedSymbol(parsedFile, expression);
            if (!interfaceSymbol) continue;

            this.addRelationship({ sourceId: classSymbol.id, sourceKind: "symbol", targetId: interfaceSymbol.id, targetKind: "symbol", relationshipKind: "implements" });
        }
    }

    /* =======================================================
    * INSTANTIATES Realtionship
    ======================================================== */

    // resolve source symbol for the NEW EXPRESSION for instantiating considering VariableDeclarator and Return statement
    private resolveSourceSymbolForInstantiates(parsedFile: ParsedFile, path: NodePath<NewExpression>): ParsedSymbol | undefined {
        const parent = path.parent;

        if (parent.type === "VariableDeclarator") return this.findSymbolForNode(parsedFile, parent);
        else if (parent.type === "ReturnStatement") return this.symbolStack.at(-1);

        return undefined;
    }

    private extractInstantiatesRelationship(parsedFile: ParsedFile, path: NodePath<NewExpression>) {
        const sourceSymbol = this.resolveSourceSymbolForInstantiates(parsedFile, path);
        if (!sourceSymbol) return;

        const callee = path.node.callee;
        if (callee.type !== "Identifier") return;

        const binding = path.scope.getBinding(callee.name);
        if (!binding) return;

        const targetSymbol = this.resolveBindingToSymbol(parsedFile, binding);
        if (!targetSymbol) return;

        this.addRelationship({ sourceId: sourceSymbol.id, sourceKind: "symbol", targetId: targetSymbol.id, targetKind: "symbol", relationshipKind: "instantiates" });
    }

    /* =======================================================
    * IMPORTS Relationship
    ======================================================== */

    // resolve import path to an absolute path
    private resolveImportPath(parsedFile: ParsedFile, importSource: string): string | undefined {
        if (!importSource.startsWith(".")) return undefined;

        const currentDirectory = path.dirname(parsedFile.filePath);

        return path.resolve(currentDirectory, importSource);
    }

    // finds the imported file among parsedFiles[]
    private findParsedFileByResolvedPath(resolvedImportPath: string, parsedFiles: ParsedFile[]): ParsedFile | undefined {
        return parsedFiles.find((parsedFile) => {
            const parsedFilePathWithoutExtension = parsedFile.filePath.replace(/\.[^/.]+$/, "");

            return parsedFilePathWithoutExtension === resolvedImportPath;
        });
    }

    // helper function to get the Imported-Export-name based on the import-specifier or import-default-specifier
    // for former we have the specifier.imported.type = Identifier or string-literal
    private resolveImportedExportName(specifier: ImportDeclaration["specifiers"][number]): string | undefined {

        // for import specifiers: "import { foo } from ./file"
        if (specifier.type === "ImportSpecifier") {
            return specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : specifier.imported.value;
        }

        // for default import specifier: "import foo from ./file"
        if (specifier.type === "ImportDefaultSpecifier") {
            return "default";
        }

        return undefined;
    }

    // Extracts import relationships for import specifiers
    private extractImportSpecifierRelationships(parsedFile: ParsedFile, importedFile: ParsedFile, path: NodePath<ImportDeclaration>) {
        for (const specifier of path.node.specifiers) {

            const importedName = this.resolveImportedExportName(specifier);
            if (!importedName) continue;

            const importedSymbol = importedFile.exports.find(exportedSymbol => exportedSymbol.exportedName === importedName);
            if (!importedSymbol) continue;

            this.addRelationship({ sourceId: parsedFile.filePath, sourceKind: "file", targetId: importedSymbol.symbolId, targetKind: "symbol", relationshipKind: "imports" });
        }
    }

    // extracts import relationship
    private extractImportRelationship(parsedFile: ParsedFile, path: NodePath<ImportDeclaration>, parsedFiles: ParsedFile[]) {
        const importSource = path.node.source.value;

        const resolvedImportPath = this.resolveImportPath(parsedFile, importSource);
        if (!resolvedImportPath) return;

        const importedFile = this.findParsedFileByResolvedPath(resolvedImportPath, parsedFiles);
        if (!importedFile) return;

        // handling import specifiers here if any
        this.extractImportSpecifierRelationships(parsedFile, importedFile, path);

        this.addRelationship({ sourceId: parsedFile.filePath, sourceKind: "file", targetId: importedFile.filePath, targetKind: "file", relationshipKind: "imports" });
    }

    /* =======================================================
    * EXPORTS Relationship
    ======================================================== */
    private extractExportRelationships(parsedFile: ParsedFile) {
        for (const exportedSymbol of parsedFile.exports) {
            this.addRelationship({
                sourceId: parsedFile.filePath,
                sourceKind: "file",
                targetId: exportedSymbol.symbolId,
                targetKind: "symbol",
                relationshipKind: "exports",
            });
        }
    }

    /* =======================================================
    * Symbol Stack and Parsed Relationships
    ======================================================= */
    private symbolStack: ParsedSymbol[] = [];
    private parsedRelationships: ParsedRelationship[] = [];

    /* =======================================================
     * Main Extraction
     * ==================================================== */
    extract(parsedFiles: ParsedFile[]): ParsedRelationship[] {
        this.parsedRelationships = [];

        for (const parsedFile of parsedFiles) {
            this.extractExportRelationships(parsedFile);
            this.symbolStack = [];

            traverse.default(parsedFile.ast, {
                FunctionDeclaration: this.createSymbolScopeVisitor(parsedFile),

                ArrowFunctionExpression: this.createSymbolScopeVisitor(parsedFile),

                FunctionExpression: this.createSymbolScopeVisitor(parsedFile),

                ClassMethod: this.createSymbolScopeVisitor(parsedFile),

                ObjectMethod: this.createSymbolScopeVisitor(parsedFile),

                ClassPrivateMethod: this.createSymbolScopeVisitor(parsedFile),

                // Handle EXTENDS and IMPLEMENTS relationships for class-declaration
                ClassDeclaration: (path) => {
                    this.extractExtendsRelationship(parsedFile, path);
                    this.extractImplementsRelationship(parsedFile, path);
                },

                // Handle EXTENDS and IMPLEMENTS relationships for class-expression
                ClassExpression: (path) => {
                    this.extractExtendsRelationship(parsedFile, path);
                    this.extractImplementsRelationship(parsedFile, path);
                },

                CallExpression: (path) => {
                    this.extractCallRelationship(parsedFile, path);
                },

                NewExpression: (path) => {
                    this.extractInstantiatesRelationship(parsedFile, path);
                },

                ImportDeclaration: (path) => {
                    this.extractImportRelationship(parsedFile, path, parsedFiles);
                }
            })
        }
        return this.parsedRelationships;
    }
}