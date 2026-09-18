"use client";

import { cn } from "@/lib/utils";

interface DepthBadgeProps {
  depth: number;
  className?: string;
}

export function DepthBadge({ depth, className }: DepthBadgeProps) {
  if (depth === 1) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Direct (1 hop)
      </span>
    );
  }

  if (depth === 2) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        2 hops
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
      {depth} hops
    </span>
  );
}
