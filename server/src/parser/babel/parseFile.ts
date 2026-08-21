import fs from "fs";
import { parse } from "@babel/parser";
import { parserOptions } from "./parserOption.js";
import { FileParseError } from "@/errors/FileParseError.js";
import { ParsedFile } from "../models/ParsedFile.js";

export function parseFile(filePath: string): ParsedFile {
    try {
        const code = fs.readFileSync(filePath, 'utf-8')

        const ast = parse(code, parserOptions)

        return { filePath, ast, symbols: [], exports: [] };
    } catch (err) {
        throw new FileParseError(filePath, err);
    }
}