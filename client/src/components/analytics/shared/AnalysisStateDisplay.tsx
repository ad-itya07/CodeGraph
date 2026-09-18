import { AlertCircle, RefreshCw, Inbox, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatApiError } from "@/lib/analytics/entity-helpers";

interface AnalysisLoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function AnalysisLoadingState({
  message = "Running analysis...",
  subMessage = "Querying repository structure and analyzing graph relationships",
}: AnalysisLoadingStateProps) {
  return (
    <div className="py-16 px-4 rounded-2xl border border-border/80 bg-surface/40 flex flex-col items-center justify-center text-center">
      <div className="relative mb-5">
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center">
          <RefreshCw size={22} className="text-accent animate-spin" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-accent/10 blur-sm -z-10 animate-pulse" />
      </div>

      <h3 className="text-sm font-semibold font-heading text-foreground mb-1">
        {message}
      </h3>
      <p className="text-xs text-muted max-w-sm leading-relaxed font-mono">
        {subMessage}
      </p>

      {/* Progress placeholder bars */}
      <div className="w-48 h-1.5 bg-surface-elevated rounded-full overflow-hidden mt-6 border border-border">
        <div className="w-1/2 h-full bg-accent rounded-full animate-[slide-in-right_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

interface AnalysisErrorStateProps {
  title?: string;
  error?: string | Error | null | unknown;
  onRetry?: () => void;
}

export function AnalysisErrorState({
  title = "Analysis Failed",
  error,
  onRetry,
}: AnalysisErrorStateProps) {
  const errorMessage = formatApiError(error);

  return (
    <div className="py-12 px-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center">
      <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3.5">
        <AlertCircle size={22} />
      </div>

      <h3 className="text-sm font-bold font-heading text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-muted max-w-md leading-relaxed font-mono mb-5">
        {errorMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border hover:border-border-highlight text-xs font-mono font-medium text-foreground transition-all cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

interface AnalysisErrorBannerProps {
  title?: string;
  error: unknown;
  onRetry?: () => void;
  onClose?: () => void;
}

export function AnalysisErrorBanner({
  title = "Request Failed",
  error,
  onRetry,
  onClose,
}: AnalysisErrorBannerProps) {
  const message = formatApiError(error);

  return (
    <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start justify-between gap-3 text-left">
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold font-mono text-red-400">
            {title}
          </div>
          <div className="text-[11px] font-mono text-foreground/80 mt-0.5 leading-relaxed">
            {message}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated text-xs font-mono font-medium text-foreground hover:bg-surface border border-border transition-colors cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>Retry</span>
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

interface AnalysisEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function AnalysisEmptyState({
  title,
  description,
  icon,
}: AnalysisEmptyStateProps) {
  return (
    <div className="py-14 px-6 rounded-2xl border border-border/80 border-dashed bg-surface/30 flex flex-col items-center justify-center text-center">
      <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3.5">
        {icon || <Inbox size={20} />}
      </div>

      <h3 className="text-sm font-semibold font-heading text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-muted max-w-md leading-relaxed font-mono">
        {description}
      </p>
    </div>
  );
}
