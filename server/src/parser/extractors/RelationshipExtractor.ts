import traverse, { Binding, Node, NodePath } from "@babel/traverse";
import { ParsedFile } from "../models/ParsedFile.js";
import { ParsedRelationship } from "../models/ParsedRelationship.js";
import { ParsedSymbol } from "../models/ParsedSymbol.js";
import { CallExpression } from "@babel/types";

const CALLABLE_EXPRESSION_TYPES = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
]);

export class RelationshipExtractor {
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
    private buildRelationship(sourceSymbol: ParsedSymbol, targetSymbol: ParsedSymbol): ParsedRelationship {
        return {
            id: `${sourceSymbol.id}:${"calls"}:${targetSymbol.id}`,
            sourceId: sourceSymbol.id,
            sourceKind: "symbol",
            targetId: targetSymbol.id,
            targetKind: "symbol",
            relationshipKind: "calls",
        }
    }

    // adding relationship to parsed-relationships array
    private addRelationship(sourceSymbol: ParsedSymbol, targetSymbol: ParsedSymbol) {
        const relationship = this.buildRelationship(sourceSymbol, targetSymbol);
        this.parsedRelationships.push(relationship);
    }

    /* ===========================
    * Helper function for pushing and popping symbols from symbol stack
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

    /* ===========================
    * Helper functions for target-symbol finding from bindings
    =========================== */
    private getSymbolNodeFromBinding(binding: Binding): Node | undefined {
        const node = binding.path.node;
        if (node.type === "FunctionDeclaration" ||
            node.type === "ClassMethod" ||
            node.type === "ClassDeclaration"
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

    private resolveThisToParentSymbol(parsedFile: ParsedFile): ParsedSymbol | undefined {
        const currentSymbol = this.symbolStack.at(-1);
        if (!currentSymbol) return;

        return this.findEnclosingClassSymbol(parsedFile, currentSymbol);
    }

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
    * Symbol Stack and Parsed Relationships
    =========================== */
    private symbolStack: ParsedSymbol[] = [];
    private parsedRelationships: ParsedRelationship[] = [];

    extract(parsedFiles: ParsedFile[]): ParsedRelationship[] {
        this.parsedRelationships = [];

        for (const parsedFile of parsedFiles) {
            this.symbolStack = [];

            traverse.default(parsedFile.ast, {
                FunctionDeclaration: this.createSymbolScopeVisitor(parsedFile),

                ArrowFunctionExpression: this.createSymbolScopeVisitor(parsedFile),

                FunctionExpression: this.createSymbolScopeVisitor(parsedFile),

                ClassMethod: this.createSymbolScopeVisitor(parsedFile),

                ObjectMethod: this.createSymbolScopeVisitor(parsedFile),

                ClassPrivateMethod: this.createSymbolScopeVisitor(parsedFile),

                CallExpression: (path) => {
                    const targetSymbol = this.resolveCallTarget(parsedFile, path);
                    if (!targetSymbol) return;

                    const sourceSymbol = this.symbolStack.at(-1);
                    if (!sourceSymbol) return;

                    this.addRelationship(sourceSymbol, targetSymbol);
                },
            })
        }
        return this.parsedRelationships;
    }
}