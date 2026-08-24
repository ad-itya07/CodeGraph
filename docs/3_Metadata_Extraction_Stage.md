# 3. Metadata Extraction

## What This Stage Does

The Metadata Extraction stage reads project configuration files (`package.json`, `tsconfig.json`, `jsconfig.json`) and converts them into structured TypeScript objects. This metadata is not used immediately — it's passed downstream to the Relationship Extraction stage where it drives import resolution (figuring out whether an import is a local file, a path-aliased file, or an external npm dependency).

**Input**: Arrays of config file paths from the Repository Walker.  
**Output**: A `RepositoryMetadata` object containing parsed package configs and path configs.

---

## PackageJsonExtractor

### What It Extracts
From each `package.json`, it extracts:
- `name` — the package name (optional, may not exist in private packages)
- `dependencies` — an array of `{ name, version }` objects
- `devDependencies` — an array of `{ name, version }` objects
- `filePath` — the absolute path to the `package.json` itself (needed later for "nearest config" resolution)

### How It Works

`PackageJsonExtractor.extract(filePath)`:
1. Reads the file with `fs.readFileSync(filePath, "utf-8")`.
2. Parses with standard `JSON.parse()`.
3. Calls the private `extractDependencies()` helper on both `dependencies` and `devDependencies`.
4. `extractDependencies()` takes the raw `Record<string, string>` object (e.g., `{ "express": "^4.18.0" }`) and converts it to an array via `Object.entries().map()`, producing `[{ name: "express", version: "^4.18.0" }]`.
5. Returns a `ParsedPackageJson` object.

The array format makes downstream code simpler — the Relationship Extractor can use `.some(dep => dep.name === packageName)` instead of object key lookups.

---

## PathConfigExtractor

### What It Extracts
From each `tsconfig.json` or `jsconfig.json`, it extracts:
- `baseUrl` — the optional base URL for path resolution (e.g., `"."` or `"src"`)
- `pathAliases` — an array of `{ alias, paths }` objects transformed from the `compilerOptions.paths` field
- `filePath` — the absolute path to the config file itself

### How It Works

`PathConfigExtractor.extract(filePath)`:
1. Reads the file with `fs.readFileSync(filePath, "utf-8")`.
2. Parses with `jsonc-parser`'s `parse()` function (not standard `JSON.parse`). This is important because `tsconfig.json` files are allowed to contain comments (e.g., `// ...`) and trailing commas, which standard `JSON.parse` would reject. The `jsonc-parser` library handles JSONC (JSON with Comments) correctly.
3. Extracts `compilerOptions.baseUrl` and `compilerOptions.paths`.
4. Calls `extractPathAliases()` on the `paths` object.

### `extractPathAliases(paths)`

Transforms the raw `Record<string, string[]>` format (e.g., `{ "@/*": ["src/*"], "@utils": ["src/utils/index"] }`) into a flat array of `PathAlias` objects:

```ts
[
  { alias: "@/*",    paths: ["src/*"] },
  { alias: "@utils", paths: ["src/utils/index"] }
]
```

This is done via `Object.entries(paths).map()`. The Relationship Extractor later iterates through this array and applies wildcard matching logic to resolve aliased imports to real file paths.

---

## Key Files

| File | Purpose |
|------|---------|
| `extractors/PackageJsonExtractor.ts` | Extracts dependencies from `package.json` |
| `extractors/PathConfigExtractor.ts` | Extracts path aliases from TS/JS config files |
| `models/ParsedPackageJson.ts` | Interface for the parsed `package.json` output |
| `models/ParsedPathConfig.ts` | Interface for the parsed path config output |
| `models/PathAlias.ts` | Interface for a single `{ alias, paths }` entry |
| `models/ParsedDependency.ts` | Interface for a single `{ name, version }` entry |
| `models/RepositoryMetadata.ts` | Bundles both config types together |

---

## Tradeoffs

- **Only `tsconfig.json` and `jsconfig.json`**: We do not extract path aliases from bundler-level configs like `webpack.config.js`, `vite.config.ts`, or `babel.config.js`. These bundler configs often contain JavaScript logic (not just static JSON), so parsing them would require executing or evaluating JS code. By focusing on the standard TS/JS config files, we keep the extractor simple and deterministic.
- **No `extends` resolution**: Many `tsconfig.json` files use `"extends": "./tsconfig.base.json"` to inherit settings from a base config. We currently do not follow these extends chains — we only read the fields directly present in the file. If path aliases are defined in a base config, they won't be picked up.
- **`jsonc-parser` vs `JSON.parse`**: The `PathConfigExtractor` uses `jsonc-parser` specifically because TypeScript config files allow comments. The `PackageJsonExtractor` uses standard `JSON.parse` because `package.json` files are strict JSON and never contain comments.
