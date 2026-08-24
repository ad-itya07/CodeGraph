# 4. Symbol Extraction

## What This Stage Does

The Symbol Extraction stage performs the **first AST traversal pass**. It walks through the Babel AST of each parsed file and identifies every meaningful declaration — classes, functions, variables, methods, interfaces, enums, type aliases, and object properties. Each declaration becomes a `ParsedSymbol` stored in the file's `.symbols` array. It also identifies which symbols are exported and stores them in the `.exports` array.

**Input**: A `ParsedFile` containing a Babel AST with empty `symbols` and `exports` arrays.  
**Output**: The same `ParsedFile` mutated with populated `symbols` and `exports`.

---

## Supported Symbol Types

The extractor handles these Babel node types, each mapped to a `SymbolKind`:

| Babel Node Type | SymbolKind | Example |
|----------------|------------|---------|
| `FunctionDeclaration` | `"function"` | `function foo() {}` |
| `ArrowFunctionExpression` | `"function"` | `const foo = () => {}` |
| `FunctionExpression` | `"function"` | `const foo = function() {}` |
| `ClassDeclaration` | `"class"` | `class Foo {}` |
| `ClassExpression` | `"class"` | `const Foo = class {}` |
| `VariableDeclarator` | `"variable"` | `const x = 5` |
| `TSInterfaceDeclaration` | `"interface"` | `interface IFoo {}` |
| `TSTypeAliasDeclaration` | `"typeAlias"` | `type Foo = string` |
| `TSEnumDeclaration` | `"enum"` | `enum Color {}` |
| `ClassMethod` | `"method"` | `class A { foo() {} }` |
| `ClassPrivateMethod` | `"method"` | `class A { #foo() {} }` |
| `ObjectMethod` | `"method"` | `const obj = { foo() {} }` |
| `ObjectProperty` | `"objectProperty"` | `const obj = { name: "val" }` |

---

## The Symbol Stack — How Hierarchy Works

The central architectural piece is the `symbolStack: ParsedSymbol[]`. This stack tracks the current nesting context during AST traversal.

When we enter a "container" node (a class, function, or object), the extracted symbol is pushed onto the stack. Any symbols extracted while inside that container will have their `parentSymbolId` set to the ID of the symbol at the top of the stack. When we exit the container, the symbol is popped off.

**Example**: For `class A { method1() {} }`:
1. Enter `ClassDeclaration` → extract `A` as `"class"`, push onto stack
2. Enter `ClassMethod` → extract `method1` as `"method"`, `parentSymbolId` = `A.id`
3. Exit `ClassMethod`
4. Exit `ClassDeclaration` → pop `A` off the stack

This is how we know `method1` belongs to class `A` without building a nested tree structure.

### `createContainerVisitor(parsedFile, symbolKind, getExtraParams?)`

A generic factory function that produces enter/exit visitor objects for container nodes. It:
1. **On enter**: Calls `extractSymbol()` to create the symbol. If successful, pushes the symbol onto `symbolStack` and marks the path with `path.setData("symbolPushed", true)`.
2. **On exit**: Checks `path.getData("symbolPushed")`. If true, pops the stack.

The `path.setData()` / `path.getData()` pattern is important — it ensures we only pop when the exact same path that pushed is the one exiting. This prevents stack corruption if symbol extraction returned `undefined` (e.g., for an anonymous function that couldn't be named).

Used by: `FunctionDeclaration`, `ArrowFunctionExpression`, `FunctionExpression`, `ClassDeclaration`, `ClassExpression`, `ClassMethod`, `ClassPrivateMethod`, `ObjectMethod`.

---

## Core Helper Functions

### `extractSymbol({ path, parsedFile, symbolKind, methodKind })`

The central extraction function:
1. Calls `getSymbolName(path)` to determine the name. Returns `undefined` if no name is found (skipping the symbol).
2. Reads `this.symbolStack.at(-1)` to get the current parent symbol.
3. Calls `buildSymbol()` to construct the full `ParsedSymbol` object.
4. Pushes the symbol into `parsedFile.symbols` via `addSymbol()`.

### `buildSymbol({ name, symbolKind, path, parsedFile, parentSymbolId, methodKind })`

Constructs a `ParsedSymbol`:
- Calls `buildSymbolLocation(path)` to extract line/column info from `node.loc`.
- Calls `buildSymbolId(parsedFile, name, location)` to generate the deterministic ID formatted as `filePath:startLine:startColumn:name`.

### `getSymbolName(path)` — Name Resolution

This function handles extracting a string name from many different node structures:

- **`FunctionDeclaration`**: Returns `path.node.id?.name` (the function's own name).
- **Variable-assigned expressions** (`const foo = () => {}`): Checks if `path.parentPath` is a `VariableDeclarator`, then reads the identifier from the parent's `id`.
- **Object property-assigned expressions** (`{ fn: () => {} }`): Checks if `path.parentPath` is an `ObjectProperty`, reads the key name (supports both `Identifier` and `StringLiteral` keys).
- **`ClassDeclaration` / `ClassExpression`**: Returns `path.node.id?.name`.
- **`TSInterfaceDeclaration` / `TSEnumDeclaration` / `TSTypeAliasDeclaration`**: Returns `path.node.id.name`.
- **`ClassMethod`**: Reads `path.node.key` — supports `Identifier` and `StringLiteral` keys.
- **`ClassPrivateMethod`**: Reads `path.node.key.id.name` (unwrapping the `PrivateName` node).
- **`ObjectMethod`**: Reads `path.node.key.name`.
- **`ObjectProperty`**: Reads the key as `Identifier` or `StringLiteral`.

Returns `null` if no name can be determined (the symbol is skipped).

### `getMethodKind(path)` — Method Classification

For `ClassMethod`, `ClassPrivateMethod`, and `ObjectMethod`:
- If `ClassPrivateMethod` → returns `"private"`.
- If `node.kind` is `"get"` or `"set"` → returns the getter/setter kind.
- Otherwise → returns `"method"`.

### `getVariableName(path)` — Destructuring Support

`VariableDeclarator` nodes aren't always simple `const foo = ...`. This helper handles:

- **`Identifier`**: `const foo = 1` → returns `["foo"]`
- **`ObjectPattern`**: `const { name, age } = user` → returns `["name", "age"]`
  - Also handles aliases: `const { name: userName } = user` → returns `["userName"]` (uses `property.value.name`, not the key)
  - Nested patterns like `const { address: { city } } = user` are **not supported** — the inner pattern won't produce a valid `Identifier` and gets filtered out.
- **`ArrayPattern`**: `const [a, b] = arr` → returns `["a", "b"]`

Each name in the returned array becomes a separate `ParsedSymbol` with `symbolKind: "variable"`.

---

## Special Handling: Variables with Object Initializers

When a variable is initialised with an `ObjectExpression` (e.g., `const config = { port: 3000, host: "localhost" }`), the variable symbol is pushed onto the `symbolStack`. This means any `ObjectProperty` or `ObjectMethod` extracted inside that object will correctly have the variable as their `parentSymbolId`.

The same enter/exit + `path.setData("symbolPushed", true)` pattern is used to manage the stack safely.

---

## Special Handling: Variables with Expression Initializers

When a `VariableDeclarator`'s initializer is an `ArrowFunctionExpression`, `FunctionExpression`, or `ClassExpression`, the `VariableDeclarator` visitor **skips** the variable entirely (returns early). Why? Because the `ArrowFunctionExpression` / `FunctionExpression` / `ClassExpression` visitor will fire separately for the expression, and `getSymbolName` will walk up to the parent `VariableDeclarator` to get the name from there. This prevents double-extraction (one for the variable, one for the expression).

---

## Special Handling: ObjectProperty

The `ObjectProperty` visitor handles properties like `const obj = { name: "Aditya" }`:
- It skips `ObjectPattern` parents (destructuring patterns like `const { name } = user` — these are handled by the `VariableDeclarator` visitor).
- It skips properties whose value is an `ArrowFunctionExpression`, `ClassExpression`, or `FunctionExpression` (same double-extraction prevention — the expression visitor handles those).
- If the property's value is an `ObjectExpression` (a nested object), the property symbol is pushed onto the `symbolStack` so child properties get the correct parent.

---

## Handling Exports

Export handling runs during the same traversal but uses **exit** visitors (not enter). This ensures all symbols have been extracted before we try to resolve which ones are exported.

### Named Exports (`ExportNamedDeclaration`)

`extractNamedExportSymbols(parsedFile, path)` handles three sub-cases:

1. **Declared exports** (`export function foo() {}`, `export class Bar {}`, `export interface IBaz {}`):
   - `resolveNamedExportDeclarationSymbol()` checks the declaration type and uses `findSymbolForNode()` to look up the already-extracted symbol by matching start line and column.

2. **Variable declaration exports** (`export const x = () => {}`, `export const y = 5`):
   - `resolveNamedExportVariableSymbols()` loops through each `VariableDeclarator` in the declaration. For expression initializers (`ArrowFunctionExpression`, `FunctionExpression`, `ClassExpression`), it looks up the expression node itself. For plain variables, it looks up the declarator node.

3. **Specifier exports** (`export { foo }`, `export { foo as bar }`):
   - `resolveNamedExportSpecifierSymbols()` iterates over the specifiers. For each one, `resolveExportSpecifierToSymbol()` uses Babel's `path.scope.getBinding(localName)` to find the binding of the local name, then `resolveBindingToSymbol()` maps it to a `ParsedSymbol`.
   - The exported name is `specifier.exported.name` (which may differ from the local name in case of `as` aliases).

### Default Exports (`ExportDefaultDeclaration`)

`extractDefaultExportSymbol(parsedFile, path)` handles:

1. **Declared default exports** (`export default function foo() {}`, `export default class Bar {}`):
   - `resolveDefaultExportDeclarationSymbol()` directly looks up the declaration node in symbols.

2. **Identifier default exports** (`export default foo`):
   - `resolveDefaultExportIdentifier()` first tries Babel scope binding resolution. If that fails (which happens for type-only declarations like interfaces/enums that Babel doesn't track as bindings), it falls back to a name-based search in `parsedFile.symbols`, filtering to `interface`, `typeAlias`, or `enum` kinds.

All default exports are registered with `exportedName: "default"`.

---

## Key Files

| File | Purpose |
|------|---------|
| `extractors/SymbolExtractor.ts` | The 616-line extractor class |
| `models/ParsedSymbol.ts` | `ParsedSymbol`, `SymbolKind`, `MethodKind`, `SymbolLocation` |
| `models/ParsedFile.ts` | `ParsedFile`, `ParsedExport` |

---

## Tradeoffs

- **Flat array with parent pointers**: Symbols are stored in a flat `parsedFile.symbols[]` array with `parentSymbolId` string pointers rather than a nested tree. This makes serialisation to JSON trivial and keeps lookups simple, but retrieving "all children of class X" requires scanning the entire array.
- **Skipped node types**: We deliberately skip control-flow nodes (`IfStatement`, `ForStatement`, `SwitchStatement`, etc.) and expression-level detail. The graph captures architectural structure (what talks to what), not execution flow.
- **Nested destructuring**: `const { address: { city } } = user` — the inner `{ city }` level is not extracted as a symbol. Only top-level destructured names are captured.
- **Computed property names**: `class A { [Symbol.iterator]() {} }` or `const obj = { ["key"]: val }` — computed keys are not handled because they can be runtime expressions. `getSymbolName` returns `null` for these and they're skipped.
