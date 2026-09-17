import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "2.5.2 Functions & Arrow Functions — CodeGraph Documentation",
  description: "Extracting function declarations, arrow functions, and double-extraction guards.",
};

export default function SymbolFunctionsPage() {
  const nav = findDocItemByHref("/docs/architecture/symbol-extraction/functions");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="2.5.2"
        title="Functions & Arrow Functions"
        summary="Extracting top-level function declarations, variable-assigned arrow functions, and expression functions while avoiding duplicate variable registrations."
        sourceFile="server/src/parser/extractors/SymbolExtractor.ts"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Function Extraction Forms
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          JavaScript and TypeScript functions appear in three primary syntactic structures:
        </p>

        <DocsCodeBlock
          filename="Function Syntactic Variants"
          language="typescript"
          code={`// 1. FunctionDeclaration
function calculateTax(amount: number) { return amount * 0.2; }

// 2. Variable-Assigned ArrowFunctionExpression
const formatCurrency = (val: number) => \`$\${val}\`;

// 3. Variable-Assigned FunctionExpression
const parseHeader = function(raw: string) { return raw.trim(); };`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Double-Extraction Guard
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          In <code>const formatCurrency = () =&gt; &#123;&#125;</code>, Babel encounters both a <code>VariableDeclarator</code>
          node and an <code>ArrowFunctionExpression</code> node.
        </p>
        <p className="text-sm text-muted leading-relaxed">
          If both visitors extracted symbols naively, the symbol list would contain two duplicate symbols for the
          same line (one as <code>"variable"</code> and one as <code>"function"</code>).
        </p>
        <p className="text-sm text-muted leading-relaxed">
          CodeGraph resolves this by adding an explicit guard in the <code>VariableDeclarator</code> visitor:
        </p>

        <DocsCodeBlock
          filename="server/src/parser/extractors/SymbolExtractor.ts"
          language="typescript"
          code={`// Inside VariableDeclarator visitor:
if (
    path.node.init?.type === "ArrowFunctionExpression" ||
    path.node.init?.type === "FunctionExpression" ||
    path.node.init?.type === "ClassExpression"
) {
    return; // Skip variable extraction — the expression visitor will extract the function symbol
}`}
        />
      </section>

      <DocsCallout type="tip" title="Name Upward Lookup">
        When the <code>ArrowFunctionExpression</code> visitor runs, it calls <code>getSymbolName()</code>,
        which checks <code>path.parentPath.isVariableDeclarator()</code> and retrieves the identifier name
        from <code>parentPath.node.id.name</code>.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
