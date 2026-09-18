"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { RepositorySidebar } from "@/components/explorer/RepositorySidebar";
import { repositoriesApi } from "@/api/repositories";
import { useRepositoryStatus, STAGE_STEPS } from "@/hooks/useRepositoryStatus";
import {
  FolderGit2,
  Loader2,
  AlertTriangle,
  RotateCw,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RepositoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams =
    typeof (params as any).then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });
  const id = unwrappedParams.id;

  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const { data: repository, isLoading: isRepoLoading } = useQuery({
    queryKey: ["repository", id],
    queryFn: () => repositoriesApi.get(id),
    enabled: !!id && !!user,
  });

  const {
    status,
    stageLabel,
    stepIndex,
    errorMessage,
    isQueued,
    isProcessing,
    isFailed,
  } = useRepositoryStatus(id, {
    initialStatus: repository?.status,
    initialStage: repository?.currentStage,
    enabled: !!id && !!repository,
  });

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setRetryError("");
      await repositoriesApi.retry(id);
      await queryClient.invalidateQueries({ queryKey: ["repository"] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setRetryError(error.response?.data?.message || "Failed to retry analysis");
    } finally {
      setIsRetrying(false);
    }
  };

  if (isAuthLoading || isRepoLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-muted/30 border-t-accent rounded-full animate-spin" />
          <span className="text-sm font-mono text-muted">Loading repository...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // --- Processing / In-Progress Screen ---
  if (isQueued || isProcessing) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        <AppHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <div className="flex-1 flex items-center justify-center p-6 bg-surface/30">
          <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-border shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mx-auto flex items-center justify-center text-accent relative">
              <FolderGit2 size={32} />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-accent/40 flex items-center justify-center">
                <Loader2 size={14} className="text-accent animate-spin" />
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold font-heading text-foreground">
                {repository?.name || "Repository"}
              </h2>
              <p className="text-xs text-muted mt-1 truncate">
                {repository?.url}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated/70 border border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>{stageLabel}</span>
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {isQueued ? "Queued" : `Step ${stepIndex + 1}/${STAGE_STEPS.length}`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {STAGE_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
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

            <div className="flex items-center justify-center gap-2 text-xs text-muted font-mono">
              <Clock size={14} className="text-accent" />
              <span>Repository analysis in progress. Please wait...</span>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated border border-border transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Failed Screen ---
  if (isFailed) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        <AppHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <div className="flex-1 flex items-center justify-center p-6 bg-surface/30">
          <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-rose-500/30 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold font-heading text-foreground">
                Analysis Failed
              </h2>
              <p className="text-xs text-muted mt-1 truncate">
                {repository?.name} &bull; {repository?.url}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-left">
              <p className="text-rose-300 font-medium">Failure details:</p>
              <p className="text-muted mt-1.5 leading-relaxed">{errorMessage}</p>
              {retryError && (
                <p className="text-rose-400 mt-2 font-mono text-[11px]">{retryError}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated border border-border transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-background text-xs font-semibold rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <RotateCw
                  size={14}
                  className={cn("text-background", isRetrying && "animate-spin")}
                />
                <span>{isRetrying ? "Retrying..." : "Retry Analysis"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Ready Screen ---
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Global Application Header */}
      <AppHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* Main Repository Shell Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <RepositorySidebar repository={repository} isLoading={isRepoLoading} />

        {/* Content Pane */}
        <main className="flex-1 flex min-h-0 min-w-0 bg-background overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
