import React from "react";
import { Info, AlertTriangle, AlertCircle, Lightbulb, ShieldAlert } from "lucide-react";

type CalloutType = "note" | "tip" | "important" | "warning" | "caution";

interface DocsCalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const CALLOUT_CONFIGS: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    defaultTitle: string;
    borderClass: string;
    bgClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  note: {
    icon: Info,
    defaultTitle: "Note",
    borderClass: "border-border-highlight/80",
    bgClass: "bg-surface-elevated/40",
    iconClass: "text-muted",
    titleClass: "text-foreground",
  },
  tip: {
    icon: Lightbulb,
    defaultTitle: "Tip",
    borderClass: "border-success/30",
    bgClass: "bg-success/5",
    iconClass: "text-success",
    titleClass: "text-success",
  },
  important: {
    icon: AlertCircle,
    defaultTitle: "Important",
    borderClass: "border-accent/40",
    bgClass: "bg-accent/5",
    iconClass: "text-accent",
    titleClass: "text-accent",
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: "Warning",
    borderClass: "border-warning/40",
    bgClass: "bg-warning/5",
    iconClass: "text-warning",
    titleClass: "text-warning",
  },
  caution: {
    icon: ShieldAlert,
    defaultTitle: "Caution",
    borderClass: "border-danger/40",
    bgClass: "bg-danger/5",
    iconClass: "text-danger",
    titleClass: "text-danger",
  },
};

export function DocsCallout({
  type = "note",
  title,
  children,
}: DocsCalloutProps) {
  const config = CALLOUT_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div
      className={`my-5 rounded-lg border p-4 text-xs sm:text-sm ${config.borderClass} ${config.bgClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className={`shrink-0 mt-0.5 ${config.iconClass}`} />
        <div className="space-y-1.5 flex-1">
          <h5 className={`font-semibold text-xs uppercase tracking-wider ${config.titleClass}`}>
            {title || config.defaultTitle}
          </h5>
          <div className="text-muted leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
