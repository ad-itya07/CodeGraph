# 6. Models

## What This Section Covers

The `models/` directory contains all the TypeScript interfaces and types that define the shape of data flowing through the CodeGraph pipeline. Every stage reads from and writes to these structures, so they act as the contract between stages.

---

## Pipeline Data Flow

```
repositoryPath (string)
  │
  ├─ Walker ──────────► RepositoryFiles
  │
  ├─ Metadata ────────► RepositoryMetadata
  │                       ├── ParsedPackageJson[]
  │                       │     └── ParsedDependency[]
  │                       └── ParsedPathConfig[]
  │                             └── PathAlias[]
  │
  ├─ AST + Symbols ───► ParsedFile[]
  │                       ├── ParsedSymbol[]
  │                       └── ParsedExport[]
  │
  ├─ Relationships ───► ParsedRelationship[]
  │
  └─ Failures ────────► ParseFailure[]
  │
  └──────── All bundled into ► ParsedRepository
```

---

## Core Models

### `ParsedRepository`

The root output of the entire pipeline. Returned by `Parser.parse()`.

| Property | Type | Description |
|----------|------|-------------|
| `repositoryPath` | `string` | Absolute path to the repository root |
| `files` | `ParsedFile[]` | All successfully parsed source files |
| `metadata` | `RepositoryMetadata` | Extracted configs (package.json, tsconfig) |
| `relationships` | `ParsedRelationship[]` | All graph edges (calls, imports, extends, etc.) |
| `failures` | `ParseFailure[]` | Files that failed AST generation |

---

### `ParsedFile`

Represents a single source file after parsing and symbol extraction.

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Absolute path to the source file |
| `ast` | `File` (Babel) | The raw Babel Abstract Syntax Tree |
| `symbols` | `ParsedSymbol[]` | All declarations extracted from this file |
| `exports` | `ParsedExport[]` | Mapping of exported names to symbol IDs |

#### `ParsedExport`

A lightweight link between an export statement and its underlying symbol.

| Property | Type | Description |
|----------|------|-------------|
| `exportedName` | `string` | The name visible to importers (e.g., `"default"`, `"foo"`, or `"bar"` in `export { foo as bar }`) |
| `symbolId` | `string` | The ID of the `ParsedSymbol` being exported |

---

### `ParsedSymbol`

Represents a named declaration in the code — a class, function, method, variable, interface, enum, type alias, or object property.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Deterministic ID: `filePath:startLine:startColumn:name` |
| `name` | `string` | The identifier name of the symbol |
| `symbolKind` | `SymbolKind` | What kind of declaration this is |
| `methodKind` | `MethodKind?` | Only set when `symbolKind` is `"method"` |
| `location` | `SymbolLocation` | Exact source position (start/end lines and columns) |
| `parentSymbolId` | `string?` | ID of the enclosing symbol (e.g., the class that owns a method) |

#### `SymbolKind` (union type)

```
"function" | "method" | "class" | "interface" | "variable" | "enum" | "typeAlias" | "objectProperty"
```

#### `MethodKind` (union type)

```
"get" | "set" | "method" | "private"
```

Only used when `symbolKind` is `"method"`. Distinguishes between regular methods, getters, setters, and private methods.

#### `SymbolLocation`

```ts
{ startLine: number, startColumn: number, endLine: number, endColumn: number }
```

Maps directly from Babel's `node.loc`. Used both for symbol identification (matching nodes to symbols by position) and for future UI features like source highlighting.

---

### `ParsedRelationship`

Represents a directed edge in the code graph.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Deterministic ID: `sourceId:relationshipKind:targetId` |
| `sourceId` | `string` | ID of the calling/importing entity |
| `sourceKind` | `RelationshipEntityKind` | What the source is |
| `targetId` | `string` | ID of the called/imported entity |
| `targetKind` | `RelationshipEntityKind` | What the target is |
| `relationshipKind` | `RelationshipKind` | The type of edge |

#### `RelationshipKind` (union type)

```
"calls" | "imports" | "exports" | "extends" | "implements" | "instantiates" | "references"
```

#### `RelationshipEntityKind` (union type)

```
"file" | "symbol" | "module" | "dependency"
```

- `"file"` — a source file in the repository (identified by `filePath`)
- `"symbol"` — a `ParsedSymbol` (identified by its `id`)
- `"dependency"` — an npm package declared in `package.json` (identified by package name, e.g., `"express"`)
- `"module"` — an external module NOT found in `package.json` (e.g., Node built-ins like `"fs"`, `"path"`)

---

## Metadata Models

### `RepositoryMetadata`

Bundles both configuration extractions together.

| Property | Type | Description |
|----------|------|-------------|
| `packageJsons` | `ParsedPackageJson[]` | All parsed `package.json` files |
| `pathConfigs` | `ParsedPathConfig[]` | All parsed `tsconfig.json` / `jsconfig.json` files |

### `ParsedPackageJson`

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Absolute path to the `package.json` |
| `name` | `string?` | The `name` field (optional for private packages) |
| `dependencies` | `ParsedDependency[]` | Production dependencies |
| `devDependencies` | `ParsedDependency[]` | Dev dependencies |

### `ParsedDependency`

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Package name (e.g., `"express"`) |
| `version` | `string` | Semver string (e.g., `"^4.18.0"`) |

### `ParsedPathConfig`

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Absolute path to the config file |
| `baseUrl` | `string?` | The `compilerOptions.baseUrl` value |
| `pathAliases` | `PathAlias[]` | Transformed path mapping rules |

### `PathAlias`

| Property | Type | Description |
|----------|------|-------------|
| `alias` | `string` | The alias pattern (e.g., `"@/*"` or `"@utils"`) |
| `paths` | `string[]` | The target path templates (e.g., `["src/*"]`) |

---

## Utility Models

### `RepositoryFiles`

Output of the Repository Walker.

| Property | Type | Description |
|----------|------|-------------|
| `sourceFiles` | `string[]` | Paths to `.ts`, `.tsx`, `.js`, `.jsx` files |
| `packageJsonFiles` | `string[]` | Paths to `package.json` files |
| `tsconfigJsonFiles` | `string[]` | Paths to `tsconfig.json` files |
| `jsconfigJsonFiles` | `string[]` | Paths to `jsconfig.json` files |

### `ParseFailure`

Logged when a file fails AST generation.

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | The file that failed |
| `message` | `string` | Human-readable error message |
| `cause` | `unknown?` | The original error object |

### `ParseResult`

Groups successful and failed parses together (used internally).

| Property | Type | Description |
|----------|------|-------------|
| `parsedFiles` | `ParsedFile[]` | Successfully parsed files |
| `failedFiles` | `ParseFailure[]` | Failed files |

---

## Design Decisions

- **String-based IDs**: All IDs (`ParsedSymbol.id`, `ParsedRelationship.id`) are deterministic strings built from file paths, positions, and names. This makes the output JSON human-readable and debuggable, and plays well with graph databases where nodes and edges need stable, reproducible identifiers.
- **Flat relationships array**: Relationships live in a single flat array at the repository level (`ParsedRepository.relationships`), not nested inside individual symbols or files. This separation of nodes (symbols/files) and edges (relationships) mirrors graph database conventions and makes it trivial to insert the data into systems like Neo4j.
- **`parentSymbolId` over nesting**: Symbols use a `parentSymbolId` pointer rather than nesting children inside parent objects. This keeps the data structure flat and serialisation-friendly while still preserving hierarchy information.
