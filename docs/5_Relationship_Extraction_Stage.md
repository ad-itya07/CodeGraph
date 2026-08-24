# 5. Relationship Extraction

## What This Stage Does

The Relationship Extraction stage performs the **second AST traversal pass**. With all symbols already extracted and all exports mapped from Stage 4, this stage connects them by identifying how symbols and files interact — who calls whom, what imports what, which classes extend or implement others, and where instantiation happens.

**Input**: The full `ParsedFile[]` array (with populated `.symbols` and `.exports`) and the `RepositoryMetadata` (with package.json dependencies and path aliases).  
**Output**: A flat `ParsedRelationship[]` array of directed edges.

---

## Architecture Overview

The `RelationshipExtractor` class manages two pieces of internal state:

- **`symbolStack: ParsedSymbol[]`** — Tracks the current scope context. When the traversal enters a function or method node, the corresponding symbol is pushed onto the stack. The top of the stack is used as the `sourceId` for relationships like `calls`. When the traversal exits, the symbol is popped.
- **`parsedRelationships: ParsedRelationship[]`** — The accumulator for all discovered edges.

### Deduplication

Every relationship gets a deterministic ID: `sourceId:relationshipKind:targetId`. Before adding a relationship, `addRelationship()` checks if one with the same ID already exists (via `.some()`). Duplicates are silently skipped.

### Stack Management: `createSymbolScopeVisitor(parsedFile)`

Creates enter/exit visitors for scope-creating nodes (`FunctionDeclaration`, `ArrowFunctionExpression`, `FunctionExpression`, `ClassMethod`, `ObjectMethod`, `ClassPrivateMethod`). These visitors:
- **On enter**: `pushSymbolForNode()` — looks up the node in `parsedFile.symbols` by matching `startLine` and `startColumn`. If found, pushes onto stack.
- **On exit**: `popSymbolForNode()` — looks up the same node. If the symbol at the top of the stack matches, pops it.

This is the same concept as `createContainerVisitor` in the Symbol Extractor, but simpler since we don't need to extract anything — just track scope.

---

## Relationship Types

### 1. CALLS — `CallExpression`

**What it handles**: Function and method calls.  
**Direction**: `(callerSymbol) --[calls]--> (targetSymbol)`  
**Source**: Always `this.symbolStack.at(-1)` — the enclosing function/method scope.

The entry point is `extractCallRelationship()`, which calls `resolveCallTarget()`. The call target resolution branches based on the callee type:

#### Branch A: Direct calls (`foo()`) — `callee.type === "Identifier"`

`resolveIdentifierCallToSymbol(parsedFile, path)`:
1. Gets the identifier name from the callee.
2. Asks Babel for the scope binding: `path.scope.getBinding(callee.name)`.
3. Passes the binding to `resolveBindingToSymbol()`, which:
   - Calls `getSymbolNodeFromBinding(binding)` to determine which AST node the binding points to.
   - For `FunctionDeclaration`, `ClassMethod`, `ClassDeclaration`, `TSInterfaceDeclaration` — uses the node directly.
   - For `VariableDeclarator` — checks if the initializer is an expression type (`ArrowFunctionExpression`, `FunctionExpression`, `ClassExpression`). If so, uses `node.init` as the symbol node. Otherwise, uses the declarator itself.
   - Passes the determined node to `findSymbolForNode()` which matches by `startLine` + `startColumn` against `parsedFile.symbols`.

#### Branch B: Member expression calls (`X.foo()`) — `callee.type === "MemberExpression"`

`resolveMemberExpressionCallToSymbol(parsedFile, path)`:
1. Extracts the property name (the method being called) — must be an `Identifier` (computed properties like `X[method]()` are skipped).
2. Resolves the **object** (`X`) to its parent symbol via `resolveMemberExpressionObjectToParentSymbol()`.
3. Searches `parsedFile.symbols` for a symbol where `name === property.name` AND `parentSymbolId === parentSymbol.id`.

**Resolving the object** (`resolveMemberExpressionObjectToParentSymbol`):

- **`this.foo()`** — object is `ThisExpression`:
  - `resolveThisToParentSymbol()` reads the current symbol from the stack, then `findEnclosingClassSymbol()` walks up the parent chain (via `parentSymbolId` pointers) until it finds a symbol with `symbolKind === "class"`.
  
- **`X.foo()`** — object is `Identifier`:
  - `resolveIdentifierObjectToParentSymbol(parsedFile, objectName, path)`:
    1. Gets the binding for `X`.
    2. If `X` was declared as `const X = new SomeClass()` (i.e., binding node is `VariableDeclarator` with `NewExpression` init):
       - `resolveNewExpressionBindingToClassSymbol()` extracts the class name from the `NewExpression` callee, gets the class binding, and resolves it to the class symbol.
    3. Otherwise, resolves the binding directly to a symbol (handles cases where `X` is an object literal variable).

---

### 2. EXTENDS — `ClassDeclaration` / `ClassExpression`

**What it handles**: Class inheritance via `extends`.  
**Direction**: `(childClass) --[extends]--> (parentClass)`

`extractExtendsRelationship(parsedFile, path)`:
1. Finds the class symbol via `findSymbolForNode()`.
2. Checks `path.node.superClass` — if absent, the class doesn't extend anything.
3. The superClass must be an `Identifier` (e.g., `class Foo extends Bar`). Complex expressions like `class Foo extends mixin(Bar)` are **skipped**.
4. Gets the Babel binding for the superclass name and resolves it to a symbol.

---

### 3. IMPLEMENTS — `ClassDeclaration` / `ClassExpression`

**What it handles**: TypeScript `implements` clauses.  
**Direction**: `(class) --[implements]--> (interface/typeAlias)`

`extractImplementsRelationship(parsedFile, path)`:
1. Finds the class symbol.
2. Iterates over `path.node.implements` (an array of `TSExpressionWithTypeArguments` nodes).
3. For each implemented interface, extracts the expression identifier.
4. `resolveImplementedSymbol()` searches `parsedFile.symbols` for a match where `name === expression.name` AND `symbolKind` is `"interface"` or `"typeAlias"`.

Note: This uses a **name-based search** rather than scope binding resolution, because TypeScript interfaces/types don't create runtime bindings that Babel's scope tracker can see.

---

### 4. INSTANTIATES — `NewExpression`

**What it handles**: Object construction via `new`.  
**Direction**: `(sourceSymbol) --[instantiates]--> (classSymbol)`

`extractInstantiatesRelationship(parsedFile, path)`:

**Source resolution** (`resolveSourceSymbolForInstantiates`):
- If the `NewExpression` is inside a `VariableDeclarator` (`const x = new Foo()`): the variable symbol is the source.
- If it's inside a `ReturnStatement` (`return new Foo()`): the current function from the `symbolStack` is the source.
- Other contexts (e.g., passed as an argument `bar(new Foo())`) are **not handled** — returns `undefined` and the relationship is skipped.

**Target resolution**:
- The callee must be an `Identifier` (`new Foo()`). Complex expressions like `new (getClass())()` are skipped.
- Gets the binding for the class name and resolves it to a symbol.

---

### 5. IMPORTS — `ImportDeclaration`

**What it handles**: ES module `import` statements.  
**Direction**: `(file) --[imports]--> (file | symbol | dependency | module)`

The import handler `extractImportRelationship()` attempts 3 resolution strategies sequentially. Each handler returns a `boolean` — if `true`, the import was handled and we stop. If `false`, we try the next strategy.

#### Strategy 1: Relative Import (`handleRelativeImport`)

Triggered when the import source starts with `.` (e.g., `import { foo } from "./utils"`).

1. `resolveRelativeImportPath()` uses `path.resolve()` to convert the relative path to an absolute path based on the importing file's directory.
2. `findParsedFileByResolvedPath()` searches the `parsedFiles` array by comparing the resolved path against each file's path **with the extension stripped** (using regex `replace(/\.[^/.]+$/, "")`). This handles extensionless imports like `./utils` matching `./utils.ts`.
3. If found, creates a file-to-file relationship AND processes each import specifier:
   - `extractImportSpecifierRelationships()` iterates over `path.node.specifiers`.
   - `resolveImportedExportName()` maps each specifier to its exported name:
     - `ImportSpecifier` (`{ foo }`) → `specifier.imported.name` (or `.value` for StringLiteral)
     - `ImportDefaultSpecifier` (`import foo`) → `"default"`
   - Searches the imported file's `.exports` array for a match on `exportedName`.
   - Creates a file-to-symbol relationship for each matched symbol.

#### Strategy 2: Path Alias Import (`handlePathAliasImport`)

Triggered when the import doesn't start with `.` but matches a configured path alias.

1. `findNearestPathConfig()` walks up the directory tree from the importing file's location, checking each level for a matching `ParsedPathConfig` in the metadata. Returns the closest one.
2. `resolvePathAlias()` iterates through the config's `pathAliases` array:
   - **Exact alias** (no `*` in alias, e.g., `"@"` → `"src/index"`): Checks for exact string match.
   - **Wildcard alias** (e.g., `"@/*"` → `"src/*"`): Splits the alias at `*`, checks if the import starts with the prefix and ends with the suffix, extracts the wildcard value, and substitutes it into the path template.
   - The result is resolved to an absolute path using `path.resolve(baseDirectory, baseUrl, resolvedPath)`.
3. From here, same flow as relative imports — find the parsed file, create relationships.

#### Strategy 3: External Import (`handleExternalImport`)

Triggered as the final fallback for non-relative, non-aliased imports (e.g., `import express from "express"`).

1. `findNearestPackageJson()` walks up directories to find the applicable `package.json`.
2. `getPackageRoot()` extracts the package name:
   - Scoped packages: `"@babel/types"` → `"@babel/types"` (takes first two segments)
   - Regular packages: `"lodash/debounce"` → `"lodash"` (takes first segment)
3. `isDeclaredDependency()` checks if the package root exists in either `dependencies` or `devDependencies`.
4. If declared → creates a relationship with `targetKind: "dependency"`.
5. If not declared (e.g., Node built-in like `"fs"` or `"path"`) → creates a relationship with `targetKind: "module"`.

### EXPORTS — File-to-Symbol

`extractExportRelationships(parsedFile)` runs **before** the AST traversal for each file. It iterates over `parsedFile.exports` and creates a `(file) --[exports]--> (symbol)` relationship for each exported symbol.

---

## The Main Traversal

The `extract()` method loops over all parsed files. For each file:
1. Calls `extractExportRelationships()` first.
2. Resets the `symbolStack`.
3. Runs `traverse.default(parsedFile.ast, { ... })` with visitors for:
   - Scope tracking: `FunctionDeclaration`, `ArrowFunctionExpression`, `FunctionExpression`, `ClassMethod`, `ObjectMethod`, `ClassPrivateMethod`
   - `ClassDeclaration` / `ClassExpression`: Extracts `extends` and `implements`
   - `CallExpression`: Extracts `calls`
   - `NewExpression`: Extracts `instantiates`
   - `ImportDeclaration`: Extracts `imports`

---

## Key Files

| File | Purpose |
|------|---------|
| `extractors/RelationshipExtractor.ts` | The 707-line extractor class |
| `models/ParsedRelationship.ts` | `ParsedRelationship`, `RelationshipKind`, `RelationshipEntityKind` |

---

## Tradeoffs

- **Static scope resolution only**: We rely on Babel's static scope bindings. This means `const X = new SomeClass(); X.sumIt()` is resolved correctly. But if an object is received as a function parameter (`function run(X) { X.sumIt() }`), Babel has no binding pointing `X` back to a class — the call is silently skipped. Resolving this would require integrating a full TypeScript type-checker, which is a fundamentally different level of complexity.
- **Name-based matching for `implements`**: Since TypeScript interfaces don't create runtime bindings visible to Babel's scope tracker, `resolveImplementedSymbol()` uses a simple name search instead of binding resolution. This works in most cases but could produce false matches if two different interfaces share the same name in the same file.
- **`NewExpression` source limitations**: Instantiation is only tracked when the `new` expression is assigned to a variable or directly returned. Passing a `new` expression as a function argument (`doSomething(new Foo())`) is not captured because there's no clear "source symbol" to attribute it to.
- **Extension-stripped matching for imports**: `findParsedFileByResolvedPath` strips extensions before comparing, so `import "./utils"` matches `./utils.ts`. However, if two files share the same name with different extensions (e.g., `utils.ts` and `utils.js`), only the first match is returned.
