import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.2 Repository Discovery — CodeGraph Documentation",
  description: "Filesystem scanner implementation, directory ignore lists, allowed extensions, and RepositoryFiles model.",
};

export default function RepositoryDiscoveryPage() {
  const nav = findDocItemByHref("/docs/architecture/repository-discovery");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.2"
        title="Repository Discovery"
        summary="The filesystem scanner that recursively walks repository directories, filters build artifacts and hidden folders, and categorizes code files and configuration manifests."
        sourceFile="server/src/parser/walker/repositoryWalker.ts"
      />

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Walker Function
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The repository walker is the entry point of disk I/O. It scans the repository tree synchronously using
          <code>fs.readdirSync(currentPath, &#123; withFileTypes: true &#125;)</code> to obtain directory entries
          (<code>fs.Dirent</code>) without incurring secondary <code>fs.stat()</code> system calls.
        </p>

        <DocsCodeBlock
          filename="server/src/parser/models/RepositoryFiles.ts"
          language="typescript"
          code={`export interface RepositoryFiles {
    sourceFiles: string[];        // .ts, .tsx, .js, .jsx
    packageJsonFiles: string[];   // All package.json files
    tsconfigJsonFiles: string[];  // All tsconfig.json files
    jsconfigJsonFiles: string[];  // All jsconfig.json files
}`}
        />
      </section>

      {/* Ignored Directories & Allowed Extensions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Filter Rules & Invariants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-surface-elevated/30 space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-heading">
              Allowed Source Extensions
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Strictly restricted to JS/TS source code compatible with the Babel parser plugin configuration:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[".ts", ".tsx", ".js", ".jsx"].map((ext) => (
                <code key={ext} className="px-2 py-0.5 rounded bg-surface border border-border text-accent text-xs">
                  {ext}
                </code>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-surface-elevated/30 space-y-2">
            <h3 className="text-sm font-semibold text-foreground font-heading">
              Ignored Directories
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              O(1) Set lookup skipping generated builds, dependencies, coverage reports, and dot directories:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["node_modules", ".git", ".next", "dist", "build", "coverage", ".turbo", "out", ".*"].map((dir) => (
                <code key={dir} className="px-2 py-0.5 rounded bg-surface border border-border text-muted text-xs">
                  {dir}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Implementation */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Traversal Implementation
        </h2>

        <DocsCodeBlock
          filename="server/src/parser/walker/repositoryWalker.ts"
          language="typescript"
          code={`export function getRepositoryFiles(dirPath: string): RepositoryFiles {
    const targetDir = dirPath;
    const sourceFiles: string[] = [];
    const packageJsonFiles: string[] = [];
    const tsconfigJsonFiles: string[] = [];
    const jsconfigJsonFiles: string[] = [];

    if (!fs.existsSync(targetDir)) throw new NotFoundError('Repository directory not found');

    function walk(currentPath: string) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                // Ignore dot-directories (.vscode, .github) and build artifacts
                if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
                walk(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;

            if (entry.name === 'package.json') {
                packageJsonFiles.push(fullPath);
                continue;
            }
            if (entry.name === 'tsconfig.json') {
                tsconfigJsonFiles.push(fullPath);
                continue;
            }
            if (entry.name === 'jsconfig.json') {
                jsconfigJsonFiles.push(fullPath);
                continue;
            }

            const ext = path.extname(entry.name).toLowerCase();
            if (ALLOWED_EXTENSIONS.has(ext)) {
                sourceFiles.push(fullPath);
            }
        }
    }

    walk(targetDir);
    return { sourceFiles, packageJsonFiles, tsconfigJsonFiles, jsconfigJsonFiles };
}`}
        />
      </section>

      <DocsCallout type="note" title="Zero Source Files Safeguard">
        If <code>sourceFiles.length === 0</code> after traversal, the parser immediately throws a
        <code>NoSupportedFileError</code> rather than proceeding with an empty run.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
