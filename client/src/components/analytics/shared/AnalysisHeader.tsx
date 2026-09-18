"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisHeaderProps {
  title: string;
  question: string;
  category: "Repository Analysis" | "Entity Analysis" | "Relationship Analysis";
  icon: LucideIcon;
  iconColor?: string;
  badgeColor?: string;
}

export function AnalysisHeader({
  title,
  question,
  category,
  icon: Icon,
  iconColor = "text-accent",
  badgeColor = "bg-surface-elevated text-muted border-border",
}: AnalysisHeaderProps) {
  return (
    <div className="pb-5 mb-6 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md border",
                badgeColor
              )}
            >
              {category}
            </span>
          </div>
          <h1 className="text-xl font-bold font-heading text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {question}
          </p>
        </div>
      </div>
    </div>
  );
}
