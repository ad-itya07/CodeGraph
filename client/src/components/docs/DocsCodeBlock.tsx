"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function DocsCodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="my-5 rounded-lg border border-border bg-[#050505] overflow-hidden text-xs sm:text-sm font-mono shadow-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated/70 border-b border-border/80 text-muted select-none">
        <div className="flex items-center gap-2 text-xs">
          {filename ? (
            <span className="text-foreground font-medium">{filename}</span>
          ) : (
            <span className="text-subtle uppercase tracking-wider text-[10px]">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-success" />
              <span className="text-success font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed text-foreground">
        <pre className="flex">
          {showLineNumbers && (
            <div className="select-none pr-4 text-right text-subtle/60 border-r border-border/40 mr-4 font-mono">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code className="flex-1 font-mono">{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
