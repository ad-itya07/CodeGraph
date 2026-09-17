import React from "react";

interface DocsPageHeaderProps {
  number?: string;
  title: string;
  summary?: string;
  sourceFile?: string;
}

export function DocsPageHeader({
  number,
  title,
  summary,
  sourceFile,
}: DocsPageHeaderProps) {
  return (
    <div className="border-b border-border/80 pb-6 mb-8">
      {number && (
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface-elevated text-accent border border-border">
            Section {number}
          </span>
          {sourceFile && (
            <span className="hidden sm:inline-flex items-center text-[11px] font-mono text-subtle">
              Source: <code className="ml-1 text-muted">{sourceFile}</code>
            </span>
          )}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading mb-3">
        {title}
      </h1>
      {summary && (
        <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
          {summary}
        </p>
      )}
      {sourceFile && (
        <div className="sm:hidden mt-3 text-[11px] font-mono text-subtle">
          Source: <code className="text-muted">{sourceFile}</code>
        </div>
      )}
    </div>
  );
}
