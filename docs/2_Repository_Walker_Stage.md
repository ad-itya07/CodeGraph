# 2. Repository Walker

## What This Stage Does

The Repository Walker is a filesystem scanner that recursively traverses a directory tree, categorises every relevant file it finds, and returns the categorised paths as a `RepositoryFiles` object. It is the very first step of the pipeline — nothing else can run until we know what files exist.

**Input**: `dirPath` — an absolute path to the repository root.  
**Output**: A `RepositoryFiles` object with four string arrays.

---

## How It Works

### Entry Point: `getRepositoryFiles(dirPath)`

1. Validates that the directory exists using `fs.existsSync()`. If not, throws a `NotFoundError`.
2. Initialises four empty arrays: `sourceFiles`, `packageJsonFiles`, `tsconfigJsonFiles`, `jsconfigJsonFiles`.
3. Calls the inner recursive `walk()` function starting from the root path.
4. Returns the `RepositoryFiles` object once traversal is complete.

### The `walk(currentPath)` Function

Uses `fs.readdirSync(currentPath, { withFileTypes: true })` to get directory entries. The `withFileTypes: true` option returns `fs.Dirent` objects directly, so we can call `entry.isDirectory()` or `entry.isFile()` without needing extra `fs.stat()` calls.

For each entry:

**If it's a directory:**
- Check if the name is in `IGNORED_DIRS` or starts with `.` (hidden directories).
- If ignored → skip entirely, do not recurse.
- If not ignored → recursively call `walk(fullPath)`.

**If it's a file:**
- Check the exact filename:
  - `package.json` → push to `packageJsonFiles`
  - `tsconfig.json` → push to `tsconfigJsonFiles`
  - `jsconfig.json` → push to `jsconfigJsonFiles`
- If not a config file, extract the extension using `path.extname()`.
- Check against `ALLOWED_EXTENSIONS` set → if matched, push to `sourceFiles`.

### Ignored Directories

```
node_modules, .git, .next, dist, build, coverage, .turbo, out
```

These are stored in a `Set` for O(1) lookup. Additionally, any directory starting with `.` is skipped (catches `.vscode`, `.husky`, `.github`, etc.).

### Allowed Extensions

```
.tsx, .ts, .js, .jsx
```

Also stored in a `Set` for O(1) lookup. Extensions are lowercased before comparison.

---

## Key Files

| File | Purpose |
|------|---------|
| `parser/walker/repositoryWalker.ts` | The walker function and its configuration constants |
| `parser/models/RepositoryFiles.ts` | The interface defining the output shape |

---

## Tradeoffs

- **Hardcoded ignore list**: The `IGNORED_DIRS` set is manually curated. If a project uses a non-standard build output directory (e.g. `output/` or `compiled/`), the walker will recurse into it and the parser might try to process minified or generated code. This was chosen over a configurable approach for simplicity — it handles the vast majority of JS/TS project structures.
- **Only JS/TS files**: We strictly allow `.ts`, `.tsx`, `.js`, `.jsx`. Other file types like `.css`, `.html`, `.json` (except the specific configs), `.vue`, `.svelte` are completely ignored because our Babel-based AST parser cannot process them.
- **Synchronous I/O**: The walker uses `fs.readdirSync` and `fs.existsSync`. For the filesystem scanning step specifically (which is fast compared to AST parsing), this keeps the code simple and linear without the complexity of async recursion.
