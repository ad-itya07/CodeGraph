# 1. Parser — The Orchestrator

## What This Stage Does

The `Parser` class is the top-level orchestrator of the entire CodeGraph extraction pipeline. It takes a raw repository directory path and coordinates a strict, sequential pipeline that transforms source files into a structured graph of symbols and relationships.

**Input**: A `repositoryPath` string (absolute path to the repo root).  
**Output**: A `ParsedRepository` object containing all parsed files, symbols, relationships, metadata, and any failures.

---

## The Pipeline (5 Steps)

The pipeline is sequential — each step depends on data produced by the previous one.

### Step 1 — Repository Walking

```
getRepositoryFiles(repositoryPath) → RepositoryFiles
```

Calls the walker to recursively scan the directory and categorise files into four arrays:
- `sourceFiles` — code files (`.ts`, `.tsx`, `.js`, `.jsx`)
- `packageJsonFiles` — all `package.json` files found
- `tsconfigJsonFiles` — all `tsconfig.json` files found
- `jsconfigJsonFiles` — all `jsconfig.json` files found

If `sourceFiles` comes back empty, the parser throws a `NoSupportedFileError` immediately — there's nothing to parse.

### Step 2 — Metadata Extraction

```
PackageJsonExtractor.extract(filePath) → ParsedPackageJson
PathConfigExtractor.extract(filePath) → ParsedPathConfig
```

Instantiates `PackageJsonExtractor` and `PathConfigExtractor`. Maps over the config file paths from Step 1 to produce structured metadata. Both `tsconfig` and `jsconfig` path arrays are merged and processed together by the same `PathConfigExtractor`.

The results are bundled into a single `RepositoryMetadata` object containing:
- `packageJsons: ParsedPackageJson[]`
- `pathConfigs: ParsedPathConfig[]`

This metadata is consumed later in Step 5 to resolve import paths and external dependencies.

### Step 3 — AST Generation

```
parseFile(filePath) → ParsedFile
```

Loops through every source file and calls `parseFile()`. This function:
1. Reads the file content with `fs.readFileSync(filePath, 'utf-8')`.
2. Passes the code to `@babel/parser`'s `parse()` with a predefined `parserOptions` config.
3. Returns a `ParsedFile` with the `filePath`, the raw Babel `ast`, and empty `symbols` and `exports` arrays (to be filled in Step 4).

If a file fails to parse (syntax error, encoding issue, etc.), the error is caught and stored as a `ParseFailure` with the `filePath`, error `message`, and `cause`. The pipeline continues processing other files.

#### Babel Parser Configuration (`parserOption.ts`)

```ts
sourceType: "module"
plugins: ["jsx", "typescript", "decorators", "classProperties",
          "classPrivateProperties", "classPrivateMethods",
          "dynamicImport", "importMeta", "topLevelAwait"]
```

This ensures we can handle modern TS/JS features including JSX, TypeScript syntax, decorators, private class members, dynamic imports, and top-level `await`.

### Step 4 — Symbol Extraction (First AST Pass)

```
symbolExtractor.extract(parsedFile) → mutates parsedFile.symbols & parsedFile.exports
```

Creates a single `SymbolExtractor` instance and iterates over every `ParsedFile`. For each file, the extractor traverses the AST and populates `parsedFile.symbols` (an array of `ParsedSymbol`) and `parsedFile.exports` (an array of `ParsedExport`). See `4_Symbol_Extraction_Stage.md` for full details.

### Step 5 — Relationship Extraction (Second AST Pass)

```
relationshipExtractor.extract(parsedFiles, metadata) → ParsedRelationship[]
```

Creates a `RelationshipExtractor` and passes it the entire array of parsed files (now with symbols populated) and the metadata. The extractor traverses every AST a second time to discover how symbols and files relate to each other — calls, imports, extends, implements, instantiates, and exports. See `5_Relationship_Extraction_Stage.md` for full details.

The result is a flat array of `ParsedRelationship` objects stored at the repository level, not nested inside individual files.

### Final Return

```ts
return { repositoryPath, files: parsedFiles, metadata, failures: failedFiles, relationships }
```

---

## Key Files

| File | Purpose |
|------|---------|
| `parser/index.ts` | The `Parser` class — orchestrates the full pipeline |
| `parser/babel/parseFile.ts` | Reads a file and produces a Babel AST |
| `parser/babel/parserOption.ts` | Defines the Babel parser plugins and config |

---

## Tradeoffs

- **Two-pass AST traversal**: We traverse each file's AST twice — once for symbols, once for relationships. This costs extra processing time, but it guarantees that all symbols across all files are fully known before we try to link them. Without this, a function call in File A referencing a symbol in File B would fail if File B hadn't been processed yet.
- **Fail-safe parsing**: Individual file parse failures are caught and logged as `ParseFailure` objects rather than crashing the pipeline. The resulting graph may be incomplete, but it won't be destroyed by a single file with a syntax error.
