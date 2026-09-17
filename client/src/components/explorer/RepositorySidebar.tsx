"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderGit2,
  FolderTree,
  Activity,
  History,
  ArrowLeft,
  ExternalLink,
  GitCommit,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repository } from "@/types";

interface RepositorySidebarProps {
  repository?: Repository | null;
  isLoading?: boolean;
}

export function RepositorySidebar({ repository, isLoading }: RepositorySidebarProps) {
  const pathname = usePathname();
  const repoId = repository?.id;

  // Persistent sidebar collapsed state (independent of File Explorer)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("cg_repo_sidebar_collapsed");
        if (stored === "true") {
          setIsCollapsed(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("cg_repo_sidebar_collapsed", String(next));
        }
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  interface NavItem {
    label: string;
    href: string;
    exact: boolean;
    icon: typeof FolderGit2;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      label: "Overview",
      href: repoId ? `/repository/${repoId}/overview` : "#",
      exact: false,
      icon: FolderGit2,
    },
    {
      label: "Explorer",
      href: repoId ? `/repository/${repoId}/explorer` : "#",
      exact: false,
      icon: FolderTree,
    },
    {
      label: "Analyze",
      href: repoId ? `/repository/${repoId}/analyze` : "#",
      exact: false,
      icon: Activity,
    },
    {
      label: "Recent Activity",
      href: repoId ? `/repository/${repoId}/activity` : "#",
      exact: false,
      icon: History,
    },
  ];

  return (
    <aside
      className={cn(
        "h-full border-r border-border bg-surface flex flex-col select-none transition-all duration-200 shrink-0 z-20",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Top Section: Back Link & Repository Details */}
      <div className="p-3 space-y-3">
        {/* Top Controls: Dashboard Back Link & Single Icon Collapse Toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated/60 transition-colors group min-w-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="truncate">Dashboard</span>
            </Link>

            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated/80 transition-colors cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleCollapsed}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>

            <Link
              href="/dashboard"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated/60 transition-colors group"
              title="Back to Dashboard"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Repository Header Card */}
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-surface-elevated/60 border border-border">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent mt-0.5">
                <FolderGit2 size={15} />
              </div>
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 w-24 bg-border-highlight/50 rounded animate-pulse" />
                    <div className="h-2 w-16 bg-border/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xs font-semibold font-heading text-foreground truncate" title={repository?.name}>
                      {repository?.name || "Repository"}
                    </h2>
                    {repository?.commitSha && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted mt-0.5 truncate" title={`Commit ${repository.commitSha}`}>
                        <GitCommit size={10} className="shrink-0" />
                        <span>{repository.commitSha.slice(0, 7)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {repository?.url && (
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted hover:text-foreground transition-colors group"
              >
                <span className="truncate max-w-[150px]">GitHub Repository</span>
                <ExternalLink size={10} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div
              className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent"
              title={repository?.name || "Repository"}
            >
              <FolderGit2 size={16} />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="pt-2">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-subtle font-medium">
              Repository
            </div>
          )}
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.label === "Overview"
                  ? pathname === `/repository/${repoId}` || pathname?.startsWith(`/repository/${repoId}/overview`)
                  : item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-xs font-medium transition-colors group",
                    isCollapsed ? "justify-center p-2.5" : "justify-between px-2.5 py-2",
                    isActive
                      ? "bg-surface-elevated text-foreground border border-border-highlight/60 shadow-xs"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated/40 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={16}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-accent" : "text-muted group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
