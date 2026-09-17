"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ExternalLink,
  RotateCw,
  Copy,
  Check,
  Code2,
  Zap,
  Search,
  MessageSquare,
  FileCode2,
  Bookmark,
  ArrowRight,
  BookOpen,
  Maximize2,
} from "lucide-react";

const CODELENS_URL = "https://codelens-4g7f.onrender.com/";

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: "Natural Language Queries",
    description:
      "Ask questions like \"How does the auth flow work?\" and get precise, context-aware answers powered by semantic LLM reasoning.",
  },
  {
    icon: Code2,
    title: "AST Parsing & Entity Chunking",
    description:
      "Intelligently parses repository source files using Abstract Syntax Trees to chunk code into discrete functions, classes, and variables.",
  },
  {
    icon: Zap,
    title: "High-Dimensional Vector Embeddings",
    description:
      "Generates dense vector embeddings using Xenova for every extracted code entity to enable fast semantic similarity search.",
  },
  {
    icon: Search,
    title: "Query Mapping & Relevancy Scoring",
    description:
      "Embeds your natural language query and maps it against indexed code entities, scoring and isolating the top 3–7 most relevant contexts.",
  },
  {
    icon: FileCode2,
    title: "Direct Source Referencing",
    description:
      "Every generated answer comes with direct links and exact coordinate references to relevant source code snippets for full transparency.",
  },
  {
    icon: Bookmark,
    title: "Saved Analysis & Structured History",
    description:
      "Save important architectural insights, query explanations, and investigation results to revisit anytime via a structured history system.",
  },
];

export default function CodeLensPage() {
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(CODELENS_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-muted text-xs font-mono mb-2">
            <Sparkles size={14} className="text-accent" />
            <span>NATURAL LANGUAGE REPOSITORY ASSISTANT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight">
            CodeLens Live Studio
          </h1>
          <p className="text-sm md:text-base text-muted mt-2 max-w-3xl leading-relaxed">
            Connect your repository, generate high-dimensional vector embeddings, and explore your codebase through natural-language queries with source-referenced AI explanations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={CODELENS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-xs hover:bg-white transition-colors cursor-pointer"
          >
            <span>Open in New Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ─── Service Info & Control Bar ─── */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          <div className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="text-subtle">SERVICE ENDPOINT:</span>
            <code className="text-foreground bg-surface-elevated px-2 py-0.5 rounded border border-border">
              {CODELENS_URL}
            </code>
          </div>
          <button
            onClick={handleCopyUrl}
            className="text-muted hover:text-foreground transition-colors p-1"
            title="Copy URL"
          >
            {copiedUrl ? (
              <Check size={13} className="text-success" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
          >
            <RotateCw size={12} />
            <span>Reload Frame</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
          >
            <Maximize2 size={12} />
            <span>{isFullscreen ? "Exit Fullscreen" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* ─── Interactive Embedded Frame ─── */}
      <div
        className={`rounded-xl border border-border bg-background overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-4 z-50 rounded-xl shadow-2xl flex flex-col bg-background"
            : "relative h-[680px] w-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-elevated/70">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-border-highlight" />
            <span className="text-[11px] font-mono text-muted">
              CodeLens Live Instance (Render Cloud)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={CODELENS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>External Link</span>
              <ExternalLink size={11} />
            </a>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-[11px] font-mono text-accent hover:underline ml-2"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="relative flex-1 h-[calc(100%-41px)] w-full bg-surface">
          <iframe
            key={iframeKey}
            src={CODELENS_URL}
            title="CodeLens Interactive Studio"
            className="w-full h-full border-0 bg-surface"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            loading="lazy"
          />
        </div>
      </div>

      {/* ─── CodeLens Core Capabilities Grid (Matched with Live Features) ─── */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground">
            CodeLens Core Capabilities & Workflow
          </h2>
          <p className="text-xs text-muted">
            How CodeLens combines AST parsing, vector embeddings, and LLM reasoning for codebase Q&A.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap, idx) => {
            const IconComponent = cap.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-border bg-surface space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
                    <IconComponent size={18} />
                  </div>
                  <h3 className="text-sm font-bold font-heading text-foreground">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Actions & Documentation Reference ─── */}
      <div className="p-6 rounded-xl border border-border bg-surface-elevated/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-heading text-foreground">
            Explore CodeGraph Architecture & Documentation
          </h3>
          <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
            Review the two-pass AST ingestion pipeline or inspect graph algorithms. For extensive technical documentation and architecture specifications, check out our docs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-xs hover:bg-white transition-colors"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/dashboard/algorithms"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <span>Algorithms</span>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:border-border-highlight transition-colors"
          >
            <BookOpen size={13} />
            <span>Docs</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
