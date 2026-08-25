import type { FileNode } from "./Nodes/FileNode.js";
import type { SymbolNode } from "./Nodes/SymbolNode.js";
import type { DependencyNode } from "./Nodes/DependencyNode.js";
import type { ModuleNode } from "./Nodes/ModuleNode.js";

export type GraphNode =
    | FileNode
    | SymbolNode
    | DependencyNode
    | ModuleNode;

export type GraphNodeKind =
    | "file"
    | "symbol"
    | "dependency"
    | "module";