import traverse, { Binding, Node, NodePath } from "@babel/traverse";
import { ParsedFile } from "../models/ParsedFile.js";
import { ParsedRelationship } from "../models/ParsedRelationship.js";
import { ParsedSymbol } from "../models/ParsedSymbol.js";
import { FunctionDeclaration } from "@babel/types";

const CALLABLE_EXPRESSION_TYPES = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
]);

export class RelationshipExtractor {
    private findSymbolForNode(parsedFile: ParsedFile, node: Node): ParsedSymbol | undefined {
        const location = node.loc;
        if (!location) return undefined;

        return parsedFile.symbols.find(
            symbol =>
                symbol.location.startLine === location.start.line &&
                symbol.location.startColumn === location.start.column
        );
    }

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

    private addRelationship(sourceSymbol: ParsedSymbol, targetSymbol: ParsedSymbol) {
        const relationship = this.buildRelationship(sourceSymbol, targetSymbol);
        this.parsedRelationships.push(relationship);
    }

    private getNodeFromBinding(binding: Binding): Node | undefined {
        const node = binding.path.node;
        if (node.type === "FunctionDeclaration") {
            return node;
        }
        if (node.type === "VariableDeclarator" &&
            node.init &&
            CALLABLE_EXPRESSION_TYPES.has(node.init.type)) {
            return node.init;
        }
        return undefined;
    }

    private resolveBindingsToSymbols(parsedFile: ParsedFile, binding: Binding): ParsedSymbol | undefined {
        const symbolNode = this.getNodeFromBinding(binding);

        if (!symbolNode) return undefined;

        return this.findSymbolForNode(parsedFile, symbolNode);
    }

    private symbolStack: ParsedSymbol[] = [];
    private parsedRelationships: ParsedRelationship[] = [];

    extract(parsedFiles: ParsedFile[]): ParsedRelationship[] {
        this.parsedRelationships = [];

        for (const parsedFile of parsedFiles) {
            this.symbolStack = [];

            traverse.default(parsedFile.ast, {
                FunctionDeclaration: {
                    enter: (path: NodePath<FunctionDeclaration>) => {
                        const symbol = this.findSymbolForNode(parsedFile, path.node);
                        if (symbol) this.symbolStack.push(symbol);
                    },
                    exit: (path: NodePath<FunctionDeclaration>) => {
                        const symbol = this.findSymbolForNode(parsedFile, path.node);
                        if (symbol && this.symbolStack.at(-1)?.id === symbol.id) this.symbolStack.pop();
                    }
                },
                CallExpression: (path) => {
                    const callee = path.node.callee;
                    if (callee.type !== "Identifier") return;

                    const binding = path.scope.getBinding(callee.name);
                    if (!binding) return;

                    const targetSymbol = this.resolveBindingsToSymbols(parsedFile, binding);
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