"use client";

import { ReactNode } from "react";

interface OverviewMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  isLoading?: boolean;
}

export function OverviewMetricCard({
  title,
  value,
  subtitle,
  icon,
  isLoading,
}: OverviewMetricCardProps) {
  return (
    <div className="flex flex-col justify-between p-4 rounded-xl bg-surface border border-border hover:border-border-highlight transition-all shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-muted">{title}</span>
        <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border/80 flex items-center justify-center text-muted">
          {icon}
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="h-7 w-16 bg-surface-elevated animate-pulse rounded-md my-0.5" />
        ) : (
          <span className="text-xl font-bold font-heading text-foreground tracking-tight">
            {value}
          </span>
        )}
        {subtitle && (
          <p className="text-[11px] text-subtle font-mono truncate mt-0.5" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
