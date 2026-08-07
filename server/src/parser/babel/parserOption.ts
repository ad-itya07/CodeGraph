import { ParserOptions } from "@babel/parser";

export const parserOptions: ParserOptions = {
    sourceType: "module",
    plugins: [
        "jsx",
        "typescript",
        "decorators",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "dynamicImport",
        "importMeta",
        "topLevelAwait"
    ]
}