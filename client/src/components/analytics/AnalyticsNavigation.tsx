"use client";

import {
  Sparkles,
  RotateCw,
  Flame,
  Boxes,
  ListOrdered,
  Activity,
  GitFork,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisType } from "@/types";

interface AnalyticsNavigationProps {
  activeAnalysis: AnalysisType;
  onSelectAnalysis: (type: AnalysisType) => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: AnalysisType;
    label: string;
    description: string;
    icon: typeof Sparkles;
    iconColor: string;
    activeBg: string;
  }>;
}

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        id: "home",
        label: "Analysis Home",
        description: "Analytics overview & launchpad",
        icon: Sparkles,
        iconColor: "text-accent",
        activeBg: "bg-surface-elevated text-foreground border-accent/40 shadow-sm",
      },
    ],
  },
  {
    title: "Repository Analysis",
    items: [
      {
        id: "cycles",
        label: "Cycles",
        description: "Global circular dependencies",
        icon: RotateCw,
        iconColor: "text-blue-400",
        activeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      },
    ],
  },
  {
    title: "Entity Analysis",
    items: [
      {
        id: "impact",
        label: "Impact",
        description: "Upstream blast radius",
        icon: Flame,
        iconColor: "text-rose-400",
        activeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      },
      {
        id: "dependencies",
        label: "Dependencies",
        description: "Downstream relationships",
        icon: Boxes,
        iconColor: "text-indigo-400",
        activeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      },
      {
        id: "ordering",
        label: "Ordering",
        description: "Topological execution order",
        icon: ListOrdered,
        iconColor: "text-teal-400",
        activeBg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      },
      {
        id: "connectivity",
        label: "Connectivity",
        description: "Fan-in / Fan-out degree",
        icon: Activity,
        iconColor: "text-emerald-400",
        activeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      },
    ],
  },
  {
    title: "Relationship Analysis",
    items: [
      {
        id: "call-path",
        label: "Call Path",
        description: "Two-symbol call tracer",
        icon: GitFork,
        iconColor: "text-purple-400",
        activeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      },
    ],
  },
];

export function AnalyticsNavigation({
  activeAnalysis,
  onSelectAnalysis,
}: AnalyticsNavigationProps) {
  return (
    <nav className="w-full lg:w-64 shrink-0 flex flex-col space-y-5 p-3.5 bg-surface/50 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <div className="px-2.5 text-[10px] font-bold font-mono uppercase tracking-wider text-muted/70">
            {section.title}
          </div>

          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeAnalysis === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectAnalysis(item.id)}
                  className={cn(
                    "w-full px-2.5 py-2 rounded-xl border text-left transition-all duration-150 flex items-center justify-between gap-2.5 group cursor-pointer",
                    isActive
                      ? item.activeBg
                      : "border-transparent text-muted hover:text-foreground hover:bg-surface-elevated/70 hover:border-border/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg bg-surface flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        item.iconColor
                      )}
                    >
                      <Icon size={14} />
                    </div>

                    <div className="min-w-0 flex-1 truncate">
                      <div className="text-xs font-semibold font-mono truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-muted/70 truncate hidden sm:block">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={13}
                    className={cn(
                      "text-muted transition-transform shrink-0",
                      isActive
                        ? "opacity-100 translate-x-0.5"
                        : "opacity-0 group-hover:opacity-60"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
