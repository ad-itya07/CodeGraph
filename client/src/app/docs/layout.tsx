"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, BookOpen, ArrowLeft, GitFork } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="md:hidden p-1.5 -ml-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated focus:outline-none cursor-pointer"
            aria-label="Toggle Docs Sidebar"
          >
            <Menu size={18} />
          </button>

          <Link href="/docs" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <BookOpen size={14} className="text-accent" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-semibold text-sm tracking-tight font-heading">
                Code<span className="text-accent">Graph</span>
              </span>
              <span className="text-[11px] font-mono text-muted">/docs</span>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-elevated text-accent border border-border">
            Technical Architecture
          </span>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-subtle">
            <GitFork size={12} />
            v0.1.0 Canonical Spec
          </span>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <DocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 md:py-10 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
