import React from "react";
import { DocsPageHeader } from "@/components/docs/DocsPageHeader";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { DocsCallout } from "@/components/docs/DocsCallout";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { findDocItemByHref } from "@/lib/docs-navigation";

export const metadata = {
  title: "4.9 Dead Code Detection Architecture — CodeGraph Documentation",
  description: "Architectural rationale for external tooling integration (Knip) vs naive static graph reachability.",
};

export default function DeadCodeDetectionPage() {
  const nav = findDocItemByHref("/docs/analytics/dead-code-detection");

  return (
    <div className="space-y-8">
      <DocsPageHeader
        number="4.9"
        title="Dead Code Detection Architecture"
        summary="Analysis of why entry-point ambiguity and framework runtime wiring preclude naive static graph reachability in V1, and the integration strategy with Knip."
        sourceFile="docs/8.8_Dead_Code_Detector.md"
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
          The Entry Point & Framework Wiring Problem
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          The naive approach to dead code detection suggests walking forward from &quot;entry points&quot; and flagging
          unreachable nodes as dead. However, in modern JavaScript/TypeScript ecosystems:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1.5 pl-2">
          <li><strong>No universal entry point</strong>: Next.js uses file-system routes (<code>app/page.tsx</code>), Express registers routes at runtime (<code>router.get(&quot;/path&quot;, controller)</code>), and libraries expose exported functions.</li>
          <li><strong>Framework runtime wiring</strong>: Symbols are invoked by framework runtimes without static in-repo <code>CALLS</code> edges. Naive reachability produces high rates of false positives.</li>
        </ul>
      </section>

      <DocsCallout type="important" title="V1 Architecture Decision: No False Positives">
        CodeGraph&apos;s graph is a <strong>structural fact graph</strong>. To avoid misleading engineers by flagging
        active framework code as dead, dead code detection is designated for external specialized tooling (such as
        <strong>Knip</strong>) rather than speculative native heuristics.
      </DocsCallout>

      <DocsPagination prev={nav?.prev} next={nav?.next} />
    </div>
  );
}
