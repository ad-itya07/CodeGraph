"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Search, FileText } from "lucide-react";
import { DOCS_NAVIGATION, DocItem, DocSection } from "@/lib/docs-navigation";
import { cn } from "@/lib/utils";

interface DocsSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    introduction: true,
    architecture: true,
    "graph-model": true,
    analytics: true,
    algorithms: true,
    health: true,
    reference: true,
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Filter sections by search query if present
  const filteredNavigation = DOCS_NAVIGATION.map((section) => {
    if (!searchQuery.trim()) return section;

    const query = searchQuery.toLowerCase();
    const matchingItems = section.items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchNum = item.number.includes(query);
      const matchSummary = item.summary.toLowerCase().includes(query);
      const matchSub = item.subtopics?.some((sub) =>
        sub.title.toLowerCase().includes(query) || sub.number.includes(query)
      );
      return matchTitle || matchNum || matchSummary || matchSub;
    });

    return {
      ...section,
      items: matchingItems,
    };
  }).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:transform-none",
          "border-r border-border bg-surface flex flex-col justify-between select-none shrink-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 space-y-4">
          {/* Docs Search Filter */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md text-xs bg-surface-elevated border border-border text-foreground placeholder:text-subtle focus:outline-none focus:border-border-highlight"
            />
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-4">
            {filteredNavigation.map((section: DocSection) => {
              const isSectionOpen = openSections[section.id] !== false;

              return (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground font-mono transition-colors text-left"
                  >
                    <span>
                      {section.number}. {section.title}
                    </span>
                    {isSectionOpen ? (
                      <ChevronDown size={14} className="text-subtle" />
                    ) : (
                      <ChevronRight size={14} className="text-subtle" />
                    )}
                  </button>

                  {isSectionOpen && (
                    <div className="space-y-0.5 pl-2 border-l border-border/40 ml-2 mt-1">
                      {section.items.map((item: DocItem) => {
                        const isCurrent = pathname === item.href;
                        const hasActiveSub = item.subtopics?.some(
                          (sub) => pathname === sub.href
                        );

                        return (
                          <div key={item.id} className="space-y-0.5">
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group",
                                isCurrent
                                  ? "bg-surface-elevated text-accent font-medium border border-border-highlight/60"
                                  : "text-muted hover:text-foreground hover:bg-surface-elevated/40"
                              )}
                            >
                              <span className="font-mono text-[10px] text-subtle shrink-0">
                                {item.number}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </Link>

                            {/* Subtopics */}
                            {item.subtopics && (isCurrent || hasActiveSub || searchQuery) && (
                              <div className="pl-4 space-y-0.5 border-l border-border/30 ml-2.5 py-0.5">
                                {item.subtopics.map((sub: DocItem) => {
                                  const isSubActive = pathname === sub.href;
                                  return (
                                    <Link
                                      key={sub.id}
                                      href={sub.href}
                                      onClick={onClose}
                                      className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors",
                                        isSubActive
                                          ? "text-accent font-medium bg-surface-elevated/60"
                                          : "text-muted/80 hover:text-foreground hover:bg-surface-elevated/20"
                                      )}
                                    >
                                      <span className="font-mono text-[9px] text-subtle shrink-0">
                                        {sub.number}
                                      </span>
                                      <span className="truncate">{sub.title}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Docs Footer */}
        <div className="p-3 border-t border-border/80 bg-surface-elevated/20">
          <Link
            href="/docs"
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <FileText size={14} />
            <span>Documentation Index</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
