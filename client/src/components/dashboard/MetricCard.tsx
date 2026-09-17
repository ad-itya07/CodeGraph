"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

export function MetricCard({ title, value, subtitle, icon, isLoading }: MetricCardProps) {
  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted tracking-tight">{title}</h3>
        <div className="p-2 rounded-lg bg-surface-elevated text-subtle">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        {isLoading ? (
          <div className="h-8 w-24 bg-surface-elevated animate-pulse rounded-md mt-1 mb-1"></div>
        ) : (
          <span className="text-2xl font-bold font-heading text-foreground tracking-tight">
            {value}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-subtle mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
