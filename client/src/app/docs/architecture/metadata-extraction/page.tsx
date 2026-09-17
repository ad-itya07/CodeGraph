import React from "react";
import Link from "next/link";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsTable } from "@/components/docs/DocsTable";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.4 Metadata Extraction — CodeGraph Documentation",
  description: "Extracting dependencies from package.json and path aliases from tsconfig/jsconfig using JSONC parser.",
};

export default function MetadataExtractionPage() {
  const nav = findDocItemByHref("/docs/architecture/metadata-extraction");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.4"
        title="Metadata Extraction"
        summary="Extracting declared dependencies from package.json manifests and path aliases from tsconfig.json and jsconfig.json to power import resolution."
        sourceFile="server/src/parser/extractors/PackageJsonExtractor.ts"
      />

      {/* PackageJsonExtractor */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          PackageJsonExtractor
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          <code>PackageJsonExtractor</code> parses project manifests using standard <code>JSON.parse</code>. It
          normalizes <code>dependencies</code> and <code>devDependencies</code> objects into flat arrays of
          <code>&#123; name, version &#125;</code>:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/PackageJsonExtractor.ts"
          language="typescript"
          code={`export class PackageJsonExtractor {
    extract(filePath: string): ParsedPackageJson {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsedJson = JSON.parse(fileContent);

        return {
            name: parsedJson.name,
            dependencies: this.extractDependencies(parsedJson.dependencies || {}),
            devDependencies: this.extractDependencies(parsedJson.devDependencies || {}),
            filePath,
        };
    }

    private extractDependencies(dependencies: Record<string, string>): ParsedDependency[] {
        return Object.entries(dependencies).map(([name, version]) => ({ name, version }));
    }
}`}
        />
      </section>

      {/* PathConfigExtractor */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          PathConfigExtractor & JSONC Support
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Unlike standard JSON files, <code>tsconfig.json</code> and <code>jsconfig.json</code> files frequently
          contain comments (<code>//</code> or <code>/* */</code>) and trailing commas. Standard <code>JSON.parse</code>
          would throw syntax errors.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph utilizes Microsoft's <code>jsonc-parser</code> library to parse comments safely and transforms
          the <code>compilerOptions.paths</code> map into an array of <code>PathAlias</code> rules:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/PathConfigExtractor.ts"
          language="typescript"
          code={`export class PathConfigExtractor {
    extract(filePath: string): ParsedPathConfig {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsedJson = parse(fileContent); // jsonc-parser

        return {
            baseUrl: parsedJson.compilerOptions?.baseUrl,
            pathAliases: this.extractPathAliases(parsedJson.compilerOptions?.paths || {}),
            filePath,
        };
    }

    private extractPathAliases(paths: Record<string, string[]>): PathAlias[] {
        return Object.entries(paths).map(([alias, paths]) => ({ alias, paths }));
    }
}`}
        />
      </section>

      {/* Downstream Metadata */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The `RepositoryMetadata` Object
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Both configuration sources are merged into a single metadata container passed to Stage 5:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/models/RepositoryMetadata.ts"
          language="typescript"
          code={`export interface RepositoryMetadata {
    packageJsons: ParsedPackageJson[];
    pathConfigs: ParsedPathConfig[];
}`}
        />
      </section>

      <DocsCallout type="note" title="Downstream Consumer">
        This metadata is not used immediately in Stage 4. It is passed downstream to Stage 5 (Relationship Extraction),
        where the <code>findNearestPathConfig()</code> and <code>findNearestPackageJson()</code> helpers use it to resolve
        path aliases (e.g. <code>@/components/*</code>) and identify external vs module imports.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
