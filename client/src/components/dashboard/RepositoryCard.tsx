"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RotateCw,
  Clock,
} from "lucide-react";
import type { Repository } from "@/types";
import { useRepositoryStatus, STAGE_STEPS } from "@/hooks/useRepositoryStatus";
import { repositoriesApi } from "@/api/repositories";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
  repository: Repository;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const {
    stageLabel,
    stepIndex,
    errorMessage,
    isQueued,
    isProcessing,
    isFailed,
  } = useRepositoryStatus(repository.id, {
    initialStatus: repository.status,
    initialStage: repository.currentStage,
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(repository.createdAt));

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsRetrying(true);
      setRetryError("");
      await repositoriesApi.retry(repository.id);
      await queryClient.invalidateQueries({ queryKey: ["repository"] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setRetryError(error.response?.data?.message || "Failed to retry analysis");
    } finally {
      setIsRetrying(false);
    }
  };

  // --- 1. QUEUED / PROCESSING STATE ---
  if (isQueued || isProcessing) {
    return (
      <div className="relative flex flex-col p-5 bg-surface/90 border border-accent/30 rounded-xl shadow-xs cursor-default select-none overflow-hidden group">
        {/* Subtle accent glow line at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/40 via-accent to-accent/40 animate-pulse" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent relative">
              <FolderGit2 size={20} />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface border border-accent/30 flex items-center justify-center">
                <Loader2 size={10} className="text-accent animate-spin" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground truncate font-heading">
                {repository.name}
              </h3>
              <p className="text-xs text-subtle truncate mt-0.5" title={repository.url}>
                {repository.url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium tracking-wide bg-accent/10 text-accent border border-accent/20 flex items-center gap-1.5">
            <Loader2 size={10} className="animate-spin" />
            <span>{isQueued ? "QUEUED" : "ANALYZING"}</span>
          </span>
        </div>

        {/* Live Stage Progress Indicator */}
        <div className="my-3 p-3 rounded-lg bg-surface-elevated/60 border border-border/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-foreground font-medium flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <span className="truncate">{stageLabel}</span>
            </span>
            <span className="text-[10px] font-mono text-muted shrink-0 ml-2">
              {isQueued ? "Waiting" : `Step ${stepIndex + 1}/${STAGE_STEPS.length}`}
            </span>
          </div>

          {/* Mini Step Pipeline Dots */}
          <div className="grid grid-cols-6 gap-1 mt-2">
            {STAGE_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  idx < stepIndex
                    ? "bg-accent"
                    : idx === stepIndex
                    ? "bg-accent/80 animate-pulse"
                    : "bg-border"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40 text-[11px] text-muted">
          <span className="flex items-center gap-1 font-mono">
            <Clock size={12} className="text-accent" />
            <span>Analysis in progress</span>
          </span>
          <span className="font-mono text-[10px] uppercase">
            Added {formattedDate}
          </span>
        </div>
      </div>
    );
  }

  // --- 2. FAILED STATE ---
  if (isFailed) {
    return (
      <div className="flex flex-col p-5 bg-surface border border-rose-500/30 rounded-xl shadow-xs select-none">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground truncate font-heading">
                {repository.name}
              </h3>
              <p className="text-xs text-subtle truncate mt-0.5" title={repository.url}>
                {repository.url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20">
            FAILED
          </span>
        </div>

        {/* Failure Message */}
        <div className="my-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs">
          <p className="text-rose-300 font-medium">Analysis failed</p>
          <p className="text-muted mt-1 text-[11px] leading-relaxed">
            {errorMessage}
          </p>
          {retryError && (
            <p className="text-rose-400 mt-2 text-[10px] font-mono">{retryError}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
            Added {formattedDate}
          </span>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw
              size={12}
              className={cn("text-accent", isRetrying && "animate-spin")}
            />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 3. READY STATE ---
  return (
    <Link
      href={`/repository/${repository.id}/overview`}
      className="group flex flex-col p-5 bg-surface border border-border rounded-xl hover:border-accent/40 hover:bg-surface-elevated/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent group-hover:scale-105 transition-transform">
          <FolderGit2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground truncate font-heading group-hover:text-accent transition-colors">
            {repository.name}
          </h3>
          <p className="text-xs text-subtle truncate mt-0.5" title={repository.url}>
            {repository.url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
          Added {formattedDate}
        </span>
        <span className="text-muted group-hover:text-foreground transition-colors">
          <ExternalLink size={14} />
        </span>
      </div>
    </Link>
  );
}
